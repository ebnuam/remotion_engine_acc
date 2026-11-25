"""Offline synthesized instruments for Kok Iso Yo? documentary & narrative music beds."""

from __future__ import annotations

import numpy as np
from scipy import signal

from dsp import SR, TAU, bp, fades, hp, lp, modal, ns, peq, phase, ramp, reson, rng, smooth_noise, tt


def m2f(midi: float) -> float:
    """MIDI note number to Hz (A4=69 -> 440 Hz)."""
    return 440.0 * (2.0 ** ((float(midi) - 69.0) / 12.0))


def _env(n: int, att_sec: float, sus_n: int, rel_sec: float, dec_pow: float = 1.0) -> np.ndarray:
    e = np.zeros(n, dtype=np.float64)
    na = min(n, ns(att_sec))
    if na > 0:
        e[:na] = ramp(na)
    s_end = min(n, max(na, sus_n))
    if s_end > na:
        u = np.linspace(0.0, 1.0, s_end - na)
        e[na:s_end] = 1.0 - 0.18 * (u ** dec_pow)
    if n > s_end:
        rel_n = min(n - s_end, max(1, ns(rel_sec)))
        tail = e[s_end - 1] if s_end > 0 else 1.0
        e[s_end : s_end + rel_n] = tail * ramp(rel_n)[::-1]
    return e


def glock(f: float, vel: float = 0.7, r: np.random.Generator | None = None, dur: float = 1.6) -> np.ndarray:
    r = r or rng(0)
    t = tt(dur)
    modes = [
        (f, 1.0, 0.9),
        (f * 2.756, 0.45, 0.42),
        (f * 5.404, 0.22, 0.20),
        (f * 8.933, 0.10, 0.09),
    ]
    y = modal(dur, modes, r)
    click = bp(r.standard_normal(len(t)), 2500, 9000, 1) * np.exp(-t / 0.002) * 0.35
    return fades((y + click) * vel * (1.0 - np.exp(-t / 0.0008)), 0.0003, 0.08)


def vibes(f: float, vel: float = 0.7, r: np.random.Generator | None = None, dur: float = 2.0, trem_hz: float = 4.6) -> np.ndarray:
    r = r or rng(0)
    t = tt(dur)
    modes = [(f, 1.0, 1.35), (f * 3.98, 0.35, 0.48), (f * 9.8, 0.12, 0.18)]
    y = modal(dur, modes, r)
    y *= 0.86 + 0.14 * np.sin(TAU * trem_hz * t + r.uniform(0.0, TAU))
    mallet = lp(r.standard_normal(len(t)), 1100, 2) * np.exp(-t / 0.006) * 0.35
    return fades((y + mallet) * vel * (1.0 - np.exp(-t / 0.002)), 0.0005, 0.12)


def musicbox(f: float, vel: float = 0.7, r: np.random.Generator | None = None, dur: float = 1.5) -> np.ndarray:
    r = r or rng(0)
    t = tt(dur)
    modes = [(f, 1.0, 0.65), (f * 2.003, 0.32, 0.35), (f * 3.01, 0.14, 0.16)]
    y = modal(dur, modes, r)
    ping = hp(r.standard_normal(len(t)), 3500) * np.exp(-t / 0.0012) * 0.18
    return fades((y + ping) * vel * (1.0 - np.exp(-t / 0.0004)), 0.0002, 0.06)


def pluck(f: float, vel: float = 0.7, r: np.random.Generator | None = None, dur: float = 0.9, bright: float = 0.5, pos: float = 0.17) -> np.ndarray:
    """Warm plucked string / marimba-pizzicato ostinato voice."""
    r = r or rng(0)
    t = tt(dur)
    K = max(1, int(min(26, 6500 / max(f, 40.0))))
    tau0 = 0.52 * (110.0 / max(f, 40.0)) ** 0.35
    y = np.zeros_like(t)
    for k in range(1, K + 1):
        ak = abs(np.sin(np.pi * k * pos)) / (k ** (1.35 - 0.55 * bright))
        tau = tau0 / (1.0 + 0.42 * (k - 1) * (f / 150.0) ** 0.4)
        fk = k * f * np.sqrt(1.0 + 2e-5 * k * k)
        if fk < SR * 0.48:
            y += ak * np.exp(-t / tau) * np.sin(TAU * fk * t + r.uniform(0.0, TAU))
    y += lp(r.standard_normal(len(t)), 700) * np.exp(-t / 0.008) * 0.14
    return fades(y * vel * (1.0 - np.exp(-t / 0.0015)), 0.0005, 0.06)


def brass(f: float, dur: float, vel: float = 0.7, r: np.random.Generator | None = None, bright: float = 0.7, rel: float = 0.08) -> np.ndarray:
    """Warm documentary brass horn/baritone swell."""
    r = r or rng(0)
    n = ns(dur + rel)
    t = np.arange(n, dtype=np.float64) / SR
    env = _env(n, 0.032, ns(dur), rel, 1.3)
    vib = 6.0 * np.clip((t - 0.22) / 0.25, 0.0, 1.0) * np.sin(TAU * 4.8 * t + r.uniform(0.0, TAU))
    cents = 14.0 * np.exp(-t / 0.025) + vib + 2.5 * smooth_noise(n, r, 3.0)
    ph = phase(f * (2.0 ** (cents / 1200.0)))
    K = max(2, int(min(18, 4200.0 / max(f, 40.0))))
    y = np.zeros(n, dtype=np.float64)
    cutoff = 280.0 + 1800.0 * vel * bright
    for k in range(1, K + 1):
        roll = 1.0 / (k * (1.0 + (k * f / cutoff) ** 2))
        y += roll * np.sin(k * ph + r.uniform(0.0, 0.35))
    body = reson(y, 185.0, 2.2) * 0.25 + y * 0.85
    return fades(body * env * vel, 0.003, rel)


