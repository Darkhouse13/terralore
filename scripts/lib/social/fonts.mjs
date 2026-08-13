// ── The social cards' committed faces ───────────────────────────────────────
// The strata faces, all read from disk — the card path never fetches:
//
//   · Schibsted Grotesk 400 — assets/fonts/schibsted-social-400.ttf, FIRST
//     in the list so it is the default body voice (satori resolves
//     un-familied text and per-glyph fallback in insertion order).
//   · Geist Regular — next's own compiled @vercel/og file, second: the
//     local glyph backstop that keeps a stray glyph from becoming a Google
//     Fonts fetch (the rule lib/og.tsx documents).
//   · Schibsted Grotesk 700 — the bold body voice.
//   · Bricolage Grotesque 800 — assets/fonts/bricolage-social-800.ttf, the
//     stamp voice; answers only to fontFamily "Bricolage".
//   · IBM Plex Mono — assets/fonts/plexmono-social-400.ttf, the instrument
//     voice (years, codes, eyebrows, source lines); fontFamily "mono".
//
// Regeneration recipe: scripts/build-strata-fonts.mjs. Cached per process;
// satori wants ArrayBuffers.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

let fontsPromise = null;

/** ImageResponse `fonts` for every social card. */
export function socialFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(root, "assets/fonts/schibsted-social-400.ttf")),
    readFile(join(root, "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")),
    readFile(join(root, "assets/fonts/schibsted-social-700.ttf")),
    readFile(join(root, "assets/fonts/bricolage-social-800.ttf")),
    readFile(join(root, "assets/fonts/plexmono-social-400.ttf")),
  ]).then(([schibsted, geist, schibsted700, bricolage, mono]) => [
    { name: "Schibsted", data: toArrayBuffer(schibsted), weight: 400, style: "normal" },
    { name: "geist", data: toArrayBuffer(geist), weight: 400, style: "normal" },
    { name: "Schibsted", data: toArrayBuffer(schibsted700), weight: 700, style: "normal" },
    { name: "Bricolage", data: toArrayBuffer(bricolage), weight: 800, style: "normal" },
    { name: "mono", data: toArrayBuffer(mono), weight: 400, style: "normal" },
  ]);
  return fontsPromise;
}
