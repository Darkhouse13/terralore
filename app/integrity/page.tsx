import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { archivedSeals, currentManifest } from "@/lib/integrity";
import { breadcrumbLd, clampText, routes, SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * The Seal, explained — the Living Record's Layer 2 (docs/living-record.md §2).
 *
 * Written for a skeptical reader: what is hashed, how the root is built, how
 * to verify a fetched file with nothing but sha256sum, and — stated plainly —
 * what this does and does not prove. The honest claim is tamper-EVIDENCE:
 * past manifests are archived append-only here and in the public git history,
 * so the corpus cannot be silently rewritten. No external services, no
 * blockchain, no theater.
 *
 * Server-rendered, no client JS, mounted-core grammar (a reading surface).
 */

const DESCRIPTION = clampText(
  "Every Terralore corpus state is sealed: per-file SHA-256 hashes and a root hash, " +
    "published at /integrity.json and archived append-only. Verify any claims file " +
    "or twin against the seal with sha256sum alone.",
);

export const metadata: Metadata = {
  title: "Integrity — the corpus seal",
  description: DESCRIPTION,
  alternates: { canonical: "/integrity" },
  openGraph: {
    type: "website",
    title: "Integrity — the corpus seal",
    description: DESCRIPTION,
    url: "/integrity",
    siteName: SITE_NAME,
  },
};

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="block overflow-x-auto border-2 border-basalt bg-sand px-3 py-2 font-mono text-[11.5px] leading-relaxed whitespace-pre">
      {children}
    </code>
  );
}

export default function IntegrityPage() {
  const m = currentManifest();
  const seals = archivedSeals();
  const publicFiles = Object.keys(m.files).filter((f) => f.startsWith("public/")).length;
  const repoFiles = m.counts.files - publicFiles;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Integrity", path: "/integrity" },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone text-basalt">
        <div className="mount relative mx-auto max-w-[46rem] px-5 pt-4 pb-20 md:px-8 md:pt-8">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="text-oxide">
                  Terralore
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                Integrity
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>
                THE SEAL
                <br />
                VERSION {m.version}
              </span>
            </span>
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              The seal
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              Corpus version {m.version} · {m.counts.files.toLocaleString("en")} files hashed
            </p>
            <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed">
              Terralore is a record, and a record you cannot check is a claim. Every state
              of this corpus — the authored histories, the baked data files, and the
              published claims bundles and markdown twins a reader actually fetches — is
              sealed: one SHA-256 per file, one root hash over the whole set, published at{" "}
              <a href="/integrity.json" className="text-oxide underline underline-offset-2">
                /integrity.json
              </a>{" "}
              and archived under a new version every time the corpus changes.
            </p>
          </header>

          <section className="mt-6 border-t-2 border-basalt pt-5">
            <h2 className="eyebrow text-umber">Current root</h2>
            <p className="mt-2 font-mono text-[12px] leading-relaxed break-all select-text">
              sha256:{m.root}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="eyebrow text-umber">Sealed</dt>
                <dd className="mt-1 font-mono text-[13px]">{m.sealed.slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="eyebrow text-umber">Served files</dt>
                <dd className="mt-1 font-mono text-[13px]">{publicFiles.toLocaleString("en")}</dd>
              </div>
              <div>
                <dt className="eyebrow text-umber">Repo files</dt>
                <dd className="mt-1 font-mono text-[13px]">{repoFiles.toLocaleString("en")}</dd>
              </div>
            </dl>
            <h3 className="eyebrow mt-5 text-umber">Data vintages in this version</h3>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              {Object.entries(m.vintages).map(([k, v]) => (
                <li key={k} className="font-mono text-[11.5px]">
                  <span className="text-umber uppercase">{k}</span> {v}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              How to verify
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              No special tooling — the constructions are deliberately boring. To check a
              file you fetched (say France&rsquo;s claims bundle) against the seal:
            </p>
            <div className="mt-3">
              <Mono>
                {`curl -s ${SITE_URL}/country/FRA.claims.json | sha256sum\n# compare to files["public/country/FRA.claims.json"] in /integrity.json`}
              </Mono>
            </div>
            <p className="mt-4 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              To check that the manifest itself is internally consistent, rebuild the root
              from its own file list: one line per file as{" "}
              <span className="font-mono text-[12.5px]">&lt;sha256&gt;␣␣&lt;path&gt;</span>, sorted by
              path, joined with newlines, one trailing newline — then hash that text:
            </p>
            <div className="mt-3">
              <Mono>
                {`curl -s ${SITE_URL}/integrity.json | \\\n  python3 -c 'import json,sys,hashlib; m=json.load(sys.stdin); \\\n    t="".join(f"{h}  {p}\\n" for p,h in sorted(m["files"].items())); \\\n    print(hashlib.sha256(t.encode()).hexdigest())'\n# must equal the manifest's "root"`}
              </Mono>
            </div>
            <p className="mt-4 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              Paths under <span className="font-mono text-[12.5px]">public/</span> are
              fetchable at the same path on this site (drop the prefix). Repo paths — the
              authored history files and baked data — are verifiable in the{" "}
              <a
                href="https://github.com/Darkhouse13/terralore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxide underline underline-offset-2"
              >
                public git history
              </a>
              , where every past manifest is also committed.
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              What this proves, and what it does not
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              The seal is tamper-<em>evidence</em>, not tamper-proofing. Nothing stops the
              operators of this site from changing a figure; what the seal removes is the
              ability to do it <em>silently</em>. Every version of the manifest is archived
              append-only below, committed to the public git history, and held in whatever
              caches and crawls have already fetched it — so a rewritten past would hash
              differently than the record everyone else already has. The claim is exactly
              that large and no larger: no blockchain, no external timestamping service,
              no cryptographic theater. Legitimate changes are the point of a living
              record — and they are published, with what changed and why, in{" "}
              <Link href="/ledger" className="text-oxide underline underline-offset-2">
                the ledger
              </Link>
              .
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              Every seal cut
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
              Append-only. Each version is the corpus as it stood; none is ever edited or
              removed.
            </p>
            <ul className="mt-4 border-t-2 border-basalt">
              {seals.map((s) => (
                <li
                  key={s.version}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-basalt py-2.5"
                >
                  <a
                    href={`/integrity/${s.version}.json`}
                    className="font-mono text-[12.5px] text-oxide underline underline-offset-2"
                  >
                    {s.version}
                  </a>
                  <span className="min-w-0 font-mono text-[10.5px] break-all text-umber">
                    {s.root.slice(0, 24)}…
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-10 flex justify-between font-mono text-[10px] text-umber">
            <div>EVERY CLAIM SOURCED</div>
            <div>ABSENCE ≠ ZERO</div>
            <div>NO SIDES</div>
          </footer>
        </div>
      </main>
    </>
  );
}
