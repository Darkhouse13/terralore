import { llmsFullText } from "@/lib/geo";

/**
 * /llms-full.txt — the one-fetch corpus for answer engines: every ranking
 * table, every commodity production table, and a summary block per nation.
 *
 * Deliberately NOT the full chronicle corpus: ~291k authored words belongs at
 * the per-nation twins (/country/<CODE>/chronicle.md, indexed in /llms.txt),
 * and this file stays under lib/geo's LLMS_FULL_CAP (1 MiB) so an agent can
 * take it whole into context. The file states its own scope in its header.
 * scripts/validate-geo.mjs enforces the cap on every `npm run validate`.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsFullText(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
