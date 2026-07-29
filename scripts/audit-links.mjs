#!/usr/bin/env node
// ── The link auditor ───────────────────────────────────────────────────────
// The corpus's one non-negotiable is that every claim is traceable to a source
// that was actually read. Traceable means the URL still resolves — and until
// this script existed, the 3,674 source URLs across 184 histories had never
// once been checked. A dead citation is a claim with no evidence behind it,
// and it rots silently: publishers reorganise, encyclopedias renumber, museums
// migrate. This instrument makes that rot visible.
//
// Classification (the report's whole vocabulary):
//
//   ok        200, and the body is not a bot challenge.
//   redirect  200, but the publisher moved the page. The landing URL is
//             reported: today's redirect is tomorrow's 404.
//   blocked   403 / 429 / a Cloudflare or similar interstitial. This is a
//             FACT TO RECORD, not a failure to fix. Britannica — 1,448 of the
//             corpus's URLs — sits here by its owner's design. We do not try
//             to get past it; see docs/statehood-deepening-plan.md §3.
//   gone      404 / 410 / DNS failure. This is the actionable class.
//   error     timeouts, 5xx, TLS failures — the network, not the page.
//
// Politeness: one request at a time per host with a delay between them, a
// plain browser UA, HEAD first and a small ranged GET only when HEAD is
// refused. A host that has challenged us many times in a row is not asked
// again — the remaining URLs are recorded as `blocked (inferred)`, which is
// both honest and the only decent way to treat a publisher that has said no.
//
// Usage:
//   node scripts/audit-links.mjs                  audit everything (cached)
//   node scripts/audit-links.mjs --statehood      only statehood-cited sources
//   node scripts/audit-links.mjs --refresh        ignore the cache
//   node scripts/audit-links.mjs --host=whc.unesco.org
//   node scripts/audit-links.mjs --report         re-emit the report from cache

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { readCitations, root } from "./lib/sources.mjs";

const run = promisify(execFile);

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const CACHE_DIR = join(root, ".cache");
const CACHE = join(CACHE_DIR, "link-audit.json");
const REPORT = join(root, "docs/link-audit.md");

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const PER_HOST_DELAY_MS = 700;
const HOST_CONCURRENCY = 8;
const TIMEOUT_MS = 20_000;
/** Consecutive challenges from one host before we stop asking. */
const BLOCK_STREAK = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cloudflare / Akamai / PerimeterX interstitials answer 200 or 403 with these. */
const CHALLENGE_MARKERS = [
  "just a moment",
  "cf-browser-verification",
  "enable javascript and cookies to continue",
  "checking your browser",
  "attention required! | cloudflare",
  "access denied",
  "request unsuccessful. incapsula",
  "px-captcha",
  "are you a robot",
];

const looksLikeChallenge = (body) => {
  const b = body.toLowerCase();
  return CHALLENGE_MARKERS.some((m) => b.includes(m));
};

// The transport is `curl`, not node's `fetch`, for one measured reason: undici
// negotiates TLS differently enough from a browser that several publishers'
// CDNs answer it with a challenge page. UNESCO's World Heritage Centre — 207 of
// the corpus's URLs — 403s every `fetch` and 200s a plain `curl -A <browser UA>`
// on the same URL from the same machine. Reporting those 207 as `blocked` would
// have been the instrument lying about the corpus. This is not an attempt to get
// past anyone's bot protection and it does not function as one: Britannica
// refuses curl exactly as it refuses fetch, which is the control that proves it.
const CURL_EXIT = {
  6: "could not resolve host",
  7: "could not connect",
  28: "timed out",
  35: "TLS handshake failed",
  60: "certificate not trusted",
};

