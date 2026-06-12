# CoreBuild — Project Handoff

> Lees dit bestand aan het begin van elke sessie. Werk het bij aan het einde.

## Overzicht

Dutch-market PC-parts builder (helemaal opnieuw gebouwd, schone start t.o.v. CompuNL).
Gebruikers browsen componenten + prijzen, bouwen een PC, slaan builds op en delen ze.

- **Repo:** https://github.com/r-ramphal/corebuild (branch `master`)
- **Live:** https://corebuildnl.com (Vercel, auto-deploy van `master`; oude URL corebuild-ashy.vercel.app redirect)
- **Database:** Neon Postgres (eu-central-1) via Vercel — listings, auth-tabellen en builds

---

## Stack

| Laag | Technologie |
|---|---|
| Framework | Next.js 16.2.9 + React 19 |
| Styling | Tailwind v4 + shadcn/ui (Radix Nova preset) |
| Database | **Postgres (Neon) + Drizzle ORM** |
| Auth | better-auth 1.6.14 op dezelfde Postgres (Drizzle-adapter) |
| State | Zustand + SWR |
| Forms | react-hook-form + zod |
| CI | GitHub Actions (Node 22) |

**Shadcn gebruikt Radix** (niet Base/@base-ui) — `Button` heeft dus wél `asChild`.

---

## Wat er gebouwd is

### Foundation
- Next.js 16 + Tailwind v4 + shadcn/ui (Radix, Nova preset)
- Neon Postgres + Drizzle (listings, auth, builds) — Convex is volledig verwijderd
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

### Productdetailpagina (`/product/[slug]`)
- Geen database → de productnaam ís de identifier: slug in het pad, exacte naam als `?q=`, categorie als `?cat=` (bepaalt build-slot, breadcrumb en wattage-schatting)
- `src/lib/product-url.ts` — `slugify()` + `productUrl(item, category?)`
- `ProductClient` zoekt live via `/api/search` en filtert op relevantie (≥60% van de naam-tokens); geen match → toont meest vergelijkbare resultaten met melding
- Hero: afbeelding, laagste prijs (display-lg), "Bekijk bij [retailer]", "Toevoegen aan Build" (direct slot bij `cat`, anders slot-picker)
- Prijsvergelijkingstabel: alle aanbiedingen gesorteerd op prijs, beste prijs gemarkeerd (emerald), voorraad-dot per rij
- Bereikbaar via "Vergelijken" (categoriepagina) en de producttitel (zoekresultaten)

### Database-laag (Postgres + Drizzle) — gebouwd, getest met lokale Docker-Postgres
- **Schema** (`src/lib/db/schema.ts`): tabel `listings` — één rij per aanbieding per zoekterm
  (query genormaliseerd, retailer, naam, `price_cents`, url, afbeelding, voorraad, `mock`, `source`, `scraped_at`)
- **Client** (`src/lib/db/index.ts`): `getDb()` is lazy en geeft `null` zonder `DATABASE_URL` —
  de app werkt dan puur live (huidige productie-gedrag)
- **Repository** (`src/lib/db/listings.ts`): `getFreshListings` (TTL 30 min) + `saveListings`
  (vervangt per query+retailer in een transactie)
- **Zoekflow** (`/api/search`): 1) verse DB-rijen met échte data → direct serveren,
  2) anders live scrapen + write-through naar DB. Response-header `x-corebuild-source: database|live`
- **Seed** (`npm run db:seed`): mock-catalogus → DB voor alle categorie-zoektermen + populaire tags;
  pure mock-rijen blokkeren live scrapen nooit
- Migraties in `drizzle/`; scripts: `db:generate`, `db:push`, `db:studio`, `db:seed`

#### Productie-setup — ✅ GEDAAN (juni 2026)
- Neon-database gekoppeld via Vercel (regio eu-central-1)
- Let op: de integratie injecteert env vars met **`STORAGE_`-prefix**
  (`STORAGE_DATABASE_URL` etc.) — `getDb()` accepteert alle gangbare namen
- Schema gepusht + 192 demo-rijen geseed; pooled `DATABASE_URL` staat in lokale `.env.local`
- Geverifieerd in productie: 1e query `x-corebuild-source: live`, 2e query `database`
- Debug-headers op `/api/search`: `x-corebuild-db: on|off`, `x-corebuild-source: database|live`

#### Lokaal ontwikkelen
- Docker-container `corebuild-pg` bestaat al: `docker start corebuild-pg`
- `.env.local`: `DATABASE_URL=postgres://postgres:test@localhost:54329/corebuild`

