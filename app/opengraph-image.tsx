import { ImageResponse } from "next/og";
import { corpusStats } from "@/lib/chronology";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine } from "@/lib/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/**
 * The site-wide social card, on the v2 ZENITH grammar (lib/og.tsx): data-first
 * middle, the mark + "Terralore." signature corner, the seeded strata
 * baseline. Every route inherits this unless it declares its own.
 *
 * Deliberately built from layout and colour alone — no remote font fetch, no
 * remote image. An `ImageResponse` that reaches out over the network turns a
 * cold Docker build into a build that can fail for a reason unrelated to the
 * code, and this asset is not worth that risk.
 */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  const stats = corpusStats();
  return new ImageResponse(
    (
      <OgShell
        seed="terralore"
        top={<Eyebrow>An interactive globe · a living archive</Eyebrow>}
        middle={
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 76,
                lineHeight: 1.04,
                letterSpacing: -1.5,
                color: OG.chalkHi,
                maxWidth: 940,
              }}
            >
              {SITE_TAGLINE}
            </div>
            <div
              style={{
                marginTop: 26,
                fontSize: 26,
                lineHeight: 1.45,
                color: OG.chalk2,
                maxWidth: 880,
              }}
            >
              {SITE_DESCRIPTION}
            </div>
          </div>
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontSize: 44, color: OG.verdigris, letterSpacing: -1 }}>
                {stats.events.toLocaleString("en")}
              </div>
              <div style={{ fontSize: 22, color: OG.chalk3 }}>
                {`sourced events across ${stats.nations} nations`}
              </div>
            </div>
            <SourcedLine />
          </div>
        }
      />
    ),
    size,
  );
}
