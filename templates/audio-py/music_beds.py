"""Parameterized offline documentary music bed renderer for Kok Iso Yo? episodes."""

from __future__ import annotations

import numpy as np

from dsp import convolve_st, lp, make_ir, norm_to, ns, place, rng, fades
from instruments import brass, brush, cymbal, glock, m2f, musicbox, pad, pluck, snare, timpani, vibes


def _loop_chord_prog(preset: str) -> tuple[float, list[tuple[int, list[int], int]]]:
    """Return (bar_dur_sec, list of (bass_midi, triad_midis, top_midi)) per bar."""
    if preset == "march_tension":
        # 108 BPM, 4/4 (bar = 2.222s): C minor documentary tension
        return 2.2222, [
            (48, [60, 63, 67], 72),
            (44, [56, 60, 63], 70),
            (46, [58, 62, 65], 70),
            (43, [55, 59, 62], 67),
        ]
    if preset == "wonder_calm":
        # 84 BPM, 4/4 (bar = 2.857s): F major 9 warm discovery
        return 2.8571, [
            (41, [65, 69, 72], 76),
            (45, [64, 67, 72], 79),
            (46, [65, 70, 74], 77),
            (48, [64, 67, 72], 76),
        ]
    # Default: curious_doc (96 BPM, 4/4 -> bar = 2.500s): D Dorian / warm curious groove
    return 2.5000, [
        (50, [62, 65, 69], 74),
        (48, [60, 64, 67], 72),
        (46, [58, 62, 65], 74),
        (45, [57, 61, 64], 76),
    ]


def render_music_bed(
    dur: float,
    preset: str = "curious_doc",
    seed: int = 2026,
    ref_lufs: float = -20.0,
    room_wet: float = 0.26,
) -> np.ndarray:
    """Render an adaptive stereo documentary music bed of `dur` seconds at `ref_lufs`."""
    n = ns(dur)
    if n == 0 or preset == "none":
        return np.zeros((2, n), dtype=np.float64)

    r = rng(seed)
    dry = np.zeros((2, n), dtype=np.float64)
    send = np.zeros((2, n), dtype=np.float64)

    bar_dur, prog = _loop_chord_prog(preset)
    step = bar_dur / 8.0
    n_bars = int(np.ceil(dur / bar_dur))

    for bi in range(n_bars):
        t0 = bi * bar_dur
        if t0 >= dur - 0.15:
            break
        bass_m, triad, top_m = prog[bi % len(prog)]
        # Pad swell every 1-2 bars
        if bi % 2 == 0 or preset == "march_tension":
            pad_dur = min(bar_dur * (1.85 if preset != "march_tension" else 0.95), max(0.3, dur - t0))
            p_sig = pad(
                [m2f(m) for m in triad],
                pad_dur,
                vel=0.22 if preset != "wonder_calm" else 0.28,
                r=r,
                att=0.45,
                rel=0.65,
                warm=820.0,
            )
            place(dry, p_sig, t0, gain=0.65)
            place(send, p_sig, t0, gain=0.45)

        if preset == "march_tension":
            # Rhythmic pulse + low horn + tight snare
            for si in range(8):
                ts = t0 + si * step
                if ts >= dur - 0.05:
                    break
                if si in (0, 3, 6):
                    sig = pluck(m2f(bass_m), vel=0.55 if si == 0 else 0.38, r=r, dur=0.55, bright=0.4)
                    place(dry, sig, ts, p=-0.1)
                if si in (0, 2, 4, 6):
                    s_sig = snare(vel=0.32 if si % 4 == 0 else 0.22, r=r, dur=0.22, snappy=0.75)
                    place(dry, s_sig, ts, p=0.15)
                    place(send, s_sig, ts, p=0.15, gain=0.35)
                if si in (1, 5):
                    g_sig = vibes(m2f(triad[si % len(triad)]), vel=0.24, r=r, dur=0.9)
                    place(dry, g_sig, ts, p=-0.35)
                    place(send, g_sig, ts, p=-0.35, gain=0.6)
            if bi % 4 == 0:
                t_sig = timpani(m2f(bass_m), vel=0.42, r=r, dur=1.2)
                place(dry, t_sig, t0, p=0.0)
            if bi % 2 == 1:
                br_sig = brass(m2f(bass_m + 12), min(bar_dur * 0.7, dur - t0), vel=0.24, r=r, bright=0.55)
                place(dry, br_sig, t0, p=-0.2)
                place(send, br_sig, t0, p=-0.2, gain=0.5)

        elif preset == "wonder_calm":
            # Gentle musicbox/vibes arpeggio + airy bell accents
            arp = [triad[0], triad[1], triad[2], top_m, triad[2], triad[1], triad[0], top_m + 4]
            for si, midi in enumerate(arp):
                ts = t0 + si * step
                if ts >= dur - 0.05:
                    break
                if si % 2 == 0 or r.uniform() < 0.55:
                    mb = musicbox(m2f(midi + (12 if si in (3, 7) else 0)), vel=0.28, r=r, dur=1.1)
                    pan_pos = -0.35 + 0.7 * (si / 7.0)
                    place(dry, mb, ts, p=pan_pos)
                    place(send, mb, ts, p=pan_pos, gain=0.7)
            if bi % 2 == 0:
                vb = vibes(m2f(bass_m + 12), vel=0.3, r=r, dur=1.6)
                place(dry, vb, t0, p=0.2)
                place(send, vb, t0, p=0.2, gain=0.55)

        else:
            # curious_doc: warm pizzicato/pluck pattern + gentle vibes + subtle brush groove
            arp = [bass_m, triad[1], triad[2], triad[0] + 12, bass_m + 7, triad[1], top_m, triad[2]]
            for si, midi in enumerate(arp):
                ts = t0 + si * step
                if ts >= dur - 0.05:
                    break
                is_bass = si in (0, 4)
                pl = pluck(
                    m2f(midi),
                    vel=0.45 if is_bass else 0.30,
                    r=r,
                    dur=0.65 if is_bass else 0.48,
                    bright=0.35 if is_bass else 0.55,
                )
                pan_pos = 0.0 if is_bass else (-0.3 if si % 2 else 0.3)
                place(dry, pl, ts, p=pan_pos)
                place(send, pl, ts, p=pan_pos, gain=0.4)
                if si in (2, 6):
                    br = brush(vel=0.26, r=r, dur=0.22, swish=(si == 6))
                    place(dry, br, ts, p=0.18)
            if bi % 2 == 0:
                vb = vibes(m2f(top_m), vel=0.26, r=r, dur=1.4)
                place(dry, vb, t0, p=0.32)
                place(send, vb, t0, p=0.32, gain=0.65)
                if bi % 4 == 2 and t0 + step < dur - 0.2:
                    gl = glock(m2f(top_m + 12), vel=0.18, r=r, dur=1.0)
                    place(dry, gl, t0 + step, p=-0.38)
                    place(send, gl, t0 + step, p=-0.38, gain=0.75)

    if preset == "march_tension" and dur > 12.0:
        cym = cymbal(vel=0.24, r=r, dur=1.8, bright=0.85)
        place(dry, cym, min(dur - 2.0, bar_dur * 4.0), p=0.25)

    ir = make_ir(rt60=0.65, dur=1.0, damp_hz=3600.0, seed=seed + 11)
    wet = convolve_st(send, ir)
    mix = dry + wet * room_wet
    # Keep low-end clean so VO remains crisp on phone speakers
    mix = mix * 0.85 + lp(mix, 900.0, order=1) * 0.15
    mix = fades(mix, 0.12, min(0.65, dur * 0.15))
    return norm_to(mix, ref_lufs)
