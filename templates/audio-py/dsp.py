"""DSP, filters, stereo/room IR, ITU-R BS.1770-4 loudness, look-ahead limiter, and WAV I/O."""

from __future__ import annotations

import os
import subprocess
import wave
from pathlib import Path
from typing import Callable, Iterable, Sequence

import numpy as np
from scipy import ndimage, signal

SR = 48000
TAU = 2.0 * np.pi


def ns(t: float) -> int:
    """Convert seconds to integer sample count at SR=48000."""
    return max(0, int(round(float(t) * SR)))


def tt(dur: float) -> np.ndarray:
    """Time axis [0, dur) in seconds at SR=48000."""
    return np.arange(ns(dur), dtype=np.float64) / SR


def dbg(db: float) -> float:
    """Convert decibels to linear amplitude gain."""
    return 10.0 ** (float(db) / 20.0)


def g2db(g: float) -> float:
    """Convert linear amplitude gain to decibels."""
    return 20.0 * np.log10(max(float(g), 1e-12))


def rng(seed: int = 0) -> np.random.Generator:
    """Deterministic NumPy PRNG."""
    return np.random.default_rng(int(seed))


# ------------------------------------------------------------------ filters
def _to_mono(x: np.ndarray) -> np.ndarray:
    return np.asarray(x, dtype=np.float64)


def lp(x: np.ndarray, fc: float, order: int = 2) -> np.ndarray:
    fc = float(np.clip(fc, 5.0, SR * 0.49))
    sos = signal.butter(order, fc / (SR * 0.5), btype="low", output="sos")
    return signal.sosfilt(sos, _to_mono(x), axis=-1)


def hp(x: np.ndarray, fc: float, order: int = 2) -> np.ndarray:
    fc = float(np.clip(fc, 5.0, SR * 0.49))
    sos = signal.butter(order, fc / (SR * 0.5), btype="high", output="sos")
    return signal.sosfilt(sos, _to_mono(x), axis=-1)


def bp(x: np.ndarray, f_lo: float, f_hi: float, order: int = 2) -> np.ndarray:
    f_lo = float(np.clip(f_lo, 5.0, SR * 0.48))
    f_hi = float(np.clip(max(f_hi, f_lo + 5.0), 10.0, SR * 0.49))
    sos = signal.butter(order, [f_lo / (SR * 0.5), f_hi / (SR * 0.5)], btype="band", output="sos")
    return signal.sosfilt(sos, _to_mono(x), axis=-1)


def _peq_sos(fc: float, gain_db: float, q: float) -> np.ndarray:
    w0 = TAU * np.clip(fc, 10.0, SR * 0.49) / SR
    A = 10.0 ** (gain_db / 40.0)
    alpha = np.sin(w0) / (2.0 * max(q, 0.05))
    cw = np.cos(w0)
    b0 = 1.0 + alpha * A
    b1 = -2.0 * cw
    b2 = 1.0 - alpha * A
    a0 = 1.0 + alpha / A
    a1 = -2.0 * cw
    a2 = 1.0 - alpha / A
    return np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]], dtype=np.float64)


def peq(x: np.ndarray, fc: float, gain_db: float, q: float = 1.0) -> np.ndarray:
    if abs(gain_db) < 1e-4:
        return _to_mono(x).copy()
    return signal.sosfilt(_peq_sos(fc, gain_db, q), _to_mono(x), axis=-1)