#### Python-scrapers (volgende stap van het plan)
- Verbind met dezelfde `DATABASE_URL` (psycopg/SQLAlchemy)
- Schrijf in `listings`: query lowercase + enkele spaties, prijs in centen,
  vervang per (query, retailer), `source = 'python'`
- De site serveert nieuwe rijen direct (TTL 30 min per query)

### Python-scrapers (`scrapers/`) — gebouwd & getest tegen Neon
- 5 retailer-modules (zelfde selectors als de TS-scrapers), `refresh.py` CLI, zie `scrapers/README.md`
- **curl_cffi met Chrome-impersonatie** — de standaard requests-library wordt door
  Amazon geblokkeerd op TLS-fingerprint (503)
- Vanaf residentieel IP (thuis) werken **alle 5** retailers, inclusief Bol en Amazon —
  zo komt er échte Bol/Amazon-data in de database terwijl Vercel ze niet kan scrapen
- GitHub Actions (`.github/workflows/scrape.yml`): elke 6 uur megekko/azerty/alternate;
  repo-secret `DATABASE_URL` is gezet — eerste run geslaagd (963 rijen, juni 2026)
- Lokaal: `cd scrapers && .\.venv\Scripts\python refresh.py --all`

### Nog te bouwen
- [ ] **Prijshistorie** — aparte tabel of `listings` niet meer verwijderen maar versieneren
- [ ] **Wachtwoord vergeten** — better-auth reset-flow vereist een e-mailprovider (bijv. Resend)

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

## Auth-architectuur (better-auth op Neon Postgres — Convex volledig verwijderd)

- **Server**: `src/lib/auth.ts` — `betterAuth` met `drizzleAdapter` op dezelfde Neon-database;
  e-mail + wachtwoord (min. 8 tekens), trustedOrigins voor www/apex/localhost
- **Tabellen**: `src/lib/db/auth-schema.ts` (user/session/account/verification, standaard better-auth)
- **API-route**: `src/app/api/auth/[...all]/route.ts` via `toNextJsHandler` — zelfde origin, geen CORS-gedoe
- **Client**: `src/lib/auth-client.ts` — `createAuthClient()` zonder plugins; exports `signIn/signUp/signOut/useSession`
- **Secret**: `BETTER_AUTH_SECRET` staat in `.env.local` én in Vercel (production/preview/development)

### Opgeslagen builds
- Tabel `builds`: `publicId` (deelbaar, base64url), `userId` (cascade), `name`, `components` (jsonb-snapshot
  van het Zustand-formaat), timestamps
- API: `GET/POST /api/builds` (eigen lijst / opslaan), `GET /api/builds/[publicId]` (publiek, zonder userId),
  `DELETE /api/builds/[publicId]` (alleen eigenaar)
- UI: `/inloggen` (login+registreren), navbar met sessie-dropdown (Mijn builds / Uitloggen),
  "Bewaar build" in de builder (naam-invoer), `/builds` (laden/delen/verwijderen), `/build/[publicId]` (share-pagina)
- Buildstore heeft `loadComponents()` om een opgeslagen build in de builder te laden
- E2E getest: registreren → opslaan → lijst → publieke lookup (zonder cookie, zonder userId-lek) → verwijderen → 404

---

## Bekende gotchas

- **Geen ongelayerde CSS in `globals.css`** — regels buiten `@layer` winnen van álle Tailwind-utilities (een `* { margin: 0; padding: 0 }` reset sloeg ooit alle `px-*`/`mx-auto`/linkkleuren plat). Custom base-styles altijd in `@layer base` zetten.
- `kysely` gepinned op `0.28.17` via `overrides` in `package.json` (better-auth gebruikt kysely intern)
- `lucide-react` v1 — nieuwe icoon-namen: `TriangleAlert` / `CircleAlert` / `CircleCheck`
- **Dubbele env-var namen in `.env.local`** — dotenv pakt de éérste, een lege regel erboven wint dus van een gevulde eronder
- Vercel CLI is ingelogd (`r-ramphal`); project gelinkt — `npx vercel env ls` werkt

---

## Deployment

| Omgeving | URL | Platform |
|---|---|---|
| Productie | https://corebuildnl.com | Vercel (auto-deploy `master`) |
| Database | Neon Postgres eu-central-1 | via Vercel Storage (`STORAGE_`-prefix env vars) |

**Env vars** (Vercel): `STORAGE_DATABASE_URL` (Neon-integratie, automatisch), `BETTER_AUTH_SECRET` (gezet).
Na Amazon Associates-goedkeuring: `AMAZON_ASSOCIATE_TAG` toevoegen.
