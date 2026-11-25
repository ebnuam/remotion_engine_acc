"""Offline procedural SFX & ambience generators for Kok Iso Yo? 2.5D animated shorts."""

from __future__ import annotations

import numpy as np

from dsp import SR, TAU, bp, colored, fades, hp, lp, modal, ns, phase, reson, rng, shape, smooth_noise, tt


def whoosh(
    dur: float = 0.45,
    r: np.random.Generator | None = None,
    peak: float = 0.22,
    f_lo: float = 320.0,
    f_hi: float = 2200.0,
    width: float = 0.85,
    tail: float = 0.18,
    air: float = 0.16,
) -> np.ndarray:
    """Clean camera-whip / cut transition whoosh."""
    r = r or rng(1)
    n = ns(dur)
    if n < 32:
        return np.zeros(n, dtype=np.float64)
    nz = colored(n, r, 0.65)
    t = np.arange(n, dtype=np.float64) / SR
    p_sec = max(0.02, min(dur * 0.7, peak))
    env = np.where(t < p_sec, (t / p_sec) ** 2.0, np.exp(-(t - p_sec) / max(tail, 0.02)))
    fc = lambda T: f_lo + (f_hi - f_lo) * np.interp(
        T, t, np.where(t < p_sec, t / p_sec, np.exp(-(t - p_sec) / max(tail * 1.3, 0.03)))
    )
    y = shape(
        nz,
        lambda T, F: np.exp(-0.5 * (np.log2(np.maximum(F[:, None], 20.0) / fc(T)[None, :]) / width) ** 2),
        1024,
        256,
    )
    y = y * env + air * hp(nz, 4200) * (env**2)
    return fades(y * 0.55, 0.005, 0.04)


def pop_ui(r: np.random.Generator | None = None, pitch: float = 1.0, dur: float = 0.16) -> np.ndarray:
    """Crisp wooden/bubble UI pop for fact cards & data overlays."""
    r = r or rng(2)
    t = tt(dur)
    f0 = 380.0 * pitch * (1.0 + 1.4 * np.exp(-t / 0.012)) * (1.0 - 0.15 * t / max(dur, 0.01))
    body = np.sin(phase(f0)) * np.exp(-t / 0.024)
    click = bp(r.standard_normal(len(t)), 1400, 4800, 1) * np.exp(-t / 0.003) * 0.35
    return fades((body * 0.8 + click) * 0.7, 0.0003, 0.02)


def chime_reveal(r: np.random.Generator | None = None, base: float = 880.0, dur: float = 1.1) -> np.ndarray:
    """Two-note documentary wonder/discovery chime."""
    r = r or rng(3)
    n = ns(dur)
    y = np.zeros(n, dtype=np.float64)
    for delay, ratio, amp in ((0.0, 1.0, 0.65), (0.09, 1.498, 0.5)):
        k = ns(delay)
        rem = max(0.2, dur - delay)
        note = modal(rem, [(base * ratio, 1.0, 0.45), (base * ratio * 2.0, 0.25, 0.2)], r)
        note = fades(note * (1.0 - np.exp(-tt(rem) / 0.002)), 0.0005, 0.08)
        m = min(len(note), n - k)
        if m > 0:
            y[k : k + m] += note[:m] * amp
    return y


def tick_pulse(r: np.random.Generator | None = None, accent: bool = False, dur: float = 0.09) -> np.ndarray:
    """Precision wooden/mechanical tick for counters, maps, and timelines."""
    r = r or rng(4)
    t = tt(dur)
    f1 = 1950.0 if accent else 1480.0
    f2 = 3400.0 if accent else 2600.0
    y = modal(dur, [(f1, 1.0, 0.009), (f2, 0.55, 0.005)], r)
    snap = hp(r.standard_normal(len(t)), 2800) * np.exp(-t / 0.0012) * 0.3
    return fades((y + snap) * (0.85 if accent else 0.55), 0.0002, 0.01)


