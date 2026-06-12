import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://corebuildnl.com"),
  title: {
    default: "CoreBuild — Optimaliseer je build, verfijn je budget",
    template: "%s | CoreBuild",
  },
  description:
    "Vergelijk real-time prijzen van de grootste tech-retailers en stel je PC samen met slimme wattage-checks.",
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
    title: "CoreBuild — Optimaliseer je build, verfijn je budget",
    description:
      "Vergelijk real-time prijzen van de grootste tech-retailers en stel je PC samen met slimme wattage-checks.",
    images: [
      {
        url: "/images/feature-pc.png",
        width: 960,
        height: 640,
        alt: "CoreBuild — PC componenten prijsvergelijker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoreBuild — Optimaliseer je build, verfijn je budget",
    description:
      "Vergelijk real-time prijzen van de grootste tech-retailers en bouw de ultieme setup.",
    images: ["/images/feature-pc.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${hanken.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Direct naar inhoud
        </a>
        <Navbar />
        <div id="main-content" className="contents">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
