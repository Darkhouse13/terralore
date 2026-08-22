import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import dataPackage from "@/public/datasets/chronicle-events/1.0.0/datapackage.json";
import {
  abs,
  breadcrumbLd,
  CONTENT_LICENSE,
  publisher,
  routes,
  SITE_NAME,
  siteOgImages,
} from "@/lib/seo";

const PATH = routes.chronicleEventsDataset();
const VERSION_ROOT = `${PATH}/${dataPackage.version}`;
const DESCRIPTION =
  "Download 4,564 curated historical events from 184 Terralore country chronicles, with stable claim IDs, canonical URLs and 8,268 source relationships.";

export const metadata: Metadata = {
  title: "Chronicle Events — downloadable historical dataset",
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: "Terralore Chronicle Events — downloadable dataset",
    description: DESCRIPTION,
    url: PATH,
    siteName: SITE_NAME,
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Terralore Chronicle Events — downloadable dataset",
    description: DESCRIPTION,
    images: siteOgImages(),
  },
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

const resourceLabels: Record<string, string> = {
  "events.csv": "Events — CSV",
  "event-sources.csv": "Event-to-source relations — CSV",
  "sources.csv": "Source records — CSV",
  "events.ndjson": "Events with embedded source keys — NDJSON",
};

function datasetLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${abs(PATH)}#dataset`,
    name: dataPackage.title,
    description: dataPackage.description,
    url: abs(PATH),
    version: dataPackage.version,
    datePublished: dataPackage.created,
    dateModified: dataPackage.terralore.historyUpdatedThrough,
    creator: publisher,
    publisher,
    license: CONTENT_LICENSE,
    isAccessibleForFree: true,
    spatialCoverage: "World",
    keywords: [
      "world history",
      "historical events",
      "country chronicles",
      "citations",
      "open data",
    ],
    measurementTechnique:
      "Editorially curated event records derived from Terralore country chronicles; not an exhaustive event census.",
    distribution: dataPackage.resources.map((resource) => ({
      "@type": "DataDownload",
      name: resourceLabels[resource.path] ?? resource.path,
      contentUrl: abs(`${VERSION_ROOT}/${resource.path}`),
      encodingFormat: resource.mediatype,
      contentSize: `${resource.bytes} bytes`,
      sha256: resource.hash.replace("sha256:", ""),
    })),
  };
}

export default function ChronicleEventsDatasetPage() {
  const stats = dataPackage.terralore;
  return (
    <>
      <JsonLd
        data={[
          datasetLd(),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Chronicle Events", path: PATH },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone text-basalt">
        <div className="mount relative mx-auto max-w-[50rem] px-5 pt-4 pb-20 md:px-8 md:pt-8">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="text-oxide">Terralore</Link></li>
              <li aria-hidden className="text-oxide">·</li>
              <li aria-current="page" className="text-umber">Chronicle Events</li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>DATASET<br />VERSION {dataPackage.version}</span>
            </span>
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              Chronicle events
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {stats.events.toLocaleString("en")} events · {stats.countries} chronicles · {stats.eventSourceLinks.toLocaleString("en")} source links
            </p>
            <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed">
              The event layer of Terralore as a citable, machine-readable release. Each row
              carries a stable claim ID, country, date, category, authored summary, canonical
              page fragment and resolvable source relations. The package is deterministic,
              checksummed and part of the sealed corpus.
            </p>
          </header>

          <section className="mt-7 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">Download</h2>
            <ul className="mt-3 border-t-2 border-basalt">
              {dataPackage.resources.map((resource) => (
                <li key={resource.path} className="border-b-2 border-basalt">
                  <a href={`${VERSION_ROOT}/${resource.path}`} download className="pressable flex flex-wrap items-baseline justify-between gap-2 py-3">
                    <span className="font-sans text-[14px] font-medium">{resourceLabels[resource.path] ?? resource.path}</span>
                    <span className="font-mono text-[10.5px] text-umber">{formatBytes(resource.bytes)} · SHA-256 RECORDED</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase">
              <a href={`${VERSION_ROOT}/datapackage.json`}>Data Package metadata</a>
              <a href={`${VERSION_ROOT}/SHA256SUMS`}>SHA-256 checksums</a>
              <a href={`${VERSION_ROOT}/README.md`}>Package readme</a>
              <a href={`${VERSION_ROOT}/LICENSE.md`}>Licence scope</a>
            </div>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">What is in the record</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <div><dt className="eyebrow text-umber">Events</dt><dd className="mt-1 font-mono text-[17px]">{stats.events.toLocaleString("en")}</dd></div>
              <div><dt className="eyebrow text-umber">Nations</dt><dd className="mt-1 font-mono text-[17px]">{stats.countries}</dd></div>
              <div><dt className="eyebrow text-umber">Sources</dt><dd className="mt-1 font-mono text-[17px]">{stats.sourceRecords.toLocaleString("en")}</dd></div>
              <div><dt className="eyebrow text-umber">Links</dt><dd className="mt-1 font-mono text-[17px]">{stats.eventSourceLinks.toLocaleString("en")}</dd></div>
            </dl>
            <p className="mt-5 font-sans text-[14px] leading-relaxed">
              This is a curated reference corpus, not an exhaustive census. Counts do not
              measure historical activity, severity or importance. Approximate dates remain
              approximate; BCE years are negative integers; categories are editorial; country
              codes follow Natural Earth ADM0_A3 and do not always equal ISO alpha-3.
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">Citation and licence</h2>
            <p className="mt-3 border-2 border-basalt bg-sand px-4 py-3 font-mono text-[11.5px] leading-relaxed select-text">
              Terralore (2026). <i>Terralore Chronicle Events</i> (Version {dataPackage.version}) [Data set]. {abs(PATH)}
            </p>
            <p className="mt-4 font-sans text-[14px] leading-relaxed">
              Terralore&rsquo;s event summaries and compilation structure are released under{" "}
              <a href={CONTENT_LICENSE} rel="license" className="underline underline-offset-2">CC BY 4.0</a>.
              Third-party names and URLs in the source table are citations; their underlying
              works remain subject to their publishers&rsquo; own terms. Blank source-licence or
              access-date cells mean the metadata was not recorded, not that rights are absent.
            </p>
          </section>

          <footer className="mt-10 flex flex-wrap justify-between gap-3 font-mono text-[10px] text-umber">
            <Link href={routes.atlas()}>THE ATLAS</Link>
            <Link href={routes.integrity()}>VERIFY THE SEAL</Link>
            <span>EVERY CLAIM SOURCED</span>
          </footer>
        </div>
      </main>
    </>
  );
}
