import { ImageResponse } from "next/og";
import { COMMODITY_META } from "@/lib/commodity-meta";
import { getCommodity } from "@/lib/commodities";
import { formatTonnes } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";

/**
 * The per-commodity social card, in the STRATUM identity.
 *
 * Same constraints as the country card: **generated at build time** (the
 * `generateStaticParams` below is what keeps an image pipeline off the hot
 * path of every crawler visit), and built from layout and colour alone — no
 * remote font, no remote image, nothing that can fail a cold Docker build.
 *
 * The accent is verdigris, not copper: in this palette verdigris means "the
 * measured", and a commodity card is nothing but measured tonnage.
 */

export function generateStaticParams() {
  return COMMODITY_META.map((c) => ({ mineral: c.slug }));
}

export const alt = "Who supplies the world — sourced shares of world mine production";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPPER = "#c87244";
const COPPER_BRIGHT = "#e39a67";
const VERDIGRIS = "#7cc4b3";
const VERDIGRIS_MID = "#57a695";
const CHALK_HI = "#f2f6f4";
const CHALK_2 = "#afbfc1";
const CHALK_3 = "#8497a0";

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
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 76px",
          background:
            "radial-gradient(120% 120% at 12% 0%, #0c2e3d 0%, #04161f 48%, #04161f 100%)",
          color: CHALK_2,
        }}
      >
        {/* masthead */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 2, background: COPPER }} />
          <div
            style={{
              fontSize: 19,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: COPPER_BRIGHT,
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 19, letterSpacing: 5, color: CHALK_3 }}>
            · Commodities
          </div>
        </div>

        {/* the commodity */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* the stratum rule, in the measured tint */}
          <div style={{ display: "flex", flexDirection: "column", width: 132, marginBottom: 26 }}>
            <div style={{ height: 2, background: VERDIGRIS_MID }} />
            <div style={{ height: 2 }} />
            <div style={{ height: 2, background: VERDIGRIS_MID, opacity: 0.55 }} />
            <div style={{ height: 2 }} />
            <div style={{ height: 2, background: VERDIGRIS_MID, opacity: 0.25 }} />
          </div>

          <div
            style={{
              fontSize: name.length > 12 ? 84 : 104,
              lineHeight: 1.0,
              letterSpacing: -2,
              color: CHALK_HI,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>

          <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.35, color: CHALK_2, maxWidth: 900 }}>
            {"Who supplies the world — every producer's share of world mine production, sourced."}
          </div>
        </div>

        {/* the signature stat */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {c ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontSize: 46, color: VERDIGRIS, letterSpacing: -1 }}>
                {formatTonnes(c.world.estimate)}
              </div>
              <div style={{ fontSize: 22, color: CHALK_3 }}>
                {`world total · ${c.years.estimate} est.${
                  top?.shareEstimate != null
                    ? ` · ${top.name} ${Math.round(top.shareEstimate * 100)}%`
                    : ""
                }`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 22, color: CHALK_3 }}>A sourced world production table</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, color: CHALK_3 }}>
            <div
              style={{ width: 11, height: 11, background: COPPER, transform: "rotate(45deg)" }}
            />
            <span>Every claim traceable to a source</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
