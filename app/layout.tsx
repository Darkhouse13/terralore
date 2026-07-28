import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Newsreader, JetBrains_Mono } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Editorial display serif with character (optical sizing + a touch of "soft").
const fraunces = Fraunces({
  variable: "--ff-display",
  subsets: ["latin"],
  axes: ["opsz"], // drop SOFT/WONK — unused, and they bloat the variable font
  display: "swap",
});

// Long-form reading serif — used for the history article body.
const newsreader = Newsreader({
  variable: "--ff-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// UI / interface sans — labels, navigation, data. Meridian recasts off Inter to
// Hanken Grotesk for a touch more character without losing legibility.
const hanken = Hanken_Grotesk({
  variable: "--ff-sans",
  subsets: ["latin"],
  display: "swap",
});

// Cartographic detailing — coordinates, dates, codes.
const mono = JetBrains_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${fraunces.variable} ${newsreader.variable} ${hanken.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
