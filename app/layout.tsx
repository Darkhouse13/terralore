import type { Metadata, Viewport } from "next";
import { bricolage, plexMono, schibsted } from "@/app/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import "./globals.css";

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

// The browser-chrome colour is bone — the one page ground of the strata
// world, the same value the manifest, the icon plates and the OG cards stand
// on, so a shared link, an installed app and an open tab all frame the site
// in one colour.
export const viewport: Viewport = {
  themeColor: "#efe7d8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${schibsted.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
      {/* Analytics load on ENGAGEMENT — first scroll/pointer/key — or after 7
          idle seconds, whichever comes first. The tag's ~200ms of throttled
          main-thread evaluation is a single long task; loading it on the
          gesture (or well past settle) keeps it out of every reader's — and
          every measurement's — initial window. Trade-off, accepted: a visit
          that bounces inside 7s with zero interaction goes unrecorded. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=0,f=function(){if(d)return;d=1;clearTimeout(t);var s=document.createElement("script");s.src="https://www.googletagmanager.com/gtag/js?id=G-DXEHRSTWXX";s.async=!0;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config","G-DXEHRSTWXX")},t=setTimeout(f,7e3),e=["scroll","pointerdown","keydown","touchstart"],i=0;for(;i<e.length;i++)addEventListener(e[i],f,{passive:!0,once:!0})})();`,
        }}
      />
    </html>
  );
}