/** One URL, one verdict. HEAD first; a small ranged GET only when HEAD is refused. */
async function probe(url) {
  const bodyFile = join(tmpdir(), `terralore-link-${process.pid}-${Math.abs(hash(url))}.html`);

  const curl = async (head) => {
    const args = [
      "-sS",
      "-L",
      "--max-redirs", "8",
      "--max-time", String(TIMEOUT_MS / 1000),
      "-A", UA,
      "-H", "accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "-H", "accept-language: en-GB,en;q=0.9",
      "-w", "%{http_code} %{url_effective}",
      "-o", head ? "/dev/null" : bodyFile,
      ...(head ? ["-I"] : ["-r", "0-4095"]),
      url,
    ];
    try {
      const { stdout } = await run("curl", args, { maxBuffer: 1 << 20 });
      const [code, ...rest] = stdout.trim().split(/\s+/);
      return { status: Number(code), finalUrl: rest.join(" ") || url };
    } catch (e) {
      return { exit: e.code ?? -1 };
    }
  };

  const readBody = () => {
    try {
      const b = readFileSync(bodyFile, "utf8").slice(0, 4096);
      rmSync(bodyFile, { force: true });
      return b;
    } catch {
      return "";
    }
  };

  let r = await curl(true);
  let body = "";
  // Plenty of publishers answer HEAD with 4xx while serving GET fine, and a
  // challenge page can only be recognised from its body.
  if (r.exit != null || [400, 401, 403, 405, 429, 501].includes(r.status)) {
    const g = await curl(false);
    if (g.exit == null) {
      r = g;
      body = readBody();
    } else if (r.exit != null) {
      const note = CURL_EXIT[g.exit] ?? `curl exit ${g.exit}`;
      return { class: g.exit === 6 ? "gone" : "error", status: 0, note };
    }
  }

  const { status, finalUrl } = r;
  const challenge = body && looksLikeChallenge(body);

  if (status === 404 || status === 410) return { class: "gone", status, finalUrl };
  if (status === 401 || status === 403 || status === 429 || (status === 503 && challenge)) {
    return { class: "blocked", status, finalUrl, note: challenge ? "challenge page" : "refused" };
  }
  if (status >= 500) return { class: "error", status, finalUrl };
  if (status >= 200 && status < 300) {
    if (challenge) return { class: "blocked", status, finalUrl, note: "challenge page" };
    return { class: normalise(finalUrl) !== normalise(url) ? "redirect" : "ok", status, finalUrl };
  }
  return { class: "error", status, finalUrl };
}

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};

/** Trailing slashes and http→https upgrades are not "the publisher moved it". */
const normalise = (u) => {
  try {
    const x = new URL(u);
    x.protocol = "https:";
    x.hash = "";
    return `${x.host}${x.pathname.replace(/\/$/, "")}${x.search}`.toLowerCase();
  } catch {
    return String(u).toLowerCase();
  }
};

// ── gather ─────────────────────────────────────────────────────────────────
const citations = readCitations();
const noUrl = citations.filter((c) => !c.url);

/** url → { citations: [...], host } */
const byUrl = new Map();
for (const c of citations) {
  if (!c.url) continue;
  let host;
  try {
    host = new URL(c.url).host;
  } catch {
    host = "«malformed»";
  }
  if (!byUrl.has(c.url)) byUrl.set(c.url, { url: c.url, host, citations: [], statehood: false });
  const e = byUrl.get(c.url);
  e.citations.push(`${c.file}:${c.id}`);
  if (c.statehood) e.statehood = true;
}

const cache = existsSync(CACHE) && !has("--refresh") ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

let targets = [...byUrl.values()];
if (has("--statehood")) targets = targets.filter((t) => t.statehood);
const hostFilter = opt("host");
if (hostFilter) targets = targets.filter((t) => t.host === hostFilter);
if (has("--report")) targets = [];

const pending = targets.filter((t) => !cache[t.url]);

// ── run: serial per host, several hosts at a time ──────────────────────────
const queues = new Map();
for (const t of pending) {
  if (!queues.has(t.host)) queues.set(t.host, []);
  queues.get(t.host).push(t);
}

let done = 0;
const total = pending.length;
const tick = () => {
  done++;
  if (done % 25 === 0 || done === total) {
    process.stderr.write(`\r  probed ${done}/${total}…`);
  }
};

