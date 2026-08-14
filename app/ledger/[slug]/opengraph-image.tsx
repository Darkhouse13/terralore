import { ImageResponse } from "next/og";
import { allEntries, getEntry } from "@/lib/ledger";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine, ogFonts } from "@/lib/og";

/**
 * The per-entry social card, on the ZENITH grammar (lib/og.tsx) — the same
 * constraints as every card: build-time generation, layout and colour alone.
 *
 * The stat is the entry's change counts in the neutral grammar — recorded,
 * never graded. Baseline seeded by the entry slug.
 */

export function generateStaticParams() {
  return allEntries().map((e) => ({ slug: e.slug }));
}

export const alt = "A recorded refresh of the Terralore corpus — every change published, never silent";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function LedgerEntryOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getEntry(slug);

  return new ImageResponse(
    (
      <OgShell
        seed={`ledger-${slug}`}
        top={<Eyebrow>{`The Ledger · entry ${e ? `№ ${e.slug}` : slug}`}</Eyebrow>}
        middle={
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 84,
                lineHeight: 1.0,
                letterSpacing: -2,
                color: OG.chalkHi,
                fontFamily: "Bricolage",
                fontWeight: 800,
                textTransform: "uppercase" as const,
                maxWidth: 1000,
              }}
            >
              {e ? `The record moved` : "The Ledger"}
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.35,
                color: OG.chalk2,
                maxWidth: 900,
              }}
            >
              {e
                ? `${e.title} — ${e.domains.length} domains, ${e.counts.nations} nations, every change resolving to its claim.`
                : "The change record of the corpus — nothing moves silently."}
            </div>
          </div>
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {e ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div
                  style={{
                    fontSize: 46,
                    color: OG.verdigris,
                    fontFamily: "mono",
                    letterSpacing: -1,
                  }}
                >
                  {e.counts.new.toLocaleString("en")}
                </div>
                <div style={{ fontSize: 22, color: OG.chalk3 }}>
                  {`new observations · ${e.counts.revised.toLocaleString("en")} revised · ${e.counts.retired.toLocaleString("en")} retired · ${e.date}`}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22, color: OG.chalk3 }}>The corpus change record</div>
            )}
            <SourcedLine />
          </div>
        }
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
