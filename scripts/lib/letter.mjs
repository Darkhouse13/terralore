// ── The Ledger Letter composer — one entry, four artifacts ─────────────────
// Turns a committed ledger entry (public/ledger/<NNNN>.json) into the digest:
//
//   · page HTML     → public/ledger/letter/<NNNN>.html  (the archived copy)
//   · page text     → public/ledger/letter/<NNNN>.txt   (plain-text twin)
//   · campaign HTML → data/letters/<NNNN>.campaign.html (what listmonk sends;
//                     carries {{ UnsubscribeURL }} and the List-Unsubscribe
//                     contract — never served, only uploaded)
//   · campaign text → data/letters/<NNNN>.campaign.txt
//
// One body, two frames: page and campaign differ ONLY in the closing lines
// (an archive note vs the unsubscribe line). Deterministic: derived entirely
// from the entry, the seal archive and data/countries.json — no clocks, no
// randomness — so validate-letters.mjs can regenerate and byte-compare.
//
// The voice is the ledger's voice, and the same law binds it: publication
// verbs only (published / revised / withdrawn), points for bounded scales —
// enforced by reusing describeChange/formatMetric from lib/ledger.ts and
// lib/format.ts (run under the TS loader), then validator-scanned.
//
// Email-client reality, by construction: a single 560px table, every style
// inline, system font stacks (the brand carried by weight/case/rules), the
// strata pigments as hex, 2px rules, the TERRALORE stamp as a hosted image.
// No tracking pixel, no rewritten links — the privacy page's promise is a
// property of this template.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { describeChange } = await import("../../lib/ledger.ts");
const { formatMetric } = await import("../../lib/format.ts");

// The pigments, as the mission ships them to mail clients.
const BONE = "#EFE7D8";
const SAND = "#E2D3B8";
const OXIDE = "#A64B26";
const UMBER = "#6E4A32";
const BASALT = "#221E19";

const SITE = "https://terralore.co";
const SANS = `-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const MONO = `'Courier New',Courier,monospace`;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Load an entry + everything the letter cites. */
export function loadLetterInputs(slug, root) {
  const entry = JSON.parse(readFileSync(join(root, "public", "ledger", `${slug}.json`), "utf8"));
  const seal = JSON.parse(
    readFileSync(join(root, "public", "integrity", `${entry.corpus.after.version}.json`), "utf8"),
  );
  const countries = JSON.parse(readFileSync(join(root, "data", "countries.json"), "utf8"));
  const names = new Map(Object.values(countries).map((c) => [c.code, c.name]));
  return { entry, seal, names };
}

/* ── selection — deterministic editorial arithmetic ────────────────────────── */

/** Relative size of a revision, for ordering only (never printed). */
const relDelta = (c) =>
  c.before && c.after ? Math.abs((c.after.value - c.before.value) / (c.before.value || 1)) : 0;

/**
 * The lead: retirements first (a series leaving the record is the rarest,
 * sharpest event a refresh produces), else the largest revision.
 */
export function pickLead(entry) {
  const retired = entry.changes.filter((c) => c.kind === "retired");
  if (retired.length) return { kind: "retired", changes: retired };
  const revised = entry.changes
    .filter((c) => c.kind === "revised")
    .sort((a, b) => relDelta(b) - relDelta(a) || a.id.localeCompare(b.id));
  return { kind: "revised", changes: revised.slice(0, 2) };
}

/**
 * 3–5 notable per-nation changes: first-ever observations (max 2), then the
 * largest revisions above recomputation scale — excluding whatever the lead
 * already tells. Ties broken by claim ID so the selection cannot wobble.
 */
export function pickNotable(entry, lead) {
  const inLead = new Set(lead.changes.map((c) => c.id));
  const firsts = entry.changes
    .filter((c) => c.kind === "new" && !c.before && !inLead.has(c.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 2);
  const revisions = entry.changes
    .filter(
      (c) =>
        c.kind === "revised" &&
        relDelta(c) > 1e-4 &&
        !inLead.has(c.id) &&
        // a movement invisible at display precision is no story
        formatMetric(c.before.value, c.unit) !== formatMetric(c.after.value, c.unit),
    )
    .sort((a, b) => relDelta(b) - relDelta(a) || a.id.localeCompare(b.id));
  return [...firsts, ...revisions].slice(0, 5);
}

/* ── shared fragments ──────────────────────────────────────────────────────── */

const claimFragment = (c) => {
  // A retired claim's fragment left the page; link the standing observation.
  const year = c.kind === "retired" && c.now ? c.now.year : (c.after?.year ?? c.before?.year);
  const key = c.metric;
  return `${SITE}/country/${c.nation}#claim-${key}-${year}`;
};

