# CoreBuild — Project Handoff

> Lees dit bestand aan het begin van elke sessie. Werk het bij aan het einde.

## Overzicht

Dutch-market PC-parts builder (helemaal opnieuw gebouwd, schone start t.o.v. CompuNL).
Gebruikers browsen componenten + prijzen, bouwen een PC, slaan builds op en delen ze.

- **Repo:** https://github.com/r-ramphal/corebuild (branch `master`)
- **Live:** https://corebuildnl.com (Vercel, auto-deploy van `master`; oude URL corebuild-ashy.vercel.app redirect)
- **Convex deployment:** nog niet aangemaakt (optioneel — app werkt zonder)

---

## Stack

| Laag | Technologie |
|---|---|
| Framework | Next.js 16.2.9 + React 19 |
| Styling | Tailwind v4 + shadcn/ui (Radix Nova preset) |
| Database | Convex |
| Auth | better-auth 1.6.14 via `@convex-dev/better-auth@0.12.2` |
| State | Zustand + SWR |
| Forms | react-hook-form + zod |
| CI | GitHub Actions (Node 22) |

**Shadcn gebruikt Radix** (niet Base/@base-ui) — `Button` heeft dus wél `asChild`.

---

## Wat er gebouwd is

### Foundation
- Next.js 16 + Tailwind v4 + shadcn/ui (Radix, Nova preset)
- Convex schema klaar maar **niet actief** — app draait zonder database
- better-auth setup klaar voor later
- GitHub Actions CI + Vercel deployment
- **Geen dark mode** (verwijderd per design beslissing)

