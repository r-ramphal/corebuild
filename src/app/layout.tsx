import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Montserrat, Pixelify_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./globals.css";

// Huisstijl (giastpc-pivot): Montserrat (zware koppen) + IBM Plex Mono
// (technische/terminal-tekst & labels) + Pixelify (oranje pixel-koppen).
// De oude Hanken + Inter zijn verwijderd: na de redesign mappen alle tokens
// naar Montserrat/Plex-Mono, dus die twee fonts werden nergens meer gebruikt.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

// Pixel-font voor de oranje sectie-/kaartkoppen (retro-technische accent).
const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Mobiel-first: expliciete viewport. viewportFit "cover" activeert de
// env(safe-area-inset-*)-utilities (notch/home-indicator). Bewust GEEN
// maximumScale/userScalable:false — pinch-zoom moet werken (toegankelijkheid).
// themeColor = wit canvas, kleurt de browser-UI mee op mobiel.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://corebuildnl.com"),
  title: {
    default: "CoreBuild: optimaliseer je build, verfijn je budget",
    template: "%s | CoreBuild",
  },
  description:
    "Stel je pc samen met een automatische compatibiliteitscheck en een visuele build, en vergelijk live de prijzen van de grootste Nederlandse retailers per onderdeel.",
  keywords: [
    "pc onderdelen vergelijken",
    "pc bouwen",
    "pc builder",
    "componenten prijsvergelijker",
    "videokaart prijzen",
    "processor prijzen",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://corebuildnl.com",
    siteName: "CoreBuild",
    title: "CoreBuild: optimaliseer je build, verfijn je budget",
    description:
      "Stel je pc samen met een automatische compatibiliteitscheck en een visuele build, en vergelijk live de prijzen van de grootste Nederlandse retailers per onderdeel.",
    // og:image komt uit src/app/opengraph-image.tsx (giastpc-huisstijl, gegenereerd)
  },
  twitter: {
    card: "summary_large_image",
    title: "CoreBuild: optimaliseer je build, verfijn je budget",
    description:
      "Vergelijk real-time prijzen van de grootste tech-retailers en bouw de ultieme setup.",
    // twitter:image komt uit src/app/twitter-image.tsx
  },
  robots: {
    index: true,
    follow: true,
  },
  // Domeineigendom voor Google Search Console. Rendert
  // <meta name="google-site-verification" content="…" /> in de <head> —
  // de HTML-tag-methode (werkt voor een URL-prefix-property), naast/los van
  // de DNS-TXT-methode bij de domeinprovider.
  verification: {
    google: "PIVZzSPpYqXnbt2uKUlZ6mcTl_NzZV1sn1johf_bP80",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${plexMono.variable} ${montserrat.variable} ${pixelify.variable}`}
    >
      <body>
        <SmoothScroll />
        <a href="#main-content" className="skip-link">
          Direct naar inhoud
        </a>
        <Navbar />
        <div id="main-content" className="contents">
          {children}
        </div>
        <Footer />
        {/* Mobiel-exclusieve onderbalk (app-stijl). Verschijnt alleen <1024px;
            de body reserveert er onderaan ruimte voor (zie globals.css). */}
        <BottomTabBar />
        {/* Cookieloze, GDPR-vriendelijke bezoekersstatistieken (Vercel Web
            Analytics). Stuurt alleen data wanneer Analytics in het Vercel-
            dashboard aanstaat; geen consent-banner nodig. */}
        <Analytics />
        {/* Core Web Vitals-meting (Vercel Speed Insights). Stuurt alleen data
            wanneer Speed Insights in het Vercel-dashboard aanstaat. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
