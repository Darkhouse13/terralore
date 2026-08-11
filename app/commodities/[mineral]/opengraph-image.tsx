import { ImageResponse } from "next/og";
import { COMMODITY_META } from "@/lib/commodity-meta";
import { getCommodity } from "@/lib/commodities";
import { formatTonnes } from "@/lib/format";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine } from "@/lib/og";

/**
 * The per-commodity social card, on the v2 ZENITH grammar (lib/og.tsx).
 *
 * Same constraints as the country card: **generated at build time** (the
 * `generateStaticParams` below is what keeps an image pipeline off the hot
 * path of every crawler visit), and built from layout and colour alone — no
 * remote font, no remote image, nothing that can fail a cold Docker build.
 *
 * The stat accent is verdigris, not copper: in this palette verdigris means
 * "the measured", and a commodity card is nothing but measured tonnage. The
 * strata baseline is seeded by the mineral's slug.
 */

export function generateStaticParams() {
  return COMMODITY_META.map((c) => ({ mineral: c.slug }));
}

export const alt = "Who supplies the world — sourced shares of world mine production";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function CommodityOgImage({
  params,
}: {
  params: Promise<{ mineral: string }>;
}) {
  const { mineral } = await params;
  const c = getCommodity(mineral);
  const name = c?.name ?? mineral;
  const top = c?.producers[0];

  return new ImageResponse(
    (
      <OgShell
        seed={mineral}
        top={<Eyebrow>Commodities · who supplies the world</Eyebrow>}
        middle={
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: name.length > 12 ? 84 : 104,
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
              {"Every producer's share of world mine production, sourced."}
            </div>
          </div>
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {c ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{ fontSize: 46, color: OG.verdigris, letterSpacing: -1 }}>
                  {formatTonnes(c.world.estimate)}
                </div>
                <div style={{ fontSize: 22, color: OG.chalk3 }}>
                  {`world total · ${c.years.estimate} est.${
                    top?.shareEstimate != null
                      ? ` · ${top.name} ${Math.round(top.shareEstimate * 100)}%`
                      : ""
                  }`}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22, color: OG.chalk3 }}>A sourced world production table</div>
            )}
            <SourcedLine />
          </div>
        }
      />
    ),
    size,
  );
}
