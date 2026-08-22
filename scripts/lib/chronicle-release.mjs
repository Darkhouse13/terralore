import { createHash } from "node:crypto";
import { allCountries } from "@/lib/countries";
import { getHistory } from "@/lib/histories";
import { assignEventKeys, eventClaimId } from "@/lib/claim-id";
import { CONTENT_LICENSE, SITE_URL, routes } from "@/lib/seo";

export const DRAFT_VERSION = "1.0.0-draft.1";
export const FINAL_VERSION = "1.0.0";
export const RELEASE_DATE = "2026-08-22";
export const RELEASE_CREATOR = "Terralore";

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function csvCell(value) {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n") + "\n";
}

function realCountriesWithHistories() {
  return allCountries()
    .filter((country) => country.name && country.name !== "-99")
    .map((country) => ({ country, history: getHistory(country.code) }))
    .filter(({ history }) => history?.status === "published")
    .sort((a, b) => a.country.code.localeCompare(b.country.code));
}

export function composeChronicleRelease({ version = DRAFT_VERSION, status = "draft" } = {}) {
  if (!["draft", "final"].includes(status)) throw new Error(`invalid release status ${status}`);
  if (status === "final" && version.includes("-")) {
    throw new Error(`final release version may not be a prerelease: ${version}`);
  }
  const events = [];
  const eventSources = [];
  const sources = [];
  let latestHistoryUpdate = "";

  for (const { country, history } of realCountriesWithHistories()) {
    latestHistoryUpdate = [latestHistoryUpdate, history.updated].sort().at(-1);
    const sourceKeys = new Set();

    for (const source of history.sources) {
      const sourceKey = `${country.code}:${source.id}`;
      if (sourceKeys.has(sourceKey)) throw new Error(`duplicate source key ${sourceKey}`);
      sourceKeys.add(sourceKey);
      sources.push({
        source_key: sourceKey,
        country_code: country.code,
        source_id: source.id,
        label: source.label,
        publisher: source.publisher ?? "",
        url: source.url ?? "",
        kind: source.kind,
        license: source.license ?? "",
        accessed: source.accessed ?? "",
      });
    }

    const keys = assignEventKeys(history.eras);
    history.eras.forEach((era, eraIndex) => {
      era.events.forEach((event, eventIndex) => {
        const key = keys[eraIndex][eventIndex];
        const claimId = eventClaimId(country.code, key);
        const sourceRefs = event.sources.map((sourceId) => `${country.code}:${sourceId}`);
        for (const sourceKey of sourceRefs) {
          if (!sourceKeys.has(sourceKey)) throw new Error(`${claimId} references missing source ${sourceKey}`);
          eventSources.push({ claim_id: claimId, source_key: sourceKey });
        }

        events.push({
          claim_id: claimId,
          country_code: country.code,
          country_name: country.name,
          year: event.year,
          year_label: event.yearLabel ?? String(event.year),
          end_year: event.endYear ?? null,
          title: event.title,
          summary: event.summary,
          category: event.category,
          era_id: era.id,
          canonical_url: `${SITE_URL}${routes.chronicle(country.code)}#${key.fragment}`,
          history_updated: history.updated,
          source_keys: sourceRefs,
        });
      });
    });
  }

  const eventIds = new Set(events.map((event) => event.claim_id));
  if (eventIds.size !== events.length) throw new Error("duplicate event claim IDs in Chronicle Events release");

  const eventHeaders = [
    "claim_id",
    "country_code",
    "country_name",
    "year",
    "year_label",
    "end_year",
    "title",
    "summary",
    "category",
    "era_id",
    "canonical_url",
    "history_updated",
  ];
  const sourceHeaders = [
    "source_key",
    "country_code",
    "source_id",
    "label",
    "publisher",
    "url",
    "kind",
    "license",
    "accessed",
  ];
  const edgeHeaders = ["claim_id", "source_key"];

  const files = new Map();
  files.set(
    "events.csv",
    csv(eventHeaders, events.map((event) => eventHeaders.map((header) => event[header]))),
  );
  files.set(
    "event-sources.csv",
    csv(edgeHeaders, eventSources.map((edge) => edgeHeaders.map((header) => edge[header]))),
  );
  files.set(
    "sources.csv",
    csv(sourceHeaders, sources.map((source) => sourceHeaders.map((header) => source[header]))),
  );
  files.set(
    "events.ndjson",
    events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  );

  const resources = [...files].map(([name, content]) => ({
    name: name.replaceAll(/[.-]/g, "_"),
    path: name,
    bytes: Buffer.byteLength(content),
    hash: `sha256:${sha256(content)}`,
    mediatype: name.endsWith(".csv") ? "text/csv" : "application/x-ndjson",
  }));
  const datapackage = {
    profile: "data-package",
    name: "terralore-chronicle-events",
    title: "Terralore Chronicle Events",
    description:
      "A curated corpus of sourced historical events from Terralore country chronicles. It is not an exhaustive event census.",
    version,
    created: RELEASE_DATE,
    homepage: `${SITE_URL}/datasets/chronicle-events`,
    licenses: [{ name: "CC-BY-4.0", path: CONTENT_LICENSE, title: "Creative Commons Attribution 4.0" }],
    contributors: [
      { title: RELEASE_CREATOR, role: "author" },
      { title: RELEASE_CREATOR, role: "publisher" },
    ],
    sources: [{ title: "Terralore country chronicles", path: `${SITE_URL}/atlas` }],
    terralore: {
      status,
      historyUpdatedThrough: latestHistoryUpdate,
      countries: realCountriesWithHistories().length,
      events: events.length,
      sourceRecords: sources.length,
      eventSourceLinks: eventSources.length,
      codeSystem: "Natural Earth ADM0_A3 (not always ISO 3166-1 alpha-3)",
    },
    resources,
  };
  files.set("datapackage.json", JSON.stringify(datapackage, null, 2) + "\n");

  files.set(
    "LICENSE.md",
    `# Licence scope\n\nTerralore's authored event summaries and the compilation structure in this release are offered under [Creative Commons Attribution 4.0](${CONTENT_LICENSE}).\n\nThird-party names, source labels, and source URLs are citations. Terralore does not redistribute the cited publishers' underlying works, and those works remain subject to their own terms.\n`,
  );
  files.set(
    "README.md",
    `# Terralore Chronicle Events ${version}\n\n${status === "draft" ? "> Draft build: do not publish or cite until the release metadata, licence scope, and final link audit are approved.\n\n" : ""}Creator and publisher: ${RELEASE_CREATOR}. Released ${RELEASE_DATE}.\n\nThis package contains ${events.length.toLocaleString("en")} curated historical events from ${realCountriesWithHistories().length} published country chronicles, linked to ${sources.length.toLocaleString("en")} country-scoped source records.\n\n## Suggested citation\n\nTerralore (${RELEASE_DATE.slice(0, 4)}). *Terralore Chronicle Events* (Version ${version}) [Data set]. ${SITE_URL}/datasets/chronicle-events\n\n## Files\n\n- \`events.csv\` — one row per stable Terralore event claim.\n- \`event-sources.csv\` — the many-to-many event/source relation.\n- \`sources.csv\` — source metadata; \`source_key\` is \`<ADM0_A3>:<source_id>\`. Empty \`license\` or \`accessed\` cells mean that metadata was not recorded; they do not imply permission, public-domain status, or that a URL was unreachable.\n- \`events.ndjson\` — the event rows with their source keys embedded.\n- \`datapackage.json\` — machine-readable package metadata and resource hashes.\n- \`LICENSE.md\` — scope of Terralore's CC BY 4.0 declaration.\n- \`SHA256SUMS\` — checksums for every other file.\n\n## Method limits\n\nThis is a curated reference corpus, not an exhaustive event census. Event counts must not be interpreted as historical activity, severity, or importance. Dates can be approximate; BCE years are negative integers; categories are editorial; and country codes follow Natural Earth ADM0_A3, which is not always ISO alpha-3.\n\nHistory content is updated through ${latestHistoryUpdate}. Stable \`claim_id\` values resolve to the canonical Terralore page and fragment in \`canonical_url\`.\n`,
  );

  const checksums = [...files]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, content]) => `${sha256(content)}  ${name}`)
    .join("\n") + "\n";
  files.set("SHA256SUMS", checksums);

  return {
    files,
    events,
    eventSources,
    sources,
    stats: {
      countries: realCountriesWithHistories().length,
      events: events.length,
      eventSourceLinks: eventSources.length,
      sources: sources.length,
      latestHistoryUpdate,
    },
  };
}