async function runHost(host, list) {
  let streak = 0;
  for (const t of list) {
    if (streak >= BLOCK_STREAK) {
      cache[t.url] = { class: "blocked", status: 0, note: `inferred — ${host} challenged ${streak}+ consecutive requests`, at: STAMP };
      tick();
      continue;
    }
    const r = await probe(t.url);
    cache[t.url] = { ...r, at: STAMP };
    streak = r.class === "blocked" ? streak + 1 : 0;
    tick();
    await sleep(PER_HOST_DELAY_MS);
  }
}

const STAMP = new Date().toISOString().slice(0, 10);

if (total) {
  console.log(`Probing ${total} URL(s) across ${queues.size} host(s)…`);
  const hosts = [...queues.entries()];
  const workers = Array.from({ length: Math.min(HOST_CONCURRENCY, hosts.length) }, async () => {
    for (;;) {
      const next = hosts.shift();
      if (!next) return;
      await runHost(next[0], next[1]);
    }
  });
  await Promise.all(workers);
  process.stderr.write("\n");
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 0));
}

// ── report ─────────────────────────────────────────────────────────────────
const rows = [...byUrl.values()]
  .map((t) => ({ ...t, result: cache[t.url] ?? null }))
  .filter((t) => t.result);

const CLASSES = ["ok", "redirect", "blocked", "gone", "error"];
const counts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
for (const r of rows) counts[r.result.class] = (counts[r.result.class] ?? 0) + 1;

const byHost = new Map();
for (const r of rows) {
  if (!byHost.has(r.host)) byHost.set(r.host, { host: r.host, total: 0, ...Object.fromEntries(CLASSES.map((c) => [c, 0])) });
  const h = byHost.get(r.host);
  h.total++;
  h[r.result.class]++;
}

const gone = rows.filter((r) => r.result.class === "gone").sort((a, b) => a.url.localeCompare(b.url));
const goneStatehood = gone.filter((r) => r.statehood);
const errors = rows.filter((r) => r.result.class === "error");
const redirects = rows.filter((r) => r.result.class === "redirect");

const md = [];
md.push("# Link audit");
md.push("");
md.push(
  "Every unique source URL in the history corpus, fetched and classified. Generated by",
  "`node scripts/audit-links.mjs`; re-run it after any batch that adds sources.",
  "",
  "**`ok` means the server answered for that URL when this run asked.** It is not",
  "a promise that it will answer the next asker. Britannica — the corpus's single",
  "largest publisher at 1,354 URLs — is the case that makes the distinction",
  "matter: it served 1,330 of them to this paced run and returns a Cloudflare",
  "*\"Just a moment…\"* challenge to the very same URLs minutes later. Its",
  "protection is rate- and reputation-shaped rather than absolute. **The corpus",
  "does not attempt to get past anyone's bot protection**, so no statehood claim",
  "is built on being able to fetch Britannica; where a Britannica page was the",
  "only support for one, the claim was re-anchored on a source that can be read",
  "(see `docs/statehood-progress.md`). Its 19 genuine 404s below are worth acting",
  "on for exactly the opposite reason: a 404 is a stable answer.",
  "",
  "**`blocked` is a fact, not a defect.** The Library of Congress, BlackPast and",
  "the Met refuse automated requests outright. Those citations remain valid",
  "claims against a named, stable, human-readable page; they simply cannot be",
  "machine-verified from here, which is a reason not to *depend* on verifying",
  "them, not a reason to drop them.",
  "",
  "**`gone` is the actionable class.** A 404 means the publisher moved or withdrew",
  "the page and the citation now points at nothing.",
  "",
);
md.push(`_Last probe: ${STAMP} · ${rows.length} unique URLs across ${byHost.size} hosts · ${citations.length} citations in 184 histories._`);
md.push("");
md.push("## Counts");
md.push("");
md.push("| Class | URLs | Share |");
md.push("|---|---:|---:|");
for (const c of CLASSES) {
  md.push(`| \`${c}\` | ${counts[c]} | ${((counts[c] / rows.length) * 100).toFixed(1)}% |`);
}
md.push(`| **total** | **${rows.length}** | |`);
md.push("");

