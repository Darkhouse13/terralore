import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Newsreader, JetBrains_Mono } from "next/font/google";
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
  title: "Terralore — An Atlas of How Nations Came to Be",
  description:
    "An interactive globe and living archive of world history. Explore any nation and trace the long path it took to become a country — every claim sourced.",
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
