import { ImageResponse } from "next/og";
import { getCountry, allCodes } from "@/lib/countries";
import { getDossier } from "@/lib/domains";
import { getHistory } from "@/lib/histories";
import { formatMetric } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";

/**
 * The per-nation social card, in the STRATUM identity.
 *
 * Every country route inherits this — the dossier, the chronicle and the
 * journey — so a link to any depth of a nation shares as that nation rather
 * than as the generic site card.
 *
 * **Generated at build time, never per request.** `generateStaticParams` is what
 * makes that true: without it Next renders these on demand, which would put an
 * image pipeline on the hot path of every crawler visit. 184 cards is a few
 * seconds of build.
 *
 * Built from layout and colour alone — no remote font, no remote image. An
 * `ImageResponse` that reaches over the network turns a cold Docker build into
 * one that can fail for reasons unrelated to the code, and no glyph is worth
 * that (see the root card, where a single "◆" did exactly this).
 */

export function generateStaticParams() {
  return allCodes().map((code) => ({ code }));
}

export const alt = "A sourced dossier and chronicle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The three semantic tints, as literals — this renders outside the CSS layer.
const COPPER = "#c87244";
const COPPER_BRIGHT = "#e39a67";
const VERDIGRIS = "#7cc4b3";
const CHALK_HI = "#f2f6f4";
const CHALK_2 = "#afbfc1";
const CHALK_3 = "#8497a0";

/**
 * The signature stat — one figure, chosen by what the nation actually has.
 *
 * Order matters: the corpus's own work (a sourced history) outranks a borrowed
 * indicator, because that is what makes this site different from a data portal.
 */
function signature(code: string): { value: string; label: string } | null {
  const history = getHistory(code);
  if (history) {
    const events = history.eras.reduce((n, e) => n + e.events.length, 0);
    return {
      value: String(events),
      label: `sourced events across ${history.eras.length} eras`,
    };
  }
  const dossier = getDossier(code);
  const gdp = dossier?.sections.economy?.metrics.find((m) => m.key === "gdp");
  if (gdp?.value != null) {
    return { value: formatMetric(gdp.value, gdp.unit), label: `GDP · ${gdp.year}` };
  }
  const pop = dossier?.sections.society?.metrics.find((m) => m.key === "population");
  if (pop?.value != null) {
    return { value: formatMetric(pop.value, pop.unit), label: `population · ${pop.year}` };
  }
  return null;
}

export default async function CountryOgImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const meta = getCountry(code);
  const name = meta?.name ?? code;
  const region = [meta?.subregion ?? meta?.region, meta?.continent]
    .filter(Boolean)
    .join(" · ");
  const stat = signature(code);
  const tagline = getHistory(code)?.tagline ?? null;

  // Long names need to step down or they overrun the card.
  const nameSize = name.length > 26 ? 66 : name.length > 18 ? 82 : 104;

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
            {region ? `· ${region}` : ""}
          </div>
        </div>

        {/* the nation */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* the signature element: the stratum rule, drawn as stacked bands */}
          <div style={{ display: "flex", flexDirection: "column", width: 132, marginBottom: 26 }}>
            <div style={{ height: 2, background: COPPER }} />
            <div style={{ height: 2 }} />
            <div style={{ height: 2, background: COPPER, opacity: 0.55 }} />
            <div style={{ height: 2 }} />
            <div style={{ height: 2, background: COPPER, opacity: 0.25 }} />
          </div>

          <div
            style={{
              fontSize: nameSize,
              lineHeight: 1.0,
              letterSpacing: -2,
              color: CHALK_HI,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>

          {tagline && (
            <div
              style={{
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.35,
                color: CHALK_2,
                maxWidth: 900,
              }}
            >
              {tagline.length > 96 ? `${tagline.slice(0, 95)}…` : tagline}
            </div>
          )}
        </div>

        {/* the signature stat */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {stat ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontSize: 46, color: VERDIGRIS, letterSpacing: -1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 22, color: CHALK_3 }}>{stat.label}</div>
            </div>
          ) : (
            <div style={{ fontSize: 22, color: CHALK_3 }}>A sourced country profile</div>
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
