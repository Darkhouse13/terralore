import { ImageResponse } from "next/og";
import { getCountry, allCodes } from "@/lib/countries";
import { getDossier } from "@/lib/domains";
import { getHistory } from "@/lib/histories";
import { formatMetric } from "@/lib/format";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine } from "@/lib/og";

/**
 * The per-nation social card, on the v2 ZENITH grammar (lib/og.tsx).
 *
 * Every country route inherits this — the dossier, the chronicle and the
 * journey — so a link to any depth of a nation shares as that nation rather
 * than as the generic site card. The strata baseline is seeded by the nation's
 * code: each nation's card carries its own strip, reproduced exactly on every
 * rebuild.
 *
 * **Generated at build time, never per request.** `generateStaticParams` is what
 * makes that true: without it Next renders these on demand, which would put an
 * image pipeline on the hot path of every crawler visit. 184 cards is a few
 * seconds of build.
 *
 * Built from layout and colour alone — no remote font, no remote image. An
 * `ImageResponse` that reaches over the network turns a cold Docker build into
 * one that can fail for reasons unrelated to the code, and no glyph is worth
 * that (see the root card, where a single "◆" once did exactly this).
 */

export function generateStaticParams() {
  return allCodes().map((code) => ({ code }));
}

export const alt = "A sourced dossier and chronicle";
export const size = OG_SIZE;
export const contentType = "image/png";

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
      <OgShell
        seed={code}
        top={<Eyebrow>{region || "A sourced country profile"}</Eyebrow>}
        middle={
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: nameSize,
                lineHeight: 1.0,
                letterSpacing: -2,
                color: OG.chalkHi,
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
                  color: OG.chalk2,
                  maxWidth: 900,
                }}
              >
                {tagline.length > 96 ? `${tagline.slice(0, 95)}…` : tagline}
              </div>
            )}
          </div>
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {stat ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{ fontSize: 46, color: OG.verdigris, letterSpacing: -1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 22, color: OG.chalk3 }}>{stat.label}</div>
              </div>
            ) : (
              <div style={{ fontSize: 22, color: OG.chalk3 }}>A sourced country profile</div>
            )}
            <SourcedLine />
          </div>
        }
      />
    ),
    size,
  );
}