def shelf(x: np.ndarray, fc: float, gain_db: float, high: bool = True, slope: float = 0.8) -> np.ndarray:
    if abs(gain_db) < 1e-4:
        return _to_mono(x).copy()
    w0 = TAU * np.clip(fc, 10.0, SR * 0.49) / SR
    A = 10.0 ** (gain_db / 40.0)
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / 2.0 * np.sqrt(max(0.05, (A + 1.0 / A) * (1.0 / slope - 1.0) + 2.0))
    sq = 2.0 * np.sqrt(A) * alpha
    if high:
        b0 = A * ((A + 1.0) + (A - 1.0) * cw + sq)
        b1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cw)
        b2 = A * ((A + 1.0) + (A - 1.0) * cw - sq)
        a0 = (A + 1.0) - (A - 1.0) * cw + sq
        a1 = 2.0 * ((A - 1.0) - (A + 1.0) * cw)
        a2 = (A + 1.0) - (A - 1.0) * cw - sq
    else:
        b0 = A * ((A + 1.0) - (A - 1.0) * cw + sq)
        b1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cw)
        b2 = A * ((A + 1.0) - (A - 1.0) * cw - sq)
        a0 = (A + 1.0) + (A - 1.0) * cw + sq
        a1 = -2.0 * ((A - 1.0) + (A + 1.0) * cw)
        a2 = (A + 1.0) + (A - 1.0) * cw - sq
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]], dtype=np.float64)
    return signal.sosfilt(sos, _to_mono(x), axis=-1)


def reson(x: np.ndarray, fc: float, q: float = 8.0) -> np.ndarray:
    w0 = TAU * np.clip(fc, 10.0, SR * 0.49) / SR
    alpha = np.sin(w0) / (2.0 * max(q, 0.2))
    cw = np.cos(w0)
    b0 = alpha
    b1 = 0.0
    b2 = -alpha
    a0 = 1.0 + alpha
    a1 = -2.0 * cw
    a2 = 1.0 - alpha
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]], dtype=np.float64)
    return signal.sosfilt(sos, _to_mono(x), axis=-1)


def resbank(x: np.ndarray, modes: Sequence[tuple[float, float, float]]) -> np.ndarray:
    out = np.zeros_like(_to_mono(x))
    for fc, q, gain in modes:
        if fc < SR * 0.48:
            out += reson(x, fc, q) * gain
    return out


# ------------------------------------------------------- noise & waveforms
def colored(n: int, r: np.random.Generator, slope: float = 0.5) -> np.ndarray:
    if n <= 0:
        return np.zeros(0, dtype=np.float64)
    wn = r.standard_normal(n)
    spec = np.fft.rfft(wn)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    w = (np.maximum(freqs, 20.0) / 1000.0) ** (-slope)
    w[0] = 0.0
    y = np.fft.irfft(spec * w, n=n)
    sd = np.std(y)
    return y / (sd + 1e-12)


