/**
 * Timing conversion contract -> Kok Iso Yo? `words.json` (`[{ s, e, w }]`).
 * Compatible with `templates/audio-py/mix_audio.py` `load_speech_spans()`.
 *
 * Pure data converters only (no provider-specific I/O).
 */

function parseTimestampSec(raw) {
  const clean = String(raw || "").trim().replace(",", ".");
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

/**
 * Normalizes word/phrase spans into sorted `[{ s, e, w }]` rounded to 3 decimals.
 */
export function normalizeWordSpans(spans = []) {
  const out = [];
  for (const item of Array.isArray(spans) ? spans : []) {
    if (!item || typeof item !== "object") continue;
    const s = Number(item.s ?? item.start);
    const e = Number(item.e ?? item.end);
    const w = String(item.w ?? item.text ?? "").trim();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s || !w) continue;
    out.push({
      s: Number(Math.max(0, s).toFixed(3)),
      e: Number(Math.max(0, e).toFixed(3)),
      w,
    });
  }
  out.sort((a, b) => a.s - b.s || a.e - b.e);
  return out;
}

/**
 * Parses WebVTT (.vtt) or SubRip (.srt) cue blocks into `[{ s, e, w }]`.
 */
export function parseVttOrSrtToWords(content) {
  const lines = String(content || "").replace(/\r\n?/g, "\n").split("\n");
  const spans = [];
  const timeRe = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})/;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(timeRe);
    if (!match) continue;
    const s = parseTimestampSec(match[1]);
    const e = parseTimestampSec(match[2]);
    const textLines = [];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "") {
      textLines.push(lines[j].replace(/<[^>]+>/g, "").trim());
      j += 1;
    }
    const w = textLines.filter(Boolean).join(" ").trim();
    if (s !== null && e !== null && e > s && w) {
      spans.push({ s, e, w });
    }
    i = j;
  }

  return normalizeWordSpans(spans);
}

/**
 * Converts character-level alignment arrays (`characters`, `character_start_times_seconds`,
 * `character_end_times_seconds`) into word-level `[{ s, e, w }]`.
 */
export function convertCharAlignmentToWords(alignment) {
  if (!alignment || typeof alignment !== "object") return [];
  const chars = Array.isArray(alignment.characters) ? alignment.characters : [];
  const starts = Array.isArray(alignment.character_start_times_seconds)
    ? alignment.character_start_times_seconds
    : [];
  const ends = Array.isArray(alignment.character_end_times_seconds)
    ? alignment.character_end_times_seconds
    : [];

  const n = Math.min(chars.length, starts.length, ends.length);
  const words = [];
  let buf = "";
  let wordStart = null;
  let wordEnd = null;

  const flush = () => {
    const w = buf.trim();
    if (w && wordStart !== null && wordEnd !== null && wordEnd > wordStart) {
      words.push({ s: wordStart, e: wordEnd, w });
    }
    buf = "";
    wordStart = null;
    wordEnd = null;
  };

  for (let i = 0; i < n; i += 1) {
    const ch = String(chars[i] ?? "");
    const st = Number(starts[i]);
    const en = Number(ends[i]);
    if (!ch || /^\s+$/.test(ch)) {
      flush();
      continue;
    }
    if (wordStart === null && Number.isFinite(st)) wordStart = st;
    if (Number.isFinite(en)) wordEnd = en;
    buf += ch;
  }
  flush();

  return normalizeWordSpans(words);
}
