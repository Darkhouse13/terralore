import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
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
      <GoogleAnalytics gaId="G-DXEHRSTWXX" />
    </html>
  );
}
