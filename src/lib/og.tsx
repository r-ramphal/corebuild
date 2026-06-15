import { ImageResponse } from "next/og";

/**
 * Gedeelde Open Graph / Twitter-kaart in de giastpc-huisstijl
 * (wit canvas, oranje #FF8800, scherpe hoeken, technisch label).
 * Dependency-vrij: gegenereerd via next/og (satori), geen design-assets nodig.
 * Gebruikt door zowel opengraph-image als twitter-image op app-niveau, dus
 * site-breed tenzij een route een eigen kaart zet.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "CoreBuild — PC-onderdelen prijsvergelijker";

const ORANGE = "#FF8800";
const INK = "#141414";

const CHIPS = ["CPU", "GPU", "MOEDERBORD", "RAM", "OPSLAG", "VOEDING", "BEHUIZING", "KOELING"];

export function ogImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FAF8F2",
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        {/* Oranje kopbalk */}
        <div style={{ display: "flex", height: 18, background: ORANGE }} />

        {/* Inhoud */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              color: "#6B6B6B",
              marginBottom: 20,
            }}
          >
            PRIJSVERGELIJKER · NEDERLAND
          </div>

          <div style={{ display: "flex", fontSize: 132, fontWeight: 800, lineHeight: 1 }}>
            <span style={{ color: INK }}>Core</span>
            <span style={{ color: ORANGE }}>Build</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#333333",
              marginTop: 28,
              maxWidth: 940,
              lineHeight: 1.3,
            }}
          >
            Stel je pc samen, check de compatibiliteit en vergelijk live de prijzen van de
            grootste Nederlandse retailers.
          </div>

          {/* Component-chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  border: `2px solid ${INK}`,
                  padding: "8px 16px",
                  fontSize: 22,
                  letterSpacing: 2,
                  color: INK,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Oranje voetbalk met domein */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 64,
            background: ORANGE,
            color: "#1A1208",
            padding: "0 72px",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          corebuildnl.com
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
