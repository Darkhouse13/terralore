#!/usr/bin/env node
// ── Fill empty album slots with approved albums ─────────────────────────────────────────────────────────────────────
// Usage:
//
//   node scripts/social-fill-albums.mjs --approve <slug> [<slug> ...]     record that a reviewed album may go out
//   node scripts/social-fill-albums.mjs [--from YYYY-MM-DD] [--days N]    show the plan (writes nothing)
//   node scripts/social-fill-albums.mjs [--from ...] [--days N] --go      queue it
//
// An album lives in social-out/albums/<slug>/ (slides, caption.txt, alts.json, gate.json, contact.jpg), built by
// social-out/reel-lab/albums/build-album.mjs. It can only be approved, and only be queued, while its gate.json PASSES
// and still matches the files byte for byte (hash of slides + caption): edit a slide or the caption after review and
// it must be rebuilt and approved again. Approval is the human step: run --approve only after the review pass
// (mine on contact.jpg, then the user's — memory user-reviews-reels).
//
// Slots (since 2026-11-04) are photo-1 (10:00), album-1 (17:30), photo-2 (22:00), Casablanca, from data/social-publish.json. A slot is
// empty when the box's drop (/data/terralore-social/status/albums/<date>/<slot>.json) has no file for it. An album is
// already queued when any drop on the box carries its exact caption, so this never posts the same album twice.
// Albums go out in the order they were approved. Each one is queued through scripts/social-queue-album.sh, so every
// queue gate still runs, with the per-slide alt text from alts.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALBUMS = path.join(REPO, 'social-out/albums');
const HOST = process.env.SOCIAL_HOST || 'hetzner';
const DROPS = '/data/terralore-social/status/albums';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const die = (m) => { console.error(m); process.exit(1); };

const slidesOf = (dir) => fs.readdirSync(dir).filter((f) => /^slide-\d+\.jpg$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6))).map((f) => path.join(dir, f));
const hashOf = (dir) => { const h = crypto.createHash('sha256'); for (const f of [...slidesOf(dir), path.join(dir, 'caption.txt')]) h.update(fs.readFileSync(f)); return h.digest('hex').slice(0, 16); };
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

/** Why this album may not go out, or null if it may. */
function blocker(slug, {needApproval = true} = {}) {
  const dir = path.join(ALBUMS, slug);
  if (!fs.existsSync(path.join(dir, 'caption.txt'))) return 'no caption.txt';
  const gate = readJson(path.join(dir, 'gate.json'));
  if (!gate) return 'never gated (run build-album.mjs)';
  if (!gate.pass) return `gate FAILS (${gate.fail.length}): ${gate.fail[0]}`;
  const now = hashOf(dir);
  if (gate.hash !== now) return 'files changed since the gate ran (rebuild)';
  if (!needApproval) return null;
  const ap = readJson(path.join(dir, 'approved.json'));
  if (!ap) return 'not approved';
  if (ap.hash !== now) return 'files changed since approval (rebuild + approve again)';
  return null;
}

// ── approve ─────────────────────────────────────────────────────────────────────────────────────────────────────────
if (args.includes('--approve')) {
  const slugs = args.slice(args.indexOf('--approve') + 1).filter((a) => !a.startsWith('--'));
  if (!slugs.length) die('--approve <slug> [<slug> ...]');
  for (const slug of slugs) {
    const why = blocker(slug, {needApproval: false});
    if (why) die(`${slug}: cannot approve: ${why}`);
    const dir = path.join(ALBUMS, slug);
    fs.writeFileSync(path.join(dir, 'approved.json'), JSON.stringify({hash: hashOf(dir), at: new Date().toISOString()}, null, 2) + '\n');
    console.log(`${slug}: approved`);
  }
  process.exit(0);
}

