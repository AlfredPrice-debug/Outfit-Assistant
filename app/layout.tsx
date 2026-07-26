import type { Metadata, Viewport } from "next";
import { Grandstander, Nunito, Outfit as OutfitUtilityFont } from "next/font/google";
import "./globals.css";

// Loaded via next/font/google (no CDN <link> tags) so the fonts are
// self-hosted and never cause a layout-shifting network fetch at runtime.
const grandstander = Grandstander({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-display",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
});
const outfitUtility = OutfitUtilityFont({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-utility",
});

// Needed so the OG image (app/opengraph-image.png) resolves to an absolute
// URL for link previews (iMessage, Slack, etc). Railway injects
// RAILWAY_PUBLIC_DOMAIN automatically for any service with a public domain,
// so no manual configuration is required in production.
const siteUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OutFit Me",
  description: "Concrete outfit ideas for any occasion, grounded in real fashion inspiration.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grandstander.variable} ${nunito.variable} ${outfitUtility.variable}`}>
      <body className="min-h-dvh bg-porcelain font-body text-body text-espresso antialiased">{children}</body>
    </html>
  );
}
