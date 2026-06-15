import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Display serif with editorial warmth, used with restraint (hero, section leads).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

// Warm humanist sans for body. Avoids the default Inter look.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

// Mono for real astronomy values (coordinates, degrees), which grounds the product.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const TITLE = "OneSky · Many traditions, one sky";
const DESCRIPTION =
  "See your birth moment through every tradition, and where they agree. Compute a full birth chart across Western, Vedic, Chinese, numerology and more, then read where independent systems converge.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · OneSky" },
  description: DESCRIPTION,
  applicationName: "OneSky",
  appleWebApp: { capable: true, title: "OneSky", statusBarStyle: "black-translucent" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "OneSky",
    type: "website",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#161229",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-star/30 focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
        >
          Skip to content
        </a>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