### Design system (Stitch)
- Fonts: Hanken Grotesk (headlines) + Inter (body) + JetBrains Mono (labels) via next/font/google
- Kleuren: volledig CoreBuild kleurensysteem in `globals.css` (primair #0049db, surface #faf8ff)
- Alle tokens als CSS vars (`--cb-*`) + Tailwind utilities via `@theme inline`
- Retailer-kleuren: amazon #FF9900, bol #0000FF, megekko #00A651, azerty #E30613, alternate #00305F

### Prijsvergelijking (live, getest juni 2026)
- `/api/search?q=` — parallel fanout naar alle 5 bronnen, sorteert op prijs asc
- **Megekko** — POST naar `/pages/zoeken/v5/v5.php` (XHR-endpoint, JSON met `html`-veld); selectors `.prdContainer` / `.prdTitle` / `.prsEuro`. Eerste query per zoekterm kan 5-15s duren (server-side cache), timeout 15s
- **Azerty** — `https://azerty.nl/catalogsearch/result/?q=` (zónder www!); container `form[id^="product_addtocart_form"]`, prijs uit `data-price-amount`-attribuut
- **Alternate** — `/listing.xhtml?q=&s=price_asc`; cards zijn `a.productBox`, prijs `span.price`, voorraad `.delivery-info`
- **Amazon** — best-effort; URL via `data-asin` → `/dp/<asin>`, voegt `?tag=` toe als `AMAZON_ASSOCIATE_TAG` gezet is. Wordt vanaf Vercel (datacenter-IP) waarschijnlijk geblokkeerd → **mock-fallback**
- **Bol** — best-effort; cards `div[role="button"]`, prijs uit screen-reader-span ("De prijs van dit product is..."). Sterke bot-detectie → **mock-fallback**
- **Mock-fallback** (`src/lib/mock/catalog.ts`) — ~38 realistische producten over alle 8 categorieën; deterministische prijsvariatie per retailer; resultaten dragen `mock: true` en tonen "· demo" in de retailerbadge
- `scripts/test-scrapers.ts` — `npx tsx scripts/test-scrapers.ts "zoekterm"` test alle scrapers tegen de echte sites

### UI (Stitch design geïmplementeerd)
- Homepage (`/`) — hero met gradient bg + zoekbalk, 8 categorie-cards, features-sectie
- Zoeken (`/zoeken?q=`) — filter sidebar (retailers/prijs/voorraad), resultatenlijst met "Beste prijs" badge
- Navbar — fixed, "CoreBuild" tekst, nav-links met active-state, "Inloggen" knop
- Footer — 3-kolom layout
- `PriceList` — retailer badges, product image, prijs, externe link knop

### Gebouwd (sessie 2–3)

#### Builder + Staat
- `src/lib/store/build.ts` — Zustand build store, localStorage persist (`corebuild-build`), 8 component slots
- `src/lib/categories.ts` — `COMPONENT_META` (label, searchTerm, popularTags, wattage per slot)
- `src/lib/types.ts` — `ComponentType` union + `PriceResult` / `SearchResults` interfaces

#### Pagina's
- `/builder` — 12-col grid, gevulde/lege slots, build-overzicht sidebar met 48px prijs, power-bar, wis-knop
- `/categorie/[type]` — categorie-header met icon, populaire tags, filter sidebar, `CategoryResultCard`
- `/zoeken` — filter sidebar (retailers/prijs/voorraad/toggle), segmented sort-control, `PriceList`

#### Components
- `PriceList` — 192px productafbeelding, "Beste prijs" badge, slot-picker dropdown (click-outside), "Aan build" / checkmark
- `ZoekenClient` — fanout via `/api/search`, filterstate, slot-doorgave aan PriceList
- Navbar, Footer, HeroSearch — volledig Stitch-typografie

#### Design (Stitch "Technical Precision") — 1:1 met de export
- Bron: `C:\Users\Lenovo\Downloads\stitch_corebuild_pc_vergelijker\` (4 schermen HTML + PNG + DESIGN.md)
- `globals.css` — alle `--cb-*` tokens, `@theme inline` Tailwind-mappings, `@layer utilities` Stitch-typografyklassen
- **Border-radius Stitch-schaal**: `rounded`=2px, `rounded-lg`=4px, `rounded-xl`=8px, `rounded-full`=12px (overrides in `@layer utilities`)
- `.custom-slider` CSS voor prijs-sliders (4px track, 16px primary thumb)
- Statische afbeeldingen uit Stitch gedownload naar `public/images/` (feature-pc.png, promo-gpu.png)
- Fonts: Hanken Grotesk / Inter / JetBrains Mono via `next/font/google`
- Geen dark mode
- Korte categorienamen (CPU, GPU, PSU…) als `shortLabel` in `COMPONENT_META`; ook `pageTitle`, `description`, `emptyText` per categorie

### Nog te bouwen
- [ ] **Productdetailpagina** (`/product/[id]`) — afbeelding, specs, alle retailerprijzen voor 1 product
- [ ] **Auth + opgeslagen builds** — Convex provisioning (`npx convex dev`), better-auth, opslaan/laden/delen builds

---

## Roadmap: data-architectuur (afgesproken juni 2026)

**Database-first aanpak**: scrapers en API-data komen samen in een centrale database
(PostgreSQL of MongoDB), niet rechtstreeks naar de Next.js frontend.

1. **Bouwfase (nu)** ✅ deels
   - Next.js site + scrapers voor Megekko/Azerty/Alternate (werken live)
   - Bol + Amazon: demo-data via mock-fallback (zichtbaar als "· demo")
   - Python-scrapers + database volgen zodra DB-keuze gemaakt is
2. **Inschrijven & livegang**
   - Vlak vóór serieuze livegang: KvK-inschrijving
3. **API's aansluiten (na KvK)**
   - Bol Marketing Catalog API aanvragen (KvK-nummer vereist — daarom is de
     "API toegang"-knop in het partnerdashboard nu niet zichtbaar)
   - Awin-aanmelding voor Coolblue (nieuwe retailer toevoegen aan `Retailer`-type)
   - Amazon: handmatige affiliate-links tot 3 verkopen → dan PA-API
   - Mock-data vervangen door API-data in de database

---

## Auth-architectuur (zelfde als CompuNL)

- Auth-instance: `convex/auth.ts` (`createAuth` met `betterAuth` from `better-auth/minimal`)
- HTTP-routes: `convex/http.ts` via `registerRoutes` — **geen** Next.js API-route
- Client: `src/lib/auth-client.ts` (convexClient + crossDomainClient plugins)
- Provider: `src/app/ConvexClientProvider.tsx` (`ConvexBetterAuthProvider`)
- Cross-domain fixes vereist (app op Vercel, auth op `.convex.site`):
  1. **CORS:** `registerRoutes(..., { cors: { allowedOrigins: trustedOrigins } })`
  2. **Cross-domain sessie:** `crossDomain({ siteUrl })` + `crossDomainClient()` (localStorage)
- Na deployment: voeg Vercel-URL toe aan `trustedOrigins` in `convex/auth.ts`

---

## Bekende gotchas

- **Geen ongelayerde CSS in `globals.css`** — regels buiten `@layer` winnen van álle Tailwind-utilities (een `* { margin: 0; padding: 0 }` reset sloeg ooit alle `px-*`/`mx-auto`/linkkleuren plat). Custom base-styles altijd in `@layer base` zetten.
- `kysely` gepinned op `0.28.17` via `overrides` in `package.json` (niet als directe dep)
- `lucide-react` v1 — nieuwe icoon-namen: `TriangleAlert` / `CircleAlert` / `CircleCheck`
- tsconfig path alias `@convex/*` → `./convex/*` voor `@convex/_generated/api` imports
- `npx convex login` hangt non-interactief — gebruik `npx convex login --device-name <naam>`
- Dev deploy key kan Convex env vars niet lezen/schrijven (403) — stel in via dashboard
- TypeScript-errors op `_generated/*` zijn normaal tot `npx convex dev` gerund is

---

## Volgende stap: Convex provisioning

```bash
# In de projectmap:
npx convex dev
# Kies: nieuw project aanmaken, naam "corebuild"
# Kopieer de gegenereerde URLs naar .env.local:
#   NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
#   NEXT_PUBLIC_CONVEX_SITE_URL=https://...convex.site
# Stel BETTER_AUTH_SECRET in via het Convex dashboard (Environment Variables)
```

---

## Deployment

| Omgeving | URL | Platform |
|---|---|---|
| Productie | https://corebuildnl.com | Vercel (auto-deploy `master`) |
| Convex dev | nog niet aangemaakt | — |

**Vercel env vars instellen** (na Amazon Associates goedkeuring):
1. Ga naar https://vercel.com/r-ramphals-projects/corebuild/settings/environment-variables
2. Voeg toe voor **Production**:
   - `AMAZON_ACCESS_KEY`
   - `AMAZON_SECRET_KEY`
   - `AMAZON_ASSOCIATE_TAG`