def smooth_noise(n: int, r: np.random.Generator, cutoff_hz: float = 1.5) -> np.ndarray:
    if n <= 16:
        return np.zeros(n, dtype=np.float64)
    wn = r.standard_normal(n)
    if n <= 64:
        return ndimage.uniform_filter1d(wn, max(1, n // 4), mode="nearest")
    sos = signal.butter(2, np.clip(cutoff_hz / (SR * 0.5), 1e-5, 0.9), output="sos")
    y = signal.sosfiltfilt(sos, wn)
    return y / (np.max(np.abs(y)) + 1e-12)


def ramp(n: int) -> np.ndarray:
    if n <= 0:
        return np.zeros(0, dtype=np.float64)
    return 0.5 - 0.5 * np.cos(np.pi * np.linspace(0.0, 1.0, n))


def fades(x: np.ndarray, t_in: float = 0.005, t_out: float = 0.02) -> np.ndarray:
    y = np.asarray(x, dtype=np.float64).copy()
    n = y.shape[-1]
    ni = min(n, ns(t_in))
    no = min(n, ns(t_out))
    if ni > 0:
        r_in = ramp(ni)
        y[..., :ni] *= r_in
    if no > 0:
        r_out = ramp(no)[::-1]
        y[..., -no:] *= r_out
    return y


def phase(f: np.ndarray | float) -> np.ndarray:
    f_arr = np.asarray(f, dtype=np.float64)
    return np.cumsum(TAU * f_arr / SR)


def shape(
    x: np.ndarray,
    weight_fn: Callable[[np.ndarray, np.ndarray], np.ndarray],
    nperseg: int = 1024,
    hop: int = 256,
) -> np.ndarray:
    """Time-varying spectral shaper via STFT/ISTFT."""
    x = _to_mono(x)
    if len(x) < 16:
        return x.copy()
    f, t_ax, Zxx = signal.stft(x, fs=SR, nperseg=nperseg, noverlap=nperseg - hop)
    W = np.asarray(weight_fn(t_ax, f), dtype=np.float64)
    _, y = signal.istft(Zxx * W, fs=SR, nperseg=nperseg, noverlap=nperseg - hop)
    if len(y) >= len(x):
        return y[: len(x)]
    return np.pad(y, (0, len(x) - len(y)))


def modal(
    dur: float,
    modes: Sequence[tuple[float, float, float]],
    r: np.random.Generator,
    glide: float = 0.0,
    glide_tau: float = 0.04,
) -> np.ndarray:
    n = ns(dur)
    t = np.arange(n, dtype=np.float64) / SR
    y = np.zeros(n, dtype=np.float64)
    pitch_env = 1.0 + glide * np.exp(-t / max(glide_tau, 1e-4))
    for f, amp, tau in modes:
        if f >= SR * 0.48:
            continue
        ph = phase(f * pitch_env) if glide != 0.0 else TAU * f * t
        y += amp * np.exp(-t / max(tau, 1e-4)) * np.sin(ph + r.uniform(0.0, TAU))
    return y


# --------------------------------------------------------- stereo & reverb
def st(x: np.ndarray) -> np.ndarray:
    arr = np.asarray(x, dtype=np.float64)
    if arr.ndim == 2:
        if arr.shape[0] == 2:
            return arr
        return np.vstack([arr[0], arr[0]])
    return np.vstack([arr, arr])


def pan(x: np.ndarray, p: float = 0.0) -> np.ndarray:
    """Equal-power stereo panner with p in [-1, 1]."""
    mono = np.asarray(x, dtype=np.float64)
    if mono.ndim == 2:
        mono = mono.mean(axis=0)
    th = (float(np.clip(p, -1.0, 1.0)) + 1.0) * (np.pi * 0.25)
    return np.vstack([mono * np.cos(th), mono * np.sin(th)])


def place(out: np.ndarray, sig: np.ndarray, t0: float, p: float | None = None, gain: float = 1.0) -> None:
    """Mix mono or stereo `sig` into stereo buffer `out` starting at `t0` seconds."""
    k = ns(t0)
    if k >= out.shape[1]:
        return
    seg = pan(sig, p) if (sig.ndim == 1 or p is not None) else st(sig)
    if gain != 1.0:
        seg = seg * gain
    m = min(seg.shape[1], out.shape[1] - k)
    if m > 0:
        out[:, k : k + m] += seg[:, :m]


def widen(x: np.ndarray, r: np.random.Generator, max_ms: float = 12.0, amount: float = 0.7) -> np.ndarray:
    """Subtle stereo Haas/decorrelation widener from mono signal."""
    mono = _to_mono(x)
    d = max(1, int(round(max_ms * 0.001 * SR)))
    r_ch = np.pad(mono, (d, 0))[: len(mono)]
    left = mono + amount * 0.15 * smooth_noise(len(mono), r, 8.0) * 0.0
    right = (1.0 - amount) * mono + amount * r_ch
    return np.vstack([left, right])


def make_ir(rt60: float = 0.55, dur: float = 1.1, damp_hz: float = 3800.0, seed: int = 7) -> np.ndarray:
    """Synthesize a clean stereo room impulse response (early reflections + damped tail)."""
    r = rng(seed)
    n = ns(dur)
    t = np.arange(n, dtype=np.float64) / SR
    decay = np.exp(-6.9078 * t / max(rt60, 0.05))
    ir = np.zeros((2, n), dtype=np.float64)
    for ch in range(2):
        tail = lp(r.standard_normal(n), damp_hz, order=1) * decay * 0.18
        tail[: ns(0.015)] *= ramp(ns(0.015))
        # Early reflections
        for tm_ms in (9.0, 14.5, 21.0, 31.0, 44.0):
            idx = ns((tm_ms + r.uniform(-2.0, 2.5)) * 0.001)
            if 0 <= idx < n:
                tail[idx] += r.uniform(0.18, 0.35) * (1 if r.uniform() > 0.3 else -1)
        tail = hp(tail, 110.0, order=1)
        ir[ch] = tail
    norm = np.sqrt(np.mean(np.sum(ir**2, axis=1))) + 1e-12
    return ir / norm


def convolve_st(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    """FFT stereo convolution trimmed to input length + short tail."""
    x_st = st(x)
    out = np.zeros((2, x_st.shape[1]), dtype=np.float64)
    for ch in range(2):
        c = signal.fftconvolve(x_st[ch], ir[ch], mode="full")[: x_st.shape[1]]
        out[ch] = c
    return out


# -------------------------------------------- ITU-R BS.1770-4 & true peak
def _bs1770_k_sos() -> np.ndarray:
    """Exact published BS.1770-4 stage 1 (high-shelf) + stage 2 (RLB high-pass) at 48 kHz."""
    stage1 = [
        1.53512485958697,
        -2.69169618940638,
        1.19839281085285,
        1.0,
        -1.69065929318241,
        0.73248077421585,
    ]
    stage2 = [
        1.0,
        -2.0,
        1.0,
        1.0,
        -1.99004745483398,
        0.99007225036621,
    ]
    return np.array([stage1, stage2], dtype=np.float64)


_K_SOS = _bs1770_k_sos()


def kfilt(x: np.ndarray) -> np.ndarray:
    return signal.sosfilt(_K_SOS, st(x), axis=-1)


def _block_loudness(kx: np.ndarray, block_sec: float = 0.4, hop_sec: float = 0.1) -> np.ndarray:
    nb = ns(block_sec)
    nh = max(1, ns(hop_sec))
    n = kx.shape[1]
    if n < nb:
        ms = np.mean(kx**2, axis=1).sum()
        return np.array([-0.691 + 10.0 * np.log10(max(ms, 1e-20))])
    sq = np.sum(kx**2, axis=0)
    cs = np.concatenate([[0.0], np.cumsum(sq)])
    starts = np.arange(0, n - nb + 1, nh)
    means = (cs[starts + nb] - cs[starts]) / nb
    return -0.691 + 10.0 * np.log10(np.maximum(means, 1e-20))


def momentary(x: np.ndarray) -> np.ndarray:
    """400 ms momentary loudness every 10 ms (for ducking/measurement)."""
    return _block_loudness(kfilt(x), block_sec=0.4, hop_sec=0.01)


def integrated(x: np.ndarray) -> float:
    """ITU-R BS.1770-4 gated integrated loudness in LUFS."""
    kx = kfilt(x)
    nb = ns(0.4)
    nh = max(1, ns(0.1))
    n = kx.shape[1]
    if n == 0:
        return -np.inf
    if n < nb:
        p = float(np.sum(np.mean(kx**2, axis=1)))
        return -0.691 + 10.0 * np.log10(p) if p > 1e-18 else -np.inf
    sq = np.sum(kx**2, axis=0)
    cs = np.concatenate([[0.0], np.cumsum(sq)])
    starts = np.arange(0, n - nb + 1, nh)
    z = (cs[starts + nb] - cs[starts]) / nb
    lu = -0.691 + 10.0 * np.log10(np.maximum(z, 1e-20))
    keep1 = lu > -70.0
    if not np.any(keep1):
        return -np.inf
    g1 = -0.691 + 10.0 * np.log10(float(np.mean(z[keep1])))
    keep2 = keep1 & (lu >= g1 - 10.0)
    if not np.any(keep2):
        return g1
    return float(-0.691 + 10.0 * np.log10(float(np.mean(z[keep2]))))


def true_peak(x: np.ndarray) -> float:
    """4x oversampled true peak in dBTP."""
    x_st = st(x)
    if x_st.shape[1] == 0:
        return -np.inf
    up = signal.resample_poly(x_st, 4, 1, axis=-1)
    pk = float(np.max(np.abs(up)))
    return g2db(pk) if pk > 1e-12 else -np.inf


def norm_to(x: np.ndarray, target_lufs: float) -> np.ndarray:
    """Scale signal linearly to hit target integrated LUFS."""
    cur = integrated(x)
    if not np.isfinite(cur):
        return np.asarray(x, dtype=np.float64).copy()
    return np.asarray(x, dtype=np.float64) * dbg(target_lufs - cur)


# --------------------------------------------------------- 4x limiter
def limiter(
    x: np.ndarray,
    ceil_db: float = -1.2,
    look: float = 0.003,
    rel: float = 0.08,
) -> tuple[np.ndarray, np.ndarray]:
    """4x-oversampled peak detection, look-ahead min filter, one-pole release, smoothed gain."""
    x_st = st(x)
    c = dbg(ceil_db)
    n = x_st.shape[1]
    if n == 0:
        return x_st, np.ones(0, dtype=np.float64)
    up = np.abs(signal.resample_poly(x_st, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    la = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * la + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        kr = 1.0 - np.exp(-1.0 / (rel * SR))
        gap = ns(rel * 8.0)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, int(b_) + gap)
            seg = g1[a:e]
            out = np.empty(len(seg), dtype=np.float64)
            g = 1.0
            for k in range(len(seg)):
                v = float(seg[k])
                g = min(v, g + (1.0 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * la + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x_st * g3[None, :], g3


# --------------------------------------------------------------- WAV I/O
def read_wav(path: str | os.PathLike[str]) -> np.ndarray:
    """Read 16-bit or 24-bit PCM WAV as float64 array shape (C, N) in [-1, 1]."""
    with wave.open(str(path), "rb") as wf:
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        sr = wf.getframerate()
        n = wf.getnframes()
        raw = wf.readframes(n)
    if sr != SR:
        raise ValueError(f"Expected {SR} Hz WAV, got {sr} Hz: {path}")
    if sw == 2:
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    elif sw == 3:
        b = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3)
        vals = b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16)
        vals = np.where(vals >= 0x800000, vals - 0x1000000, vals)
        data = vals.astype(np.float64) / 8388608.0
    elif sw == 4:
        data = np.frombuffer(raw, dtype=np.int32).astype(np.float64) / 2147483648.0
    else:
        raise ValueError(f"Unsupported WAV sample width {sw} bytes: {path}")
    arr = data.reshape(-1, ch).T
    return arr


def ensure_wav_48k(input_path: str | os.PathLike[str], tmp_dir: str | os.PathLike[str]) -> Path:
    """Ensure any audio input (.mp3/.m4a/.wav) is decoded to 48 kHz 16-bit WAV inside tmp_dir without editing source."""
    src = Path(input_path)
    if not src.exists():
        raise FileNotFoundError(f"Audio input not found: {src}")
    if src.suffix.lower() == ".wav":
        with wave.open(str(src), "rb") as wf:
            if wf.getframerate() == SR and wf.getsampwidth() in (2, 3, 4):
                return src
    dst = Path(tmp_dir) / f"{src.stem}_48k.wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(src),
        "-ar",
        str(SR),
        "-c:a",
        "pcm_s16le",
        str(dst),
    ]
    subprocess.run(cmd, check=True)
    return dst


def write_wav(path: str | os.PathLike[str], x: np.ndarray) -> None:
    """Write float64 audio as 16-bit PCM WAV at SR=48000."""
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    arr = st(x)
    clipped = np.clip(arr, -1.0, 32767.0 / 32768.0)
    pcm = np.round(clipped * 32767.0).astype("<i2").T.tobytes()
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm)
