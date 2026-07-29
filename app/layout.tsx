import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Literata } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import "./globals.css";

/* ── Type — see DESIGN.md ───────────────────────────────────────────────────
   Three families, and the loading strategy is a measured decision rather than
   a preference.

   The previous system ran four families across FIVE files, 230 KB, every one
   of them preloaded at high priority — which put them ahead of the LCP image
   in the queue. On Lighthouse's 1.6 Mbps mobile profile that is ~1.15s of
   transfer before the largest element can begin painting, and it matched the
   observed FCP 0.9s → LCP 4.2s gap almost exactly.

   Stratum cuts the critical path to TWO files:

     Literata        display AND reading. It was designed for long-form screen
                     reading and carries enough structure at weight to work at
                     display sizes, so one family replaces two (Fraunces for
                     display + Newsreader for reading). Preloaded.

     Literata italic declared as a SEPARATE instance with preload:false. Italic
                     is used for taglines and emphasis only — never above the
                     fold on the landing page, and never the LCP element — so
                     it has no business on the critical path. Declaring it
                     separately is what makes that possible; a single instance
                     with style:["normal","italic"] preloads both.

     IBM Plex Sans   interface. Preloaded.
     IBM Plex Mono   cartographic detail — codes, coordinates, years. One
                     superfamily with Plex Sans (shared metrics, shared
                     institutional character). NOT preloaded: it renders small
                     uppercase labels where a swap is imperceptible.

   `display: "swap"` throughout, so text is always readable immediately in the
   fallback rather than blocked on a webfont. */

const literata = Literata({
  variable: "--ff-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const literataItalic = Literata({
  variable: "--ff-serif-italic",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
  weight: ["400", "600"],
  preload: false,
});

const plexSans = IBM_Plex_Sans({
  variable: "--ff-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  preload: false,
});

export const metadata: Metadata = {
  // metadataBase makes every relative `alternates.canonical` / OG url absolute.
  // Without it Next emits relative OG urls, which most crawlers discard.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      // Answer engines quote as much as they are allowed to; the whole corpus
      // is published to be cited, so we lift the default snippet caps.
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "reference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${literata.variable} ${literataItalic.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
