// ── The social cards' committed faces ───────────────────────────────────────
// Three fonts, all read from disk — the card path never fetches:
//
//   · Geist Regular — next's own compiled @vercel/og file, FIRST in the list
//     (the same rule lib/og.tsx documents: satori resolves un-familied text
//     and per-glyph fallback in insertion order, and a leading local face is
//     what keeps a stray glyph from becoming a Google Fonts fetch).
//   · Literata — assets/fonts/literata-social-subset.ttf, the display AND
//     reading voice. Latin + Latin-Extended charset instanced at the site
//     header's wght 420 / opsz 36 (the wordmark subset's instance, so the
//     two are one voice). Regeneration recipe in docs/social-surface.md.
//   · IBM Plex Mono — assets/fonts/plexmono-social-subset.ttf, the
//     cartographic-detail voice (years, codes, eyebrows, source lines).
//
// Declared weight is 400 everywhere (satori's Weight union has no 420; the
// Literata file is already instanced at 420, so the declaration only routes
// matching). Cached per process; satori wants ArrayBuffers.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

let fontsPromise = null;

/** ImageResponse `fonts` for every social card. */
export function socialFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(root, "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")),
    readFile(join(root, "assets/fonts/literata-social-subset.ttf")),
    readFile(join(root, "assets/fonts/plexmono-social-subset.ttf")),
  ]).then(([geist, literata, mono]) => [
    { name: "geist", data: toArrayBuffer(geist), weight: 400, style: "normal" },
    { name: "Literata", data: toArrayBuffer(literata), weight: 400, style: "normal" },
    { name: "mono", data: toArrayBuffer(mono), weight: 400, style: "normal" },
  ]);
  return fontsPromise;
}
