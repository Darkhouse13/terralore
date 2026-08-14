// ── Send one Ledger Letter — the deliberate act ────────────────────────────
//   node scripts/send-letter.mjs --entry 0001 [--dry-run]
//
// Runs where the listmonk API is reachable (the runner container or the box;
// the admin API is deliberately not exposed on the apex). Reads the COMMITTED
// campaign artifacts (data/letters/<NNNN>.campaign.*) — never regenerates, so
// what is sent is exactly what was reviewed and committed. Env:
//   LISTMONK_URL, LISTMONK_API_USER, LISTMONK_API_TOKEN, LISTMONK_LEDGER_LIST_ID
// (set on the runner service; also in /root/.listmonk-admin on the box).
//
// Idempotent: campaigns are looked up by their deterministic name
// ("ledger-letter-NNNN"); an existing campaign in any post-draft state is
// never re-sent. --dry-run creates nothing and reports what would happen.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const idx = process.argv.indexOf("--entry");
const slug = idx > -1 ? process.argv[idx + 1] : null;
const dryRun = process.argv.includes("--dry-run");
if (!slug || !/^\d{4}$/.test(slug)) {
  console.error("usage: send-letter.mjs --entry <NNNN> [--dry-run]");
  process.exit(1);
}

const BASE = process.env.LISTMONK_URL;
const USER = process.env.LISTMONK_API_USER;
const TOKEN = process.env.LISTMONK_API_TOKEN;
const LIST_ID = Number(process.env.LISTMONK_LEDGER_LIST_ID);
if (!BASE || !USER || !TOKEN || !LIST_ID) {
  console.error("missing LISTMONK_URL / LISTMONK_API_USER / LISTMONK_API_TOKEN / LISTMONK_LEDGER_LIST_ID");
  process.exit(1);
}

const html = readFileSync(join(root, "data", "letters", `${slug}.campaign.html`), "utf8");
const text = readFileSync(join(root, "data", "letters", `${slug}.campaign.txt`), "utf8");
const entry = JSON.parse(readFileSync(join(root, "public", "ledger", `${slug}.json`), "utf8"));
const subject = `The Ledger № ${entry.slug} — ${entry.title}`;
const name = `ledger-letter-${slug}`;

const api = async (path, opts = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${USER}:${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body.data;
};

// 1. idempotency — an existing campaign of this name is the record of a send
const existing = await api(`/campaigns?query=${encodeURIComponent(name)}&per_page=100`);
const prior = (existing.results ?? []).find((c) => c.name === name);
if (prior) {
  console.log(`✓ campaign "${name}" already exists (id ${prior.id}, status ${prior.status}) — not re-sending.`);
  console.log(`  A letter is sent once; manage it in the listmonk admin if it is still a draft.`);
  process.exit(0);
}

const subscribers = await api(`/lists/${LIST_ID}`);
console.log(`letter № ${slug} → list "${subscribers.name}" (${subscribers.subscriber_count ?? "?"} subscribers)`);
console.log(`subject: ${subject}`);

if (dryRun) {
  console.log("--dry-run: no campaign created, nothing sent.");
  process.exit(0);
}

// 2. create the campaign from the committed artifacts
const campaign = await api("/campaigns", {
  method: "POST",
  body: JSON.stringify({
    name,
    subject,
    lists: [LIST_ID],
    type: "regular",
    content_type: "html",
    body: html,
    altbody: text,
  }),
});
console.log(`✓ campaign created (id ${campaign.id})`);

// 3. send — the deliberate act itself
await api(`/campaigns/${campaign.id}/status`, {
  method: "PUT",
  body: JSON.stringify({ status: "running" }),
});
console.log(`✓ letter № ${slug} is sending to "The Ledger".`);
