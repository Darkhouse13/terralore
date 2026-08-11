// ── The social render wrapper: satori/resvg with the network fused shut ────
// The renderer is next's own compiled @vercel/og (the exact satori + resvg
// pipeline the OG routes run at build) driven from node — no new rendering
// dependency, and byte-compatible typesetting with the cards the site already
// ships. Loaded by file URL because next's `exports` map does not expose the
// compiled path as a bare specifier.
//
// `fetch` is stubbed TO THROW for the duration of a render. satori's default
// behaviour on a glyph the provided fonts lack is to fetch it from Google
// Fonts — the silent build-time network dependence this codebase bans
// (lib/og.tsx documents the offline proof). With the stub, a missing glyph
// (or any emoji reaching a card — nation flags stay OFF cards by design)
// fails the run loudly instead of publishing a card that needed the network.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { socialFonts } from "./fonts.mjs";

const ogModule = await import(
  pathToFileURL(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/index.node.js")).href
);
const { ImageResponse } = ogModule;

/**
 * Render one element tree to a PNG buffer at the given size.
 * Deterministic: same tree + same fonts → same bytes.
 */
export async function renderPng(element, { width, height }) {
  const fonts = await socialFonts();
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input) => {
    throw new Error(
      `social render attempted a network fetch (${typeof input === "string" ? input : input?.url}) — ` +
        "a glyph is missing from the committed font subsets, or an emoji reached a card. " +
        "Fix the composition; the card path must stay offline.",
    );
  };
  try {
    const resp = new ImageResponse(element, { width, height, fonts });
    return Buffer.from(await resp.arrayBuffer());
  } finally {
    globalThis.fetch = realFetch;
  }
}