// ── plan ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const publish = readJson(path.join(REPO, 'data/social-publish.json'));
// Since 2026-11-04 a day is 1 album (album-1) + 2 single photos (photo-1, photo-2); album-2/3 stay only for past days.
// A one-slide build is a photo and fills photo-N; a multi-slide build is an album and fills album-1.
const SLOTS = Object.entries(publish.slots).filter(([k]) => /^instagram:(album-1|photo-\d+)$/.test(k)).map(([k, t]) => ({slot: k.split(':')[1], t})).sort((a, b) => a.t.localeCompare(b.t));
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const from = opt('--from') || tomorrow;
const days = +(opt('--days') || 14);
if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) die('--from YYYY-MM-DD');

// what the box already holds: every album drop's caption, and which slots are taken per date
const remote = JSON.parse(execFileSync('ssh', [HOST, `cd ${DROPS} 2>/dev/null && node -e '
const fs=require("fs");const out={};
for(const d of fs.readdirSync(".")){if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(d))continue;out[d]={};
for(const f of fs.readdirSync(d)){const m=/^((?:album|photo)-\\d+)\\.json$/.exec(f);if(m)try{out[d][m[1]]=JSON.parse(fs.readFileSync(d+"/"+f,"utf8")).caption.trim()}catch{out[d][m[1]]="?"}}}
process.stdout.write(JSON.stringify(out))'`], {encoding: 'utf8'}));
const queuedCaptions = new Set(Object.values(remote).flatMap((d) => Object.values(d)));

const albums = fs.readdirSync(ALBUMS).filter((s) => fs.existsSync(path.join(ALBUMS, s, 'caption.txt')));
const queued = [], ready = [], held = [];
for (const slug of albums) {
  const cap = fs.readFileSync(path.join(ALBUMS, slug, 'caption.txt'), 'utf8').trim();
  if (queuedCaptions.has(cap)) { queued.push(slug); continue; }
  const why = blocker(slug);
  if (why) held.push([slug, why]); else ready.push(slug);
}
ready.sort((a, b) => readJson(path.join(ALBUMS, a, 'approved.json')).at.localeCompare(readJson(path.join(ALBUMS, b, 'approved.json')).at));
const isPhoto = (slug) => slidesOf(path.join(ALBUMS, slug)).length === 1;
const readyAlbums = ready.filter((s) => !isPhoto(s)), readyPhotos = ready.filter(isPhoto);

const plan = [], empty = [];
for (let i = 0; i < days; i++) {
  const date = new Date(Date.parse(from) + i * 864e5).toISOString().slice(0, 10);
  for (const {slot, t} of SLOTS) {
    if (remote[date]?.[slot]) continue;
    const pool = slot.startsWith('photo-') ? readyPhotos : readyAlbums;
    if (pool.length) plan.push({date, slot, t, slug: pool.shift()}); else empty.push(`${date} ${slot} (${t})`);
  }
}

console.log(`already on the box: ${queued.length} album(s)`);
for (const [s, why] of held) console.log(`held: ${s}: ${why}`);
console.log(plan.length ? '\nplan:' : '\nplan: nothing to queue');
for (const p of plan) console.log(`  ${p.date} ${p.slot} ${p.t}  ${p.slug}`);
if (readyAlbums.length + readyPhotos.length) console.log(`\n${readyAlbums.length + readyPhotos.length} approved album(s)/photo(s) left over (no empty slot in ${days} days)`);
if (empty.length) console.log(`\nstill empty after this: ${empty.length} slot(s), first ${empty[0]}`);

if (!args.includes('--go')) { if (plan.length) console.log('\ndry run: add --go to queue'); process.exit(0); }
for (const p of plan) {
  const dir = path.join(ALBUMS, p.slug);
  const why = blocker(p.slug);
  if (why) die(`${p.slug}: ${why}`);
  const slides = slidesOf(dir);
  const alts = readJson(path.join(dir, 'alts.json')) ?? [];
  const altArgs = alts.length === slides.length ? alts.flatMap((a) => ['--alt', a]) : [];
  execFileSync(path.join(REPO, 'scripts/social-queue-album.sh'), [p.date, p.slot, path.join(dir, 'caption.txt'), ...slides, ...altArgs], {stdio: 'inherit', cwd: REPO});
}
