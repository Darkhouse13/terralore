import { ImageResponse } from "next/og";
import { allComparePages, getComparePage, type ComparePage, type CompareRow } from "@/lib/compare";
import { formatMetric } from "@/lib/format";
import { OG, OG_SIZE, Eyebrow, OgShell, SourcedLine, ogFonts } from "@/lib/og";

/**
 * The per-pair social card, on the v2 ZENITH grammar (lib/og.tsx). Generated
 * at build (`generateStaticParams`), layout and colour only — no remote font,
 * no remote image.
 *
 * What it carries, per the surface's contract: both nations' formation years
 * (the two archives' anchors) and ONE shared-metric contrast — the two
 * figures beside each other in verdigris, the measured, with their years.
 * Values sit side by side in slug order; nothing on the card ranks them.
 */

export function generateStaticParams() {
  return allComparePages().map((p) => ({ pair: p.slug }));
}

export const alt = "Two nations' sourced records side by side — compared, never graded";
export const size = OG_SIZE;
export const contentType = "image/png";

/** The headline contrast: the most familiar metric both nations publish. */
function headlineRow(page: ComparePage): CompareRow | null {
  const rows = page.domains.flatMap((d) => d.rows).filter((r) => r.a.value != null && r.b.value != null);
  for (const key of ["gdpPerCapita", "lifeExpectancy", "gdp", "population"]) {
    const hit = rows.find((r) => r.key === key);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

export default async function CompareOgImage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const page = getComparePage(pair);
  const row = page ? headlineRow(page) : null;

  return new ImageResponse(
    (
      <OgShell
        seed={pair}
        top={<Eyebrow>Compared · side by side</Eyebrow>}
        middle={
          page ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: page.a.name.length + page.b.name.length > 24 ? 62 : 80,
                  lineHeight: 1.02,
                  letterSpacing: -2,
                  color: OG.chalkHi,
                  maxWidth: 1020,
                }}
              >
                {`${page.a.name} and ${page.b.name}`}
              </div>
              <div
                style={{
                  marginTop: 22,
                  fontSize: 27,
                  lineHeight: 1.4,
                  color: OG.chalk2,
                  maxWidth: 940,
                }}
              >
                {`Formed ${page.a.formation.yearLabel} · formed ${page.b.formation.yearLabel} — ${page.bothCount} shared indicators, ${page.sharedEvents.length} crossed chronicle ${page.sharedEvents.length === 1 ? "event" : "events"}.`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 80, color: OG.chalkHi }}>Compared</div>
          )
        }
        stat={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {page && row ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{ fontSize: 42, color: OG.verdigris, letterSpacing: -1 }}>
                  {`${formatMetric(row.a.value, row.unit)} · ${formatMetric(row.b.value, row.unit)}`}
                </div>
                <div style={{ fontSize: 21, color: OG.chalk3 }}>
                  {`${row.label} · ${row.a.year ?? "—"}/${row.b.year ?? "—"}`}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22, color: OG.chalk3 }}>Two sourced records, side by side</div>
            )}
            <SourcedLine />
          </div>
        }
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
