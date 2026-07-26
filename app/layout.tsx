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

export const metadata: Metadata = {
  title: "Outfit Me",
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