function leadProse(lead, names) {
  if (lead.kind === "retired") {
    return lead.changes.map((c) => {
      const nation = names.get(c.nation) ?? c.nation;
      if (c.now) {
        return {
          head: `${nation} — ${c.label}`,
          body:
            `The ${c.before.year} observation (${formatMetric(c.before.value, c.unit)}) was withdrawn by ` +
            `the publisher; the ${c.now.year} observation (${formatMetric(c.now.value, c.unit)}) stands, ` +
            `moving the series' latest published year from ${c.before.year} back to ${c.now.year}.`,
          claims: [c.id, c.now.id],
          url: claimFragment(c),
        };
      }
      return {
        head: `${nation} — ${c.label}`,
        body: `No longer published; the record last held ${formatMetric(c.before.value, c.unit)} (${c.before.year}). Absence recorded, not assumed.`,
        claims: [c.id],
        url: `${SITE}/country/${c.nation}`,
      };
    });
  }
  return lead.changes.map((c) => ({
    head: `${names.get(c.nation) ?? c.nation} — ${c.label}`,
    body: `${describeChange(c)}.`,
    claims: [c.id],
    url: claimFragment(c),
  }));
}

/* ── the letter ────────────────────────────────────────────────────────────── */

export function buildLetter(slug, root) {
  const { entry, seal, names } = loadLetterInputs(slug, root);
  const lead = pickLead(entry);
  const leadItems = leadProse(lead, names);
  const notable = pickNotable(entry, lead);
  const domainsTouched = entry.domains
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(", ");

  const subject = `The Ledger № ${entry.slug} — ${entry.title}`;
  const preheader = entry.summary;

  /* — HTML — */

  const sectionRule = `border-top:2px solid ${BASALT};`;
  const eyebrow = (t) =>
    `<div style="font-family:${MONO};font-size:11px;letter-spacing:0.12em;color:${OXIDE};text-transform:uppercase;">${esc(t)}</div>`;

  const leadHtml = leadItems
    .map(
      (it) => `
        <div style="margin:0 0 18px;">
          <div style="font-family:${SANS};font-size:15px;font-weight:700;color:${BASALT};">${esc(it.head)}</div>
          <div style="font-family:${SANS};font-size:15px;line-height:1.55;color:${BASALT};margin-top:4px;">${esc(it.body)}</div>
          <div style="font-family:${MONO};font-size:11px;line-height:1.7;color:${UMBER};margin-top:6px;">${it.claims
            .map(esc)
            .join(" &middot; ")} &middot; <a href="${esc(it.url)}" style="color:${OXIDE};">the specimen</a></div>
        </div>`,
    )
    .join("");

  const countCell = (label, value) => `
    <td style="padding:10px 14px 10px 0;vertical-align:top;">
      <div style="font-family:${MONO};font-size:10px;letter-spacing:0.1em;color:${UMBER};text-transform:uppercase;">${esc(label)}</div>
      <div style="font-family:${MONO};font-size:19px;color:${BASALT};margin-top:2px;">${esc(value)}</div>
    </td>`;

  const notableHtml = notable
    .map((c) => {
      const nation = names.get(c.nation) ?? c.nation;
      return `
        <div style="margin:0 0 14px;">
          <div style="font-family:${SANS};font-size:14.5px;line-height:1.55;color:${BASALT};"><strong>${esc(nation)}</strong> — ${esc(c.label)}: ${esc(describeChange(c))}.</div>
          <div style="font-family:${MONO};font-size:11px;line-height:1.7;color:${UMBER};margin-top:3px;">${esc(c.id)} &middot; <a href="${esc(claimFragment(c))}" style="color:${OXIDE};">the specimen</a></div>
        </div>`;
    })
    .join("");

  const body = `
<tr><td style="padding:24px 0 0;">
  <img src="${SITE}/brand/letter-stamp.png" width="260" height="32" alt="TERRALORE" style="display:block;border:0;" />
  <div style="font-family:${MONO};font-size:11px;letter-spacing:0.12em;color:${UMBER};margin-top:8px;text-transform:uppercase;">THE LEDGER &mdash; LETTER &#8470; ${esc(entry.slug)} &middot; ${esc(entry.date)}</div>
</td></tr>

<tr><td style="padding:18px 0 22px;border-bottom:2px solid ${BASALT};">
  <div style="font-family:${SANS};font-size:24px;line-height:1.15;font-weight:800;color:${BASALT};text-transform:uppercase;letter-spacing:0.01em;">${esc(entry.title)}</div>
  <div style="font-family:${SANS};font-size:15px;line-height:1.55;color:${BASALT};margin-top:12px;">${esc(entry.summary)}</div>
</td></tr>

<tr><td style="padding:20px 0 6px;">
  ${eyebrow("What moved the record most")}
  <div style="margin-top:12px;">${leadHtml}</div>
</td></tr>

<tr><td style="${sectionRule}padding:16px 0 6px;">
  ${eyebrow("The refresh in numbers")}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;width:100%;"><tr>
    ${countCell("New", entry.counts.new.toLocaleString("en"))}
    ${countCell("Revised", entry.counts.revised.toLocaleString("en"))}
    ${countCell("Withdrawn", entry.counts.retired.toLocaleString("en"))}
    ${countCell("Nations", entry.counts.nations.toLocaleString("en"))}
  </tr></table>
  <div style="font-family:${SANS};font-size:13.5px;line-height:1.55;color:${UMBER};margin:6px 0 14px;">Domains that moved: ${esc(domainsTouched)}. Domains re-pulled without a value change are recorded as unmoved, not assumed.</div>
</td></tr>

<tr><td style="${sectionRule}padding:16px 0 6px;">
  ${eyebrow("Noted, nation by nation")}
  <div style="margin-top:12px;">${notableHtml}</div>
  <div style="font-family:${SANS};font-size:13.5px;line-height:1.55;color:${UMBER};margin:2px 0 14px;">Every one of the ${entry.changes.length.toLocaleString("en")} recorded changes resolves to its claim ID in <a href="${SITE}/ledger/${esc(entry.slug)}" style="color:${OXIDE};">the complete entry</a>.</div>
</td></tr>

<tr><td style="${sectionRule}padding:16px 0 20px;">
  ${eyebrow("The seal")}
  <div style="font-family:${MONO};font-size:11.5px;line-height:1.8;color:${BASALT};margin-top:8px;background:${SAND};border:2px solid ${BASALT};padding:10px 12px;">CORPUS ${esc(seal.version)}<br />ROOT ${esc(seal.root)}</div>
  <div style="font-family:${SANS};font-size:13.5px;line-height:1.55;color:${UMBER};margin-top:8px;">This letter stands on the sealed corpus it reports. Verify any cited file against the seal with sha256sum alone &mdash; <a href="${SITE}/integrity" style="color:${OXIDE};">how, at /integrity</a>.</div>
</td></tr>`;

  const footer = {
    page: `
<tr><td style="${sectionRule}padding:12px 0 28px;">
  <div style="font-family:${MONO};font-size:11px;line-height:1.8;color:${UMBER};">THE ARCHIVED COPY OF LETTER &#8470; ${esc(entry.slug)}, SENT TO THE LEDGER&#8217;S SUBSCRIBERS.<br />ONE LETTER PER RECORDED REFRESH &middot; DOUBLE OPT-IN &middot; SUBSCRIBE AT <a href="${SITE}/ledger" style="color:${OXIDE};">TERRALORE.CO/LEDGER</a><br />terralore.co &mdash; EVERY CLAIM SOURCED &middot; ABSENCE &ne; ZERO &middot; NO SIDES</div>
</td></tr>`,
    campaign: `
<tr><td style="${sectionRule}padding:12px 0 28px;">
  <div style="font-family:${MONO};font-size:11px;line-height:1.8;color:${UMBER};">YOU CONFIRMED A SUBSCRIPTION TO THE LEDGER &mdash; ONE LETTER PER RECORDED REFRESH, NO OTHER MAIL.<br /><a href="{{ UnsubscribeURL }}" style="color:${OXIDE};">LEAVE THE LIST</a> &mdash; ONE CLICK, REMOVED IMMEDIATELY &middot; <a href="${SITE}/privacy" style="color:${OXIDE};">HOW THE ADDRESS IS HANDLED</a><br />terralore.co &mdash; EVERY CLAIM SOURCED &middot; ABSENCE &ne; ZERO &middot; NO SIDES</div>
</td></tr>`,
  };

  const frame = (inner, mode) => `<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(subject)}</title>
</head>
<body style="background-color:${BONE};margin:0;padding:0;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BONE};">
<tr><td align="center" style="padding:8px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
<!--LETTER-BODY-START-->${inner}${footer[mode]}<!--LETTER-BODY-END-->
</table>
</td></tr>
</table>
</body>
</html>
`;

  /* — plain text (first-class, same structure) — */

  const rule = "─".repeat(56);
  const leadText = leadItems
    .map((it) => `${it.head}\n${it.body}\n  ${it.claims.join(" · ")}\n  ${it.url}`)
    .join("\n\n");
  const notableText = notable
    .map((c) => {
      const nation = names.get(c.nation) ?? c.nation;
      return `${nation} — ${c.label}: ${describeChange(c)}.\n  ${c.id}\n  ${claimFragment(c)}`;
    })
    .join("\n\n");

  const textBody = `TERRALORE — THE LEDGER — LETTER № ${entry.slug} · ${entry.date}
${rule}

${entry.title.toUpperCase()}

${entry.summary}

WHAT MOVED THE RECORD MOST
${rule}
${leadText}

THE REFRESH IN NUMBERS
${rule}
NEW ${entry.counts.new.toLocaleString("en")} · REVISED ${entry.counts.revised.toLocaleString("en")} · WITHDRAWN ${entry.counts.retired.toLocaleString("en")} · NATIONS ${entry.counts.nations.toLocaleString("en")}
Domains that moved: ${domainsTouched}. Domains re-pulled without a value
change are recorded as unmoved, not assumed.

NOTED, NATION BY NATION
${rule}
${notableText}

Every one of the ${entry.changes.length.toLocaleString("en")} recorded changes resolves to its claim ID
in the complete entry: ${SITE}/ledger/${entry.slug}

THE SEAL
${rule}
CORPUS ${seal.version}
ROOT ${seal.root}
This letter stands on the sealed corpus it reports. Verify any cited
file against the seal with sha256sum alone: ${SITE}/integrity
`;

  const textFooter = {
    page: `
${rule}
The archived copy of letter № ${entry.slug}, sent to The Ledger's subscribers.
One letter per recorded refresh · double opt-in · subscribe at
${SITE}/ledger

terralore.co — every claim sourced · absence ≠ zero · no sides
`,
    campaign: `
${rule}
You confirmed a subscription to The Ledger — one letter per recorded
refresh, no other mail. Leave the list (one click, removed immediately):
{{ UnsubscribeURL }}
How the address is handled: ${SITE}/privacy

terralore.co — every claim sourced · absence ≠ zero · no sides
`,
  };

  return {
    slug: entry.slug,
    subject,
    entry,
    seal,
    html: { page: frame(body, "page"), campaign: frame(body, "campaign") },
    text: { page: textBody + textFooter.page, campaign: textBody + textFooter.campaign },
  };
}
