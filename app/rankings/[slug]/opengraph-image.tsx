import { ImageResponse } from "next/og";
import { allRankings, getRanking } from "@/lib/rankings";
import { DOMAIN_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine, ogFonts } from "@/lib/og";

/**
 * The per-ranking social card, on the v2 ZENITH grammar (lib/og.tsx).
 *
 * Same constraints as every card: generated at build time (the
 * `generateStaticParams` keeps the image pipeline off the hot path of crawler
 * visits), layout and colour alone — no remote font, no remote image.
 *
 * The stat accent is verdigris — "the measured" — and the figure it carries
 * is the table's highest observation with its nation and year: a claim the
 * page can stand behind, in the neutral grammar (highest, never best). The
 * strata baseline is seeded by the ranking's slug.
 */

export function generateStaticParams() {
  return allRankings().map((r) => ({ slug: r.slug }));
}

export const alt = "A sourced world ranking — every nation with published data, highest to lowest";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function RankingOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = getRanking(slug);
  const name = r?.label ?? slug;
  const top = r?.rows[0];

  return new ImageResponse(
    (
      <OgShell
        seed={slug}
        top={<Eyebrow>{`Rankings · ${r ? DOMAIN_META[r.domain].label : "Terralore"}`}</Eyebrow>}
        middle={
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: name.length > 16 ? 72 : 96,
                lineHeight: 1.0,
                letterSpacing: -2,
                color: OG.chalkHi,
                maxWidth: 1000,
              }}
            >
              {name}
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
              {r
                ? `${r.rows.length} ${r.isMineral ? "producing nations" : "nations"}, highest to lowest — every figure sourced and dated.`
                : "Every nation with published data, highest to lowest — sourced."}
            </div>
          </div>
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {r && top ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{ fontSize: 46, color: OG.verdigris, letterSpacing: -1 }}>
                  {formatMetric(top.value, r.unit)}
                </div>
                <div style={{ fontSize: 22, color: OG.chalk3 }}>
                  {`highest · ${top.name}${top.year != null ? ` · ${top.year}` : ""}`}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22, color: OG.chalk3 }}>A sourced world ranking</div>
            )}
            <SourcedLine />
          </div>
        }
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