def pad(
    freqs: list[float] | tuple[float, ...],
    dur: float,
    vel: float = 0.5,
    r: np.random.Generator | None = None,
    att: float = 0.6,
    rel: float = 0.9,
    warm: float = 900.0,
    detune: float = 7.0,
) -> np.ndarray:
    """Warm stereo analog string pad."""
    r = r or rng(0)
    n = ns(dur + rel)
    t = np.arange(n, dtype=np.float64) / SR
    env = np.ones(n, dtype=np.float64)
    a = min(n, ns(att))
    if a > 0:
        env[:a] = ramp(a)
    d = min(n, ns(dur))
    if n > d:
        env[d:] *= ramp(n - d)[::-1]
    out = np.zeros((2, n), dtype=np.float64)
    for f in freqs:
        for dc, pn in ((-detune, -0.6), (0.0, 0.0), (detune, 0.6)):
            cents = dc + 3.0 * np.sin(TAU * r.uniform(0.15, 0.4) * t + r.uniform(0.0, TAU))
            ph = phase(f * (2.0 ** (cents / 1200.0)))
            K = max(1, int(min(26, 3800.0 / max(f, 40.0))))
            y = np.zeros(n, dtype=np.float64)
            for k in range(1, K + 1):
                y += (1.0 / k) / (1.0 + (k * f / warm) ** 2) * np.sin(k * ph + r.uniform(0.0, TAU))
            th = (pn + 1.0) * np.pi / 4.0
            out[0] += y * np.cos(th)
            out[1] += y * np.sin(th)
    return out * env[None, :] * vel / np.sqrt(max(1, len(freqs) * 3))


def snare(vel: float = 0.7, r: np.random.Generator | None = None, dur: float = 0.30, tune: float = 1.0, snappy: float = 0.9) -> np.ndarray:
    r = r or rng(0)
    n = ns(dur)
    t = np.arange(n, dtype=np.float64) / SR
    f0 = 196.0 * tune * (1.0 + 0.07 * vel * np.exp(-t / 0.01))
    ph = phase(f0)
    body = (
        0.9 * np.exp(-t / 0.05) * np.sin(ph)
        + 0.45 * np.exp(-t / 0.032) * np.sin(1.593 * ph + 1.0)
        + 0.25 * np.exp(-t / 0.025) * np.sin(2.136 * ph + 2.0)
    )
    nz = r.standard_normal(n)
    wires = peq(bp(nz, 1700, 10000, 2) * np.exp(-t / (0.05 + 0.06 * vel)) * (1.0 - np.exp(-t / 0.0012)), 4200, 3.0, 0.8)
    click = hp(r.standard_normal(n), 2500) * np.exp(-t / 0.0007)
    y = 0.55 * body * (vel ** 1.2) + 0.8 * snappy * wires * (vel ** 1.15) + 0.25 * click * vel
    return fades(y, 0.0002, 0.02)


def brush(vel: float = 0.45, r: np.random.Generator | None = None, dur: float = 0.28, swish: bool = False) -> np.ndarray:
    r = r or rng(0)
    n = ns(dur)
    t = np.arange(n, dtype=np.float64) / SR
    nz = bp(r.standard_normal(n), 1000, 8500, 1)
    if swish:
        e = np.sin(np.pi * np.clip(t / max(dur, 1e-4), 0.0, 1.0)) ** 1.5
    else:
        e = np.exp(-t / 0.04) * (1.0 - np.exp(-t / 0.003))
    return nz * e * vel * 0.45


def timpani(f: float, vel: float = 0.75, r: np.random.Generator | None = None, dur: float = 1.8) -> np.ndarray:
    r = r or rng(0)
    t = tt(dur)
    modes = [(f, 1.0, 1.3), (f * 1.504, 0.5, 0.8), (f * 1.99, 0.3, 0.45)]
    y = modal(dur, modes, r, glide=0.025 * vel, glide_tau=0.06)
    thump = lp(r.standard_normal(len(t)), 380, 2) * np.exp(-t / 0.018) * 0.85
    return fades((y + thump) * vel, 0.001, 0.1)


def cymbal(vel: float = 0.65, r: np.random.Generator | None = None, dur: float = 2.0, bright: float = 1.0) -> np.ndarray:
    r = r or rng(0)
    n = ns(dur)
    t = np.arange(n, dtype=np.float64) / SR
    y = np.zeros(n, dtype=np.float64)
    fs = np.exp(r.uniform(np.log(380.0), np.log(12000.0), 110))
    for f in fs:
        tau = 1.4 * (900.0 / f) ** 0.45
        y += r.uniform(0.3, 1.0) * np.exp(-t / tau) * np.sin(TAU * f * t + r.uniform(0.0, TAU)) / np.sqrt(110.0)
    hiss = hp(r.standard_normal(n), 5200, 2) * np.exp(-t / (0.65 * bright)) * 0.55
    y = (y + hiss) * (1.0 - np.exp(-t / 0.002))
    return fades(y * vel, 0.0005, 0.2)