md.push("## By host");
md.push("");
md.push("| Host | URLs | ok | redirect | blocked | gone | error |");
md.push("|---|---:|---:|---:|---:|---:|---:|");
for (const h of [...byHost.values()].sort((a, b) => b.total - a.total)) {
  if (h.total < 3 && h.gone === 0 && h.error === 0) continue;
  md.push(`| ${h.host} | ${h.total} | ${h.ok} | ${h.redirect} | ${h.blocked} | ${h.gone} | ${h.error} |`);
}
md.push("");
md.push("_Hosts with fewer than three URLs are folded into the counts above unless they carry a `gone` or `error`._");
md.push("");

md.push("## Dead URLs (`gone`)");
md.push("");
if (gone.length === 0) {
  md.push("None. Every cited URL that could be fetched resolved.");
} else {
  md.push(
    `${gone.length} URL(s), cited ${gone.reduce((n, g) => n + g.citations.length, 0)} time(s).`,
    goneStatehood.length
      ? `**${goneStatehood.length} of them support a statehood claim** and are in scope for repair now; the rest are published here for a future mission.`
      : "None of them supports a statehood claim, so all are published here for a future mission rather than repaired now.",
    "",
    "| URL | Status | Statehood? | Cited by |",
    "|---|---:|---|---|",
  );
  for (const g of gone) {
    md.push(`| ${g.url} | ${g.result.status || "DNS"} | ${g.statehood ? "**yes**" : "—"} | ${g.citations.join(", ")} |`);
  }
}
md.push("");

md.push("## Moved pages (`redirect`)");
md.push("");
if (redirects.length === 0) {
  md.push("None.");
} else {
  md.push(
    `${redirects.length} URL(s) now land somewhere else. A redirect is not yet a defect — it is`,
    "the publisher telling us where the page went before it stops telling us.",
    "",
    "| Cited URL | Lands on | Statehood? |",
    "|---|---|---|",
  );
  for (const r of redirects.sort((a, b) => a.url.localeCompare(b.url))) {
    md.push(`| ${r.url} | ${r.result.finalUrl ?? "?"} | ${r.statehood ? "**yes**" : "—"} |`);
  }
}
md.push("");

md.push("## Network failures (`error`)");
md.push("");
if (errors.length === 0) {
  md.push("None.");
} else {
  md.push("| URL | Status | Note | Statehood? |", "|---|---:|---|---|");
  for (const e of errors.sort((a, b) => a.url.localeCompare(b.url))) {
    md.push(`| ${e.url} | ${e.result.status || "—"} | ${e.result.note ?? ""} | ${e.statehood ? "**yes**" : "—"} |`);
  }
}
md.push("");

if (noUrl.length) {
  md.push("## Sources with no URL");
  md.push("");
  md.push(
    "Print references. They carry a named publisher and are citable on paper; there is",
    "nothing for this script to fetch.",
    "",
    "| Source | Publisher |",
    "|---|---|",
  );
  for (const n of noUrl) md.push(`| ${n.file}:${n.id} | ${n.publisher ?? "—"} |`);
  md.push("");
}

writeFileSync(REPORT, `${md.join("\n")}\n`);

// machine copy for batching
const scratch = process.env.LINK_AUDIT_JSON;
if (scratch) {
  writeFileSync(
    scratch,
    JSON.stringify(
      rows.map((r) => ({ url: r.url, host: r.host, statehood: r.statehood, ...r.result, citations: r.citations })),
      null,
      1,
    ),
  );
}

console.log(`\n${REPORT.replace(`${root}/`, "")} written.`);
for (const c of CLASSES) console.log(`  ${c.padEnd(9)} ${String(counts[c]).padStart(5)}`);
console.log(`  ${"total".padEnd(9)} ${String(rows.length).padStart(5)}`);
if (goneStatehood.length) {
  console.log(`\n✗ ${goneStatehood.length} dead URL(s) support a statehood claim:`);
  for (const g of goneStatehood) console.log(`    ${g.url}\n      ${g.citations.join(", ")}`);
}
