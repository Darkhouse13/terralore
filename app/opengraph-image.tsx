import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/**
 * The site-wide social card. Every route inherits this unless it declares its
 * own, so a shared link stops rendering as a bare blue title.
 *
 * Deliberately built from layout and colour alone — no remote font fetch, no
 * remote image. An `ImageResponse` that reaches out over the network turns a
 * cold Docker build into a build that can fail for a reason unrelated to the
 * code, and this asset is not worth that risk.
 */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(120% 120% at 15% 0%, #0c2e3d 0%, #04161f 45%, #04161f 100%)",
          color: "#e6ecea",
        }}
      >
        {/* brass hairline, echoing the atlas rules across the site */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 54, height: 2, background: "#c87244" }} />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#e39a67",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.04,
              letterSpacing: -1.5,
              color: "#f2f6f4",
              maxWidth: 940,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 27,
              lineHeight: 1.45,
              color: "#afbfc1",
              maxWidth: 880,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 20,
            color: "#8497a0",
          }}
        >
          <span style={{ color: "#c87244" }}>◆</span>
          <span>Every claim traceable to a source</span>
        </div>
      </div>
    ),
    size,
  );
}