def impact_sub(r: np.random.Generator | None = None, weight: float = 1.0, dur: float = 0.85) -> np.ndarray:
    """Controlled cinematic sub-thud for historical/dramatic emphasis."""
    r = r or rng(5)
    t = tt(dur)
    f0 = 76.0 * (1.0 + 0.55 * np.exp(-t / 0.022))
    sub = np.sin(phase(f0)) * np.exp(-t / 0.22) * (1.0 - np.exp(-t / 0.006))
    punch = bp(r.standard_normal(len(t)), 140, 1200, 1) * np.exp(-t / 0.018) * 0.45
    return fades((sub * 0.9 + punch) * weight * 0.7, 0.0005, 0.08)


def clink(r: np.random.Generator | None = None, f: float = 2800.0, decay: float = 0.14) -> np.ndarray:
    r = r or rng(6)
    dur = max(0.18, decay * 4.5)
    modes = [(f, 1.0, decay), (f * 1.71, 0.5, decay * 0.55), (f * 2.63, 0.25, decay * 0.3)]
    y = modal(dur, modes, r)
    return fades(y * 0.55, 0.0002, 0.02)


def rattle(dur: float, r: np.random.Generator, rate: float = 45.0, env: np.ndarray | None = None, heavy: bool = False) -> np.ndarray:
    n = ns(dur)
    y = np.zeros(n, dtype=np.float64)
    tm = 0.0
    while tm < dur:
        k = ns(tm)
        a = 1.0 if env is None else float(env[min(k, len(env) - 1)])
        if a > 0.02:
            c = clink(r, r.uniform(750.0, 2400.0) if heavy else r.uniform(1600.0, 4200.0), 0.035 if heavy else 0.02)
            m = min(len(c), n - k)
            if m > 0:
                y[k : k + m] += c[:m] * a * r.uniform(0.3, 1.0)
        tm += float(r.exponential(1.0 / max(rate, 2.0)))
    return y


def ambience_bed(dur: float, r: np.random.Generator, kind: str = "forest") -> np.ndarray:
    """Soft stereo nature/room ambience bed ('forest', 'river', 'wind')."""
    n = ns(dur)
    if n == 0 or kind == "none":
        return np.zeros((2, n), dtype=np.float64)
    out = np.zeros((2, n), dtype=np.float64)
    if kind == "wind":
        gust = 0.6 + 0.4 * smooth_noise(n, r, 0.16)
        for ch in range(2):
            out[ch] = lp(colored(n, r, 1.0), 750.0, 2) * gust * 0.16
    elif kind == "river":
        for ch in range(2):
            lap = 0.65 + 0.35 * smooth_noise(n, r, 0.45)
            out[ch] = bp(colored(n, r, 0.8), 180.0, 2400.0, 1) * lap * 0.18
    else:  # forest
        gust = 0.55 + 0.45 * smooth_noise(n, r, 0.2)
        for ch in range(2):
            out[ch] = lp(colored(n, r, 0.95), 950.0, 2) * gust * 0.11
        # Sparse distant bird chips
        tm = float(r.uniform(0.6, 2.0))
        while tm < dur - 0.8:
            ch = int(r.integers(2))
            for j in range(int(r.integers(2, 4))):
                L = float(r.uniform(0.04, 0.07))
                tl = tt(L)
                f = float(r.uniform(3400, 5200)) * (1.0 - 0.3 * tl / max(L, 0.01))
                c = np.sin(phase(f)) * (np.sin(np.pi * tl / max(L, 0.01)) ** 2) * 0.08
                k = ns(tm + j * float(r.uniform(0.10, 0.16)))
                m = min(len(c), n - k)
                if m > 0:
                    out[ch, k : k + m] += c[:m]
            tm += float(r.exponential(3.2) + 1.4)
    return fades(out, 0.25, 0.45)
