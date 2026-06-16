# CoreBuild — Project Handoff

> Lees dit bestand aan het begin van elke sessie. Werk het bij aan het einde.

## ▶ Nieuw (16 juni 2026, deel 23) — redesign-restpunten: categorie-hero-foto's + voorbeeldbuilds-pagina + blog-bento

De drie codeerbare open punten uit de redesign afgerond. **Fase 3 (officiële API's) bewust NIET** —
voldoet nog niet aan de eisen (KvK). Data/logica (scrapers, Neon, `/api/*`, auth, prijshistorie, alerts)
volledig ongemoeid; puur frontend/visueel. Geverifieerd: `tsc --noEmit` + `eslint src` + `npm run test`
+ `next build` (**57 pagina's**) allemaal groen.
- **Per-categorie hero-foto** op `/categorie/[type]`: nieuwe `src/lib/category-images.ts`
  (`CATEGORY_IMAGES`, gecentraliseerd) — `home/GiastCategories.tsx` hergebruikt deze map nu (lokale
  `CAT_IMG` verwijderd). De categorie-header in `components/CategorieClient.tsx` is nu een giastpc-banner
  (`border-gp-line` + `bg-gp-bg-soft`) met de foto in een rechterkolom (320px, `grayscale-[0.35]`,
  blueprint-oranje hoekaccenten), `hidden md:block` zodat mobiel compact blijft. **Alleen de 8
  kerncategorieën** hebben een foto; randapparatuur/accessoires vallen netjes terug op de icon-only
  header (grid wordt dan 1-koloms via de conditionele `md:grid-cols-[...]`).
- **Voorbeeldbuilds-pagina** (curated, statisch — bewuste keuze i.p.v. live catalogus, op gebruikersverzoek):
  `src/lib/example-builds.ts` (6 builds: Budget gamer ~€800, Esports ~€1100, 1440p gamer ~€1500,
  Streamer ~€1800, Creator ~€2000, 4K powerhouse ~€2500; elk 8 kernonderdelen). Nieuwe route
  `src/app/voorbeeldbuilds/page.tsx` (server, statisch geprerendered): kaarten met oranje pixel-kopbalk,
  onderdelenlijst (elk onderdeel linkt naar `/zoeken?q=`), richtprijs + "Stel samen"-CTA, en een
  smart-generate-CTA onderaan. Toegevoegd aan navbar + footer + sitemap; `home/GiastShowcase.tsx` kreeg
  een "Meer voorbeeldbuilds"-link. **Geen API/DB**; richtprijzen indicatief, onderdeelnamen sluiten aan op
  `cpu-data`/`gpu-data` + de FEATURED-build. Bijwerken = een rij in `example-builds.ts` aanpassen.
- **Blog-bento** op `/blog`: platte lijst → giastpc-bento-grid (`src/app/blog/page.tsx`). Eerste post
  uitgelicht (`md:col-span-2 md:row-span-2`, oranje "Uitgelicht"-badge + pixelnummer `01`), overige posts
  als genummerde kaarten in de rechterkolom; oranje hover-rand, datum + leesduur. Metadata ongewijzigd.
- **Conventies bewaard**: em-dashes uit body-copy (deel 3); gp-tokens/utilities; geen ongelayerde CSS.
- **Runtime-verificatie**: `/voorbeeldbuilds` + `/blog` als statische pagina geprerendered, alle 22
  `/categorie/[type]` als SSG geprerendered → het render-pad (incl. de gewijzigde header) draait
  server-side zonder fouten. (Lokale dev-smoketest via `next dev` is hier niet gebruikt: PowerShell-
  achtergrondjobs overleven niet tussen tool-calls; de build-prerender dekt het render-pad al af.)
- **Nog open** (ongewijzigd, vereist account/inbox/toestel/dashboard, kan niet autonoom): reset-mail +
  prijsalert-cron-mail + mobiele weergave handmatig verifiëren; sitemap indienen in Search Console +
  Rich Results-test. Fase 3 (Bol/Awin/Amazon-API's) wacht op KvK.

## ▶ Nieuw (15 juni 2026, deel 22) — echte 3D met three.js (maatvast op specs), 2.5D eruit

De gebruiker koos: **2.5D weg**, **libraries mogen**, en **maatvast op échte specs met prioriteit op
een realistische, herkenbare vorm**. Daarmee is de oude dependency-vrije CSS-3D + de 2.5D-toggle
vervangen door een echte **three.js / react-three-fiber**-scène. Geverifieerd: `tsc` + `eslint src` +
`npm run test` + `next build` (56 pagina's) groen; runtime via **headless Chrome (swiftshader-WebGL)**
gecheckt (canvas mount + gevulde build gescreenshot — case, koelertoren+fan, moederbord+PCIe-accent,
videokaart met fans+RGB, voeding, allemaal zichtbaar).
- **Libraries** (nieuw in `package.json`): `three@^0.184`, `@react-three/fiber@^9.6` (vereist
  React ≥19 <19.3 — wij draaien 19.2.4 ✓), `@react-three/drei@^10.7`, dev `@types/three`.
- **`src/lib/specs/build-model.ts`** (PUUR + getest): zet `components` + `CompatData` om in een
  **maatvast** model in mm. Harde maten: **GPU-lengte** (open-db `compat.gpu.med`), **koelerhoogte /
  AIO-radiator** (`compat.cooler`), **behuizing-binnenmaten** afgeleid van de echte clearances
  (`maxCooler`→breedte, `maxGpu`→diepte, `maxPsu`→PSU-diepte). Standaard-specs: moederbord per
  form-factor (ATX/mATX/ITX/E-ATX), DIMM, ATX-PSU. `sources`-veld markeert welke maten "real" vs
  "estimate" zijn → de UI toont onderaan "Op schaal: GPU-lengte, koelerhoogte, behuizing uit de database".
- **`src/components/builder/BuildScene.tsx`** (`"use client"`, default export): de R3F-`<Canvas>` +
  scène. Herkenbare solids: open behuizing (stalen tray/achter/bodem/top + slank voorframe + getint
  glas-zijpaneel), moederbord-PCB met VRM/chipset-heatsinks + oranje PCIe-accent + I/O-shield, CPU,
  koeler (luchttoren mét fan **of** AIO = pompblok + radiator + fans, top/front-mount), RAM-reepjes met
  RGB-diffuser, videokaart (shroud + backplate + 2–3 fans op de kijkkant + RGB-streep), 2.5"-SSD,
  voeding met fan. Ventilatoren draaien via `useFrame` (uit bij reduced-motion). **OrbitControls**
  (drei) voor sleep-draaien + idle auto-rotate; **ContactShadows** als grondschaduw. Klik een onderdeel
  in de scène → `onSelectSlot` (sleep-drempel van 7px zodat draaien geen klik triggert); hover ↔ legenda
  synchroniseren via `hot`-state.
- **`src/components/builder/BuildPreview.tsx`** (herschreven, zelfde export/props): **geen 2.5D↔3D-toggle
  meer**. Lui-laadt `BuildScene` via `next/dynamic({ ssr:false })` met skeleton → three.js zit **niet** in
  de initiële builder-bundle (apart chunk, on-demand). Houdt `useCompat(components)` (deelt SWR-cache met
  BuildSummary → geen dubbele fetch), de klikbare legenda (nu alle 8 slots incl. behuizing), reset-knop,
  en `prefers-reduced-motion` via `useSyncExternalStore` (hydration-veilig).
- **Verwijderd**: `BuildPreview2D.tsx` + de oude CSS-3D `BuildPreview3D.tsx` (+ de localStorage-
  view-voorkeur). `BuilderClient` importeert nog steeds `BuildPreview` (ongewijzigde call).
- **Test**: `scripts/test-build-model.ts` (19 cases: échte mm worden gevolgd, onderdelen vallen binnen de
  kast, AIO/lege-build edge-cases) toegevoegd aan `npm run test`.
- **Bewust nog open / optioneel**: kabels, AIO-buizen, meer board-detail; per-onderdeel labels on hover in
  3D; de zwaardere chunk verder afslanken (drei selectief geïmporteerd: alleen OrbitControls/ContactShadows).
  Data/logica (scrapers/Neon/`/api/*`/auth) bleef ongemoeid.
- **Vervolg (zelfde sessie) — minder overlap + camera**: layout in `build-model.ts` ruimer gezet zodat
  onderdelen elkaar niet meer overlappen: RAM korter (92mm) en duidelijk vóór de koelertoren, GPU lager
  geplaatst (ruime tussenruimte met de koeler) met kleinere, beter gespreide fans, opslag-SSD naar de
  achterzijde verplaatst (uit de drukke voorzone), koeler-footprint iets kleiner; camera iets verder weg
  (`[6.6,2.1,5.0]`, fov 31) voor lucht. `test-build-model.ts` bevestigt dat alles binnen de kast valt.
- **Homepage build-log (`GiastTerminal`) terug naar oud ontwerp**: body van `justify-end` → `justify-start`
  (regels lopen weer van **boven naar beneden**). Tekst/hoogte zo afgestemd (`text-[9px] sm:text-[11px]`
  `leading-[1.4]`, `h-[360px] sm:h-[430px]`) dat **alle 24 regels + caret volledig binnen het grijze
  paneel passen** (geen afknipping meer — de deel-20-reden voor justify-end is daarmee opgelost).

## ▶ UI-REDESIGN — giastpc-stijl is LIVE op productie (functionaliteit ongewijzigd)

De **giastpc-redesign** (licht/oranje/mono brutalist) is op **14-06 gemerged naar `master`** en draait
nu **live op corebuildnl.com** — bewust uitgerold zodat echte gebruikers het op mobiel kunnen testen.
De data/logica-laag is overal ongemoeid (scrapers, Neon+Drizzle, `/api/*`, auth, prijshistorie, alerts).

| Branch | Stijl | Status |
|---|---|---|
| `master` | **Licht/oranje/mono brutalist** (giastpc.it) | ✅ **LIVE op corebuildnl.com** |
| `redesign-stitch` | **Dark glassmorphism** (donker/blauw/glas) | alternatief, op branch (niet live) |
| `redesign-giastpc` | = nu in master gemerged | bronbranch |

**`redesign-giastpc` (deze branch) — stap 1·2·3 AF:**
- **Designsysteem**: wit canvas, oranje `#FF8800`, blueprint-rasterlijnen; **Montserrat** (koppen) +
  **IBM Plex Mono** (body/labels) + **Pixelify Sans** (oranje pixel-kopbalken); **scherpe hoeken** (radius 0).
  Aanpak = de bestaande Material-`--cb-*`-tokens + fonts + radius **globaal hermapt** in `globals.css`
  → alle ~25 pagina's flippen automatisch mee (zelfde truc als de dark-flip). Plus `gp-*`-tokens/utilities
  (`gp-grid`, `gp-highlight`, `gp-bar`, `font-pixel`, marquee, caret).
- **Stap 1 — motion**: GSAP + Lenis (`components/motion/SmoothScroll.tsx` + `Reveal.tsx`), smooth scroll +
  scroll-reveals, **reduced-motion-veilig**. Getypte **terminal build-log** (`home/GiastTerminal.tsx`).
- **Stap 2 — alle pagina's** omgezet via de remap (builder/categorie/product/zoeken/inloggen/blog… getest).
- **Stap 3 — echte product-foto's**: license-free hardware-fotografie (bron `Downloads/corebuildfoto`),
  met **sharp** → webp (22–183KB) in `public/images/cat/*` + `public/images/hero/*`. Categorie-bento met
  grayscale→kleur foto's, hero featured-build-foto, featured-build-band (oranje pixel-kop). De foto's
  zijn gemapt per categorie (cpu/gpu/motherboard/ram/storage/psu/case/cooling).
- **Homepage-componenten**: `home/GiastHero` (kinetisch roterend woord + `GiastBlueprint`-element),
  `GiastMarquee`, `GiastTerminal`, `GiastCategories` (foto-bento), `GiastShowcase`, `GiastManifest`.
- **Navbar** (laatste ronde): logo **gecentreerd** (`grid-cols-3`) + **hamburger-uitklapmenu** (genummerde
  links, alle schermen) — giastpc-stijl. Hero-foto vervangen door geanimeerd **`GiastBlueprint`** (8 slots
  rond core + radar-sweep). Footer mono+oranje.
- **Mobiele responsiveness**: grids hadden `lg:grid-cols-12` zónder mobiele kolom → auto-kolom-overflow;
  gefixt met `grid-cols-1` (hero/terminal/showcase) + `main,footer{min-width:0}` (body is flexkolom →
  groeit anders breder dan de viewport) + kleinere hero-kop. **Let op**: headless-Chrome rendert het
  layout-viewport bréder dan `--window-size` (quirk) → mobiele screenshots zijn onbetrouwbaar; echte
  mobiele check loopt via gebruikers op corebuildnl.com.
- Verificatie: `tsc` + `eslint(src)` + **`next build` (53 pagina's)** groen; desktop via headless geverifieerd.
- **Opgeruimd (14-06)**: oude ongebruikte home-componenten verwijderd — `home/Hero`, `HeroSearch`,
  `home/CompatCheck`, `home/RotatingShowcase`, `home/Snelkoppelingen` + de 9 `public/images/build/*.jpg`
  (alleen door RotatingShowcase gebruikt). `home/` bevat nu enkel de `Giast*`-componenten. `CategoryGrid`
  blijft (gebruikt door `/categorie`); `promo-gpu.png` + `feature-pc.png` (OG) blijven.
- **Nog open/optioneel**: ~~per-categorie hero-foto op de `/categorie/[type]`-headers; preassembled-
  productkaarten op een aparte pagina; blog-bento~~ → **alle drie afgerond in deel 23.** (OG-image is
  15-06 vervangen door een gegenereerde giastpc-kaart — zie deel 15.)
  **Bewaard**: routes/stores/`useSyncExternalStore`/a11y/de "geen ongelayerde CSS"-gotcha (utilities in `@layer`).
- **Gotcha (deze sessie)**: de lokale `.shots/`-screenshotmap (Chrome-profielen) wordt door Tailwind v4
  én `eslint .` mee-gescand → vreemde extensie-CSS/124 lint-errors. `.shots*` staat in `.gitignore`;
  verwijder de map vóór `eslint .` of lint gericht `eslint src`.

> **Scope blijft puur frontend/visueel** — data/logica (scrapers, Neon+Drizzle, `/api/*`, auth,
> prijshistorie, prijsalert-cron) niet aanraken.

## Status (13 juni 2026)

**Alles uit het oorspronkelijke plan is gebouwd en live:** Stitch-design (1:1),
5 scrapers (TS + Python), Neon-database met DB-first zoekflow, productdetailpagina,
auth (better-auth) + opgeslagen/deelbare builds. GitHub Actions ververst prijzen elke 6 uur.

**Nieuw (13 juni 2026) — alles live op corebuildnl.com (commits `524987e` + `c257402`):**
- **Categorie-relevantielaag** — geen Harry Potter-figuren meer bij CPU's; oorzaak was
  fuzzy retailer-search ("processor" → "Professor Sneep") + ongefilterde overname
- **Catalogusmodus** per categorie (`category`-kolom in listings; `db:push` ✅ uitgevoerd)
- **Titel-normalisatie** — machinevertaalde Bol-titels ("Wees Stil!" → be quiet!) opgeschoond
- **Database opgeschoond** (`clean-listings.ts` ✅ 2x uitgevoerd): 589 + 28 junk-rijen
  verwijderd, 1235 rijen gecategoriseerd, 205 titels genormaliseerd. Stand: ~1234 rijen,
  per categorie 108–211, 28 zonder categorie (vrije zoektermen)
- **Mobiel menu** + a11y-verbeteringen, `/over`-pagina (privacy/affiliate), werkende
  exporteer-knop, eerlijke homepage-copy
- **Security-hardening**: TLS-verificatie DB, inputvalidatie builds-API, rate limit
  op /api/search, better-auth rate limit aan
- Productie geverifieerd: `?cat=cpu` → 96+ échte CPU's (bron `catalog`), `?cat=gpu` idem

**Nieuw (14 juni 2026) — build-intelligentie + visuele upgrade:**
- **Performance-engine** (`src/lib/specs/`): herkent CPU/GPU-modellen uit productnamen
  en berekent FPS-schattingen, bottleneck-analyse, monitor-Hz-advies, build-score
  en compatibiliteitschecks (socket/DDR/PSU/formfactor). Transparant model,
  overal gelabeld als *indicatie*. Tests: `npx tsx scripts/test-performance.ts`
- **Interactief BuildIntelligence-paneel** in de builder (resolutie/preset-selector,
  geanimeerde FPS-bars per game-type, CPU↔GPU-balansmeter, score-gauge, power-bar,
  compatibiliteitschecklist) + spec-chips op gevulde slots
- **Spec-chips** (`ComponentSpecs`) op categorie-, zoek- en productpagina's (VRAM/cores
  + relatieve prestatie-index)
- **Visuele polish**: hero met mesh-gradient + waardeproposities, feature-sectie met
  zwevend voorbeeldkaartje, mooiere categoriegrid, CSS-animatie-utilities (fade-in-up,
  gauge, bars) met reduced-motion-respect
- Compatibiliteitscheck (socket/DDR/PSU) is hiermee grotendeels gebouwd

**Nieuw (14 juni 2026, deel 2) — huisstijl, omschrijvingen, USP, contact:**
- **Huisstijl naar 2 lettertypes**: JetBrains Mono verwijderd; `label-technical` + `mono`
  nu Inter. Hanken (koppen) + Inter (al het andere). Scheelt ook een font-download.
- **Favicon**: `src/app/icon.svg` (CPU-chip merk, primair blauw); default `favicon.ico`
  verwijderd. Next linkt `icon.svg` automatisch (route `/icon.svg`).
- **Productomschrijvingen**: `src/lib/specs/describe.ts` genereert per product een
  omschrijving + speclijst + "goed voor" + educatieve uitleg uit de gedetecteerde specs;
  getoond via `components/ProductDescription.tsx` op `/product/[slug]` (categorie uit URL
  of `inferCategory`).
- **USP — prijs-prestatie**: `src/lib/specs/value.ts` (prestatie per €100). Op CPU/GPU-
  categoriepagina's krijgt het item met de beste bang-for-buck een **"PRIJS-PRESTATIE"**-
  badge (los van "BESTE DEAL" = goedkoopste) + uitleg. In de builder een
  "~X fps per €100"-metric in BuildIntelligence.
- **Contact**: `/contact`-pagina met mailto `corebuildnl@proton.me` + footer-link;
  toegevoegd aan sitemap. Site-metadata/omschrijving bijgewerkt (FPS/prijs-prestatie).

**Nieuw (14 juni 2026, deel 3) — zoeken, logo's, productinfo, randapparatuur:**
- **Zoeksuggesties (typeahead)**: `components/SearchSuggest.tsx` + `lib/search-suggestions.ts`
  (index uit CPU/GPU-labels + categorieën + populaire tags). Toetsenbordnavigatie. Gebruikt in
  hero, navbar én als invoerveld op de lege `/zoeken`-staat (daar kon je eerst niets typen).
  ⌘/Ctrl-hint nu platform-correct via `useSyncExternalStore` (geen hydration-mismatch).
- **Retailer-logo's**: `components/RetailerLogo.tsx` (wordmark in merkkleur) in PriceList,
  productpagina-vergelijkingstabel en categoriekaarten. Geen echte merk-logobestanden
  (auteursrecht/betrouwbaarheid); wordmarks geven dezelfde officiële uitstraling.
- **Retailer-productinfo**: `/api/product-info` haalt og/meta-description van de
  retailer-productpagina (host-allowlist tegen SSRF!). `lib/use-product-info.ts` (SWR) +
  getoond in "Over dit product" via de goedkoopste scrapebare aanbieding
  (megekko/azerty/alternate; Bol/Amazon blokkeren datacenter-IP's). Fallback = gegenereerde tekst.
- **Categorie-catalogus uitgebreid** met randapparatuur: monitor, toetsenbord, muis, headset.
  `CATALOG_TYPES` (= `COMPONENT_TYPES` + `PERIPHERAL_TYPES`) en `peripheral`-flag in
  `COMPONENT_META`. Randapparatuur is wél browsbaar/vergelijkbaar maar is **geen build-slot**
  (geen "Toevoegen aan Build", wel "Bekijk"). relevance TS+PY + `queries.py` bijgewerkt;
  de `category`-kolom in de DB bestond al, dus scrapers vullen ze automatisch.
- **Copy**: em-dashes (—) uit alle zichtbare teksten gehaald, natuurlijker NL.

**Scrapers**: de nieuwe categorieën zijn gevuld (14-06): monitor 199, keyboard 149, mouse 142,
headset 129 rijen. `refresh.py` heeft nu een `--category`-flag, bv.
`python refresh.py --category monitor,keyboard,mouse,headset`. De 6-uurs GitHub Action pakt de
nieuwe zoektermen automatisch mee. Let op: randapparatuur-relevantieregels waren aangescherpt
na een paar lekken (monitorarm, USB-ontvangers); de catalogusmodus van `/api/search` past nu
óók `applyRelevance` toe als extra vangnet.

**Nieuw (14 juni 2026, deel 4) — BuildCores-pivot (fase 1):**
Doel: de Nederlandse BuildCores (nl.buildcores.com) worden, met behoud van het eigen
moderne design. Hun open-db (github.com/buildcores/buildcores-open-db, ODC-By, 29 categorieën,
rijke compat-specs) is de referentie voor componentdata.
- **Performance uit de builder** (op verzoek — het "vibe-coded" gevoel): `BuildIntelligence`,
  `performance.ts` en `test-performance.ts` zijn **verwijderd** (geen FPS/bottleneck/build-score/
  monitor-Hz/€-per-fps meer). `build-analysis.ts` levert nu `compatible` + `ddr` + checks.
- **Builder = BuildCores-stijl**: `components/builder/BuildSummary.tsx` (Compatibel-badge +
  totaal wattage + DDR-badge + compatibiliteitschecklist; prijzen blijven in de partslijst) +
  `components/builder/BuildPreview2D.tsx` (lichte 2.5D SVG-weergave die zich vult bij toevoegen).
- Compatibiliteit is bewust beperkt tot wat betrouwbaar uit de naam/specs volgt: socket,
  DDR-type, case-formfactor vs moederbord, PSU-wattage. **GPU-lengte/koeler-hoogte bewust nog
  niet** (hangt af van het exacte product, niet de chipset — zou gokwerk zijn).
- Homepage geherpositioneerd: van FPS/bottleneck naar compatibiliteit + visuele build +
  prijsvergelijking (Hero-pijlers, CompatCheck, metadata).

**Nieuw (14 juni 2026, deel 5) — BuildCores-categorieën (roadmap stap 1 ✅):**
Catalogus uitgebreid van 12 naar **22 categorieën**. Tien nieuwe, allemaal browsbaar/
vergelijkbaar maar **geen build-slot** (zelfde model als de bestaande randapparatuur):
microfoon, webcam, speakers, case fan, koelpasta, geluidskaart, netwerkkaart, capture card,
besturingssysteem (Windows-licenties), accessoires (kabels/hubs/risers/strips/stoffilters).
- **Type-groepen** (`src/lib/categories.ts`): `PERIPHERAL_TYPES` uitgebreid (in/out-devices:
  +microphone/webcam/speaker) en nieuw `ACCESSORY_TYPES` (interne extra's + software:
  casefan/thermalpaste/soundcard/networkcard/capturecard/os/accessory). `CATALOG_TYPES`
  = core + peripheral + accessory. Build-slots (`COMPONENT_TYPES`) ongewijzigd → builder,
  builds-API en PriceList tonen de nieuwe categorieën bewust niet als slot.
- **Relevance** (TS + Python spiegels): require/exclude per nieuwe categorie + `inferCategory`-
  volgorde. `casefan` staat vóór `cooling` (losse fan → casefan; CPU-koeler valt via de
  casefan-exclude alsnog door naar cooling). `accessory` is het meest generiek → altijd
  als laatste. `isComponentType` is nu zelf-onderhoudend (checkt `RULES`).
- **Scrapers**: `queries.py` heeft zoektermen voor alle 10 nieuwe categorieën; de 6-uurs
  GitHub Action pakt ze automatisch mee (`refresh.py --category casefan,os,…` werkt ook).
  Tot de eerste scrape vallen lege categoriepagina's terug op live scrapen van de searchTerm.
- **Icons gecentraliseerd**: nieuwe `src/lib/category-icons.ts` (één `CATEGORY_ICONS`-map)
  vervangt de 4 gedupliceerde icon-maps in CategoryGrid/Builder/SharedBuild/Categorie.
- **Tests**: `npx tsx scripts/test-relevance.ts` → 69/69 (20 nieuwe cases). Python-spiegel
  18/18 geverifieerd. `tsc --noEmit` + `eslint` schoon.

**Nieuw (14 juni 2026, deel 6) — open-db dimensies + echte compat-checks (roadmap stap 2 ✅):**
De BuildCores OpenDB (ODC-By) levert nu de fysieke maten voor compatibiliteit die eerder
"gokwerk" was. **GPU-lengte vs behuizing**, **koelerhoogte vs behuizing** en **koeler-socket**
zijn live in de builder, plus een nauwkeurigere formfactor-check op de echte ondersteunde lijst.
- **Datasets** (`src/lib/specs/data/`, gegenereerd door `scripts/build_dimensions.py`):
  `gpu-lengths.json` (per chipset lengte-range min/max/med, 267 chips, 14KB), `cases.json`
  (3551 behuizingen: maxGpu/maxCooler/maxPsu + ondersteunde mobo-formfactors, 653KB),
  `coolers.json` (2359 koelers: hoogte/water/radiator/sockets, 300KB). `ATTRIBUTION.md` +
  `/over`-sectie "Databronnen" voor de ODC-By-naamsvermelding. **Server-only** (mogen niet
  in de client-bundle).
- **Eerlijk over onzekerheid**: GPU-lengte verschilt per board-partner, dus we matchen NIET op
  exacte SKU maar oordelen tegen de chipset-RANGE: kast ≥ max → ok, kast < min → bad, ertussen
  → warn ("check je exacte model"). De chipset komt uit het bestaande `detectGpu()`.
- **Matcher** (`src/lib/specs/dimensions.ts`): token-overlap met merk- + modelnummer-poort en
  60%-dekkingsdrempel voor behuizing/koeler (varianten delen dezelfde maten, dus betrouwbaar);
  ruis (kleuren, "Air 168mm", USB-poorten) wordt gestript. Geen match → check verschijnt niet.
- **Flow**: `/api/compat` (nodejs, server) → `useCompat` (SWR) in `BuildSummary` →
  `analyzeBuild(components, compat?)` voegt de checks toe. `compat-types.ts` houdt de gedeelde
  types data-vrij zodat de datasets uit de browser-bundle blijven.
- **Verversen**: zie `src/lib/specs/data/ATTRIBUTION.md` (download tarball → `build_dimensions.py`).
  `.bc-scratch/` (lokale open-db-download) staat in `.gitignore`.
- **Tests**: `scripts/test-dimensions.ts` (matcher, 13 NL-namen) + `scripts/test-build-analysis.ts`
  (verdict-logica, 7 cases) → beide groen; `tsc` + `eslint` schoon. End-to-end geverifieerd via
  `/api/compat` op de dev-server (RTX 4090 in Meshify C → warn; NH-D15 165mm < 170mm → ok).
- Bewust nog open: AIO-radiator vs behuizing (open-db PCCase heeft geen radiator-supportveld;
  we tonen wel een info-melding met de radiatormaat). GPU's buiten `gpu-data.ts` (~37 chips)
  krijgen nog geen lengtecheck — uitbreiden = rij toevoegen in gpu-data.

**Nieuw (14 juni 2026, deel 7) — smart generate + build-templates (roadmap stap 3 ✅):**
De builder kan nu een complete, compatibele PC voorstellen uit echte catalogus-producten op
basis van een gebruiksprofiel + budget (geen persoonlijke data).
- **Generator** (`src/lib/specs/generate.ts`, puur/testbaar): verdeelt het budget over de slots
  (per use case + resolutie), kiest de sterkste betaalbare GPU/CPU (index uit gpu-data/cpu-data)
  en de rest compatibel: moederbord-socket = CPU-socket, RAM-DDR = platform, voeding ≥ aanbevolen
  wattage, opslag = SSD ≥1TB (geen HDD), koeler alleen bij een warme CPU (≥95W; anders boxed).
  Office → geen losse GPU (iGPU-CPU vereist). Onbetaalbaar slot → goedkoopste i.p.v. leeg.
- **`/api/generate`** (nodejs): haalt catalogus-kandidaten per slot (`getCatalogListings` +
  `matchesCategory`-vangnet), draait de generator, geeft `{components, notes, total, overBudget}`.
- **UI** `components/builder/SmartGenerate.tsx`: vragenlijst (gebruik/resolutie/budget) + 5
  snelstart-templates (Budget 1080p, 1440p gaming, 4K gaming, Creator, Werk & thuis) →
  `loadComponents` vult de builder + toont een toelichting per keuze. Bovenaan de builder.
- **Catalogus-vondst**: cooling-relevance lekte "Montagebeugel" → "beugel/montage/mounting"
  toegevoegd aan `cooling.exclude` (TS + Python spiegels); de generator weert accessoires + HDD's
  als extra vangnet. Live geverifieerd: 4K→RTX 5080, 1440p→RX 9070 XT, budget→RTX 5060, SSD i.p.v.
  HDD, echte koeler i.p.v. beugel.
- **Tests**: `scripts/test-generate.ts` (synthetische kandidaten: tier/compat/budget/fallback) +
  end-to-end tegen de live Neon-catalogus. `tsc` + `eslint` schoon; relevance 69/69.
- Bekend/acceptabel v1: voeding/behuizing = goedkoopste binnen budget (kwaliteit varieert);
  Intel DDR4/DDR5-borden kunnen met RAM mismatchen (deel-6 compat-check flagt dat). Ruimte voor
  een 2e pass die restbudget naar GPU/CPU rolt.

**Nieuw (14 juni 2026, deel 8) — community: galerij + vergelijken (roadmap stap 4 ✅, code):**
Opt-in publieke buildgalerij + twee builds naast elkaar vergelijken. Privacy-first: alleen
gepubliceerde builds, geen userId/persoonsgegevens in de publieke responses.
- **Schema**: kolom `builds.published` (boolean, default false) + index `builds_published_idx`.
  Migratie `drizzle/0003_tough_mercury.sql`. **✅ Toegepast op Neon** (additief, `ADD COLUMN
  IF NOT EXISTS`); `/api/builds/gallery` geeft 200 (lege lijst tot er builds gepubliceerd zijn).
- **API**: `GET /api/builds/gallery` (publieke lijst gepubliceerde builds, geen userId) +
  `PATCH /api/builds/[publicId]` (eigenaar zet `published`). Publieke GET geeft nu ook `published`.
- **UI**: `/galerij` (`GalleryClient`) grid + selecteer max 2 → vergelijk-balk → `/vergelijk`.
  `/vergelijk?a=&b=` (`CompareClient`) toont beide builds per slot (onderdeel+prijs), totalen,
  goedkoopste gemarkeerd, compat-badge per build via `analyzeBuild`. Publish-toggle ("Publiceer"/
  "In galerij") in `/builds`. Navbar + footer + sitemap kregen een Galerij-link.
- **Verificatie**: `tsc` + `eslint` schoon; dev-server rendert `/galerij`, `/vergelijk`, `/builds`
  (HTTP 200) en `/api/builds/gallery` → 200 (lege lijst) na de live-migratie. Volledige e2e met
  echte gepubliceerde builds vereist een ingelogde sessie (handmatig te testen).

**Nieuw (14 juni 2026, deel 9) — blog (roadmap stap 5 ✅):**
Educatieve blog met koopgidsen, geen reclame/sponsors/persoonsdata. Dependency-vrij opgezet
(geen MDX/markdown-lib): posts zijn type-safe TS/JSX-modules.
- **Infra**: `src/lib/blog-types.ts` (BlogMeta), `src/lib/blog.ts` (registry + `getPost` +
  `formatBlogDate`), `src/components/blog/prose.tsx` (gedeelde Lead/H2/P/UL/Callout/A/CTA in de
  huisstijl). Nieuwe post = module in `src/content/blog/` + import in de registry.
- **Posts** (3): "Hoeveel watt voeding heb ik nodig?", "1080p, 1440p of 4K: welke videokaart past
  daarbij?", "Past je videokaart en koeler wel in je behuizing?" (showcaset de compat-checks).
  Elk linkt door naar de relevante categorie + builder/smart generate.
- **Pagina's**: `/blog` (index) + `/blog/[slug]` (generateStaticParams + per-post metadata/OG,
  404 op onbekende slug). Blog-link in navbar + footer; posts in de sitemap.
- **Verificatie**: `tsc` + `eslint` schoon; dev-server rendert index + alle 3 posts (HTTP 200),
  onbekende slug → 404, CTA/cross-links/sitemap-posts aanwezig.

**Nieuw (14 juni 2026, deel 10) — echt 3D-aanzicht (roadmap stap 6 ✅):**
Naast de 2.5D-SVG nu een draaibaar **CSS-3D**-aanzicht van de build — dependency-vrij (geen
three.js), in lijn met de rest van het project.
- **`components/builder/BuildPreview3D.tsx`**: perspectief-scène met cuboids (case-frame met open
  voorzijde + moederbord/cpu/koeler/ram/gpu/opslag/voeding) die oplichten zodra je ze kiest;
  lege slots als ghost-outline. Sleep om te draaien (pointer + touch), idle auto-rotate via rAF
  (imperatief, geen re-render per frame), respecteert `prefers-reduced-motion`. Legenda eronder.
  Kleuren via de `--cb-*`-designtokens met `color-mix`.
- **`components/builder/BuildPreview.tsx`**: wrapper met een **2.5D↔3D-toggle** (2.5D blijft de
  standaard, zoals de roadmap koos). Voorkeur in localStorage via `useSyncExternalStore`
  (hydration-veilig). BuilderClient rendert nu deze wrapper i.p.v. direct de 2.5D.
- **Verificatie**: visueel via Chrome headless-screenshots (volledige + half gevulde build, en de
  builder met toggle); `tsc` + `eslint` schoon.
- **Homepage**: de statische foto in de "Slim samenstellen"-sectie (`CompatCheck.tsx`) is vervangen
  door een **roterende showcase** (`components/home/RotatingShowcase.tsx`) van 9 pc-foto's
  (`public/images/build/build-1..9.jpg`, met sharp geoptimaliseerd naar 1200×900, 64–194 KB).
  Wisselt elke 4,5s met crossfade; stopt bij `prefers-reduced-motion`. Bron: Pexels (vrije licentie).

**BuildCores-roadmap — VOLLEDIG AF (1–6):**
1. ✅ Componentcategorieën uitbreiden naar BuildCores-set. — deel 5.
2. ✅ Open-db dimensies → echte compat-checks (GPU-lengte/koeler-hoogte/case-maten). — deel 6.
3. ✅ Build-templates + "smart generate"-vragenlijst. — deel 7.
4. ✅ Community: builds-galerij + builds vergelijken. — deel 8.
5. ✅ Blog (educatief, geen sponsors/reclame/persoonsdata). — deel 9.
6. ✅ Echt 3D-aanzicht (CSS-3D), 2.5D blijft default per gebruikerskeuze. — deel 10.

**Nieuw (14 juni 2026, deel 11) — overzicht + prijshistorie (code):**
- **Snelkoppelingen overzichtelijker**: `CategoryGrid` toont de 22 categorieën nu in drie
  gegroepeerde blokken met subkop (Onderdelen / Randapparatuur / Accessoires & extra's) i.p.v.
  één platte lijst. Geldt voor de homepage én `/categorie`. Kaartontwerp ongewijzigd.
- **Prijshistorie** (✅ live, migratie toegepast):
  - Nieuwe tabel `price_history` (`drizzle/0004_whole_human_torch.sql`): append-only meetpunten
    per (retailer, url), nooit overschreven. Schrijvers slaan een punt over als het laatste punt
    dezelfde prijs heeft én jonger is dan 20 uur → tabel blijft begrensd, prijswijzigingen wél vast.
  - **Spiegels**: zowel `src/lib/db/listings.ts` (`saveListings`, write-through) als de Python
    `scrapers/corebuild_scrapers/db.py` (`save_listings`, 6-uurs Action) appenden punten.
  - **Lezen**: `getPriceHistory(db, urls, days)` → laagste prijs per dag over de aanbiedings-urls.
    `POST /api/price-history` (nodejs, http(s)-urlguard, max 12 urls) → `{ points }`.
  - **UI**: `components/PriceHistoryChart.tsx` (dependency-vrije SVG area/lijn, laagste/hoogste +
    trend t.o.v. eerste meting, reduced-motion-veilig) via `lib/use-price-history.ts` (SWR, POST).
    Getoond op `/product/[slug]` zodra er ≥2 meetpunten zijn (anders verborgen).
  - `tsc` + `eslint` + `py_compile` schoon. **Migratie ✅ toegepast op Neon** (`db:push`,
    14-06): tabel + kolommen geverifieerd, `getPriceHistory` leest live (0 rijen tot de eerste
    scrape). De tabel vult zich vanzelf bij de volgende write-through/6-uurs scrape.

**Nieuw (14 juni 2026, deel 12) — volglijst (prijsalerts v1):**
Client-side **volglijst** (localStorage, geen account nodig) i.p.v. de dode "Stel Alert In"-knop.
Eerlijk gelabeld als "Volg prijs"; échte e-mail/push-alerts komen pas met een e-mailprovider.
- **Store**: `src/lib/store/watchlist.ts` (Zustand persist, key `corebuild-watchlist`, max 100).
  `WatchItem` = id (categorie + genormaliseerde naam, ontdubbelt over retailers) + url/retailer/
  prijs-bij-toevoegen/afbeelding/timestamp. `watchId()` is de stabiele sleutel.
- **`WatchButton`** (`components/WatchButton.tsx`, variant `icon`/`full`): toggle, hydration-veilig
  via nieuwe `lib/use-hydrated.ts` (`useSyncExternalStore` — geen setState-in-effect; eslint-regel
  `react-hooks/set-state-in-effect` verbiedt het mounted-effect-patroon). Op de categoriekaarten
  (icoon bij in-voorraad, "Volg prijs" i.p.v. de dode knop bij uitverkocht) en de productpagina-hero.
- **`/volglijst`** (`VolglijstClient`, navbar + footer + noindex): lijst met per rij de actuele prijs
  (≈ laatste `price_history`-punt voor die url) en het verschil sinds toevoegen (groen/rood), link naar
  de productpagina, verwijderen, "Wis volglijst". Lege staat verwijst naar de categorieën.
- **Verificatie**: `tsc` + `eslint` schoon; dev-server → `/volglijst` 200, `/categorie(/cpu)` 200,
  `/product` 200, `POST /api/price-history` 200 (`{points:[]}`) / 400 zonder urls, homepage toont de
  drie categoriegroepen. Geen runtime-fouten in de dev-log.

**Nieuw (14 juni 2026, deel 13) — e-mail (Resend) + wachtwoord-vergeten:**
Wachtwoord-reset-flow end-to-end gescaffold. **Werkt zodra `RESEND_API_KEY` gezet is**; zonder
sleutel degradeert het netjes (de flow toont de neutrale bevestiging, alleen de mail wordt niet
verstuurd). Dependency-vrij: geen `resend`-package, gewoon de Resend REST API via `fetch`.
- **Mailer**: `src/lib/email.ts` (`sendEmail`, leest `RESEND_API_KEY` + optioneel `EMAIL_FROM`;
  no-opt + waarschuwing zonder sleutel). `src/lib/email-templates.ts` (`resetPasswordEmail`,
  inline-gestylede merk-mail, geen tracking/externe afbeeldingen).
- **better-auth**: `src/lib/auth.ts` kreeg `emailAndPassword.sendResetPassword` → `sendEmail`.
  `src/lib/auth-client.ts` exporteert nu ook `requestPasswordReset` + `resetPassword`.
- **Pagina's**: `/wachtwoord-vergeten` (e-mail → resetlink, neutrale bevestiging, geen account-lek)
  en `/wachtwoord-herstellen` (server + Suspense → `WachtwoordHerstellenClient` leest `token`/`error`
  uit de URL, nieuw wachtwoord 2x, ongeldige/verlopen token = nette melding). "Wachtwoord vergeten?"-
  link op `/inloggen` (alleen in login-modus).
- **Flow**: `requestPasswordReset({ email, redirectTo: "/wachtwoord-herstellen" })` → better-auth
  maakt token + link → `sendResetPassword` mailt 'm → gebruiker landt op `…?token=…` → `resetPassword`.
- **Verificatie**: `tsc` + `eslint` schoon (bevestigt ook dat de better-auth-API-namen kloppen);
  dev-server → alle 3 pagina's 200, `POST /api/auth/request-password-reset` → neutrale 200 (geen lek).
  Echt mailen + reset met een bestaande user = handmatig testen zodra de key er is (vereiste prod-write).
- **✅ Gedeployd (14-06)**: domein geverifieerd in Resend; `RESEND_API_KEY` (send-only key) +
  `EMAIL_FROM="CoreBuild <noreply@corebuildnl.com>"` staan in `.env.local` + Vercel **Production**
  (Preview nog niet — preview-deploys versturen dus geen mail). Productie live geverifieerd
  (`/wachtwoord-vergeten`, `/wachtwoord-herstellen`, `/volglijst`, prijshistorie-endpoint = 200).
  Echte reset-mail = handmatig testen via `/wachtwoord-vergeten` met een bestaand account.

**Nieuw (14 juni 2026, deel 14) — e-mail-prijsalerts:**
Ingelogde gebruikers krijgen een e-mail zodra een gevolgd product daalt. De client-side volglijst
blijft; dit is de server-side opt-in erbovenop (account-e-mail, geen losse opt-in/verificatie nodig).
- **Tabel** `price_alerts` (`drizzle/0005_small_ronan.sql`, **✅ op Neon**): per gebruiker+product
  (uniek op `user_id`+`product_id`), met `target_cents`, `price_at_add_cents` en anti-spam
  `last_notified_cents`/`_at`. `product_id` = `watchId` (categorie + genormaliseerde naam).
- **Repo** `src/lib/db/alerts.ts`: `listUserAlerts`/`upsertAlert`(onConflict)/`deleteAlert`,
  `findFiredAlerts` (laatste `price_history`-prijs ≤ drempel én < laatst gemaild) + `markAlertNotified`.
- **API** `/api/alerts` (nodejs, `auth.api.getSession`): GET lijst, POST upsert (max 100/user,
  http(s)-urlguard, categorie-check), DELETE `?productId=`.
- **Cron** `/api/cron/price-alerts` (GET, `Authorization: Bearer ${CRON_SECRET}`) → `findFiredAlerts`,
  groepeert per gebruiker, mailt via `sendEmail` + `priceDropEmail`, zet anti-spam bij. Dagelijks
  via `vercel.json` (`0 7 * * *`). `CRON_SECRET` staat in `.env.local` + Vercel Production.
- **UI**: in `/volglijst` per rij een **mail-alert-toggle** (alleen ingelogd; `lib/use-alerts.ts` SWR).
  Uitgelogd → banner met login-link. Rij verwijderen ruimt ook de server-alert op.
- **Verificatie**: `tsc` + `eslint` schoon; dev-server → `/volglijst` 200, `/api/alerts` 401 (uitgelogd),
  cron 401 zonder secret / **200 `{fired:0,sent:0}` mét secret** (tabel + join live tegen Neon, geen
  fouten). Echte mail (ingelogd → alert → prijsdaling → cron) = handmatig testen met een account.
- Bewust v1: drempel = de prijs bij aanzetten (mail bij élke daling); per-url-prijs (de gevolgde
  aanbieding), geen cross-retailer-minimum. Hobby-plan: cron max 1×/dag — daarom dagelijks.

**Nieuw (15 juni 2026, deel 15) — A-quickwins + SEO (JSON-LD):**
Hygiëne + vindbaarheid; data/logica ongemoeid. Alles geverifieerd: `tsc` + `eslint src` schoon,
`npm run test` groen (relevance/dimensions/build-analysis/generate), **`next build` (53 pagina's) groen**.
- **CI weer levend**: `.github/workflows/ci.yml` triggerde op `main`/`develop` maar de repo draait op
  **`master`** → lint/typecheck/build liepen nooit. Triggers nu `master`; **nieuwe `npm run test`-stap**
  (de 4 offline test-scripts) toegevoegd vóór de build. Script `"test"` staat in `package.json`.
- **OG-image in giastpc-huisstijl**: nieuwe `src/lib/og.tsx` (gedeelde `next/og`/satori-kaart: wit
  canvas, oranje #FF8800, scherpe hoeken, component-chips, `corebuildnl.com`-balk) + route-bestanden
  `src/app/opengraph-image.tsx` + `twitter-image.tsx` → site-breed, 1200×630, statisch geprerenderd.
  De oude lichte `images: feature-pc.png` is uit `layout.tsx` gehaald (file-conventie levert nu og/twitter).
  Dependency- en asset-vrij (geen design-bestanden, geen font-fetch). `feature-pc.png` is nu ongebruikt.
- **JSON-LD structured data** (Rich Results voor een vergelijker):
  - `src/components/JsonLd.tsx` — herbruikbare `<script type="application/ld+json">` met `<`→unicode-escape
    (Next-aanbeveling, XSS-veilig), geen hooks → server- én client-bruikbaar.
  - **BreadcrumbList** server-gerenderd in `product/[slug]/page.tsx` (Home › Categorie › Product; leest
    `cat`/`q` uit de URL → zichtbaar zónder JS). Page is nu `async`.
  - **Product + AggregateOffer** client-side in `ProductClient.tsx` zodra de prijzen geladen zijn —
    laagste/hoogste prijs + `offerCount` + per-aanbieder `Offer` (prijs/voorraad/url/seller). **Alleen
    échte aanbiedingen** (`!mock`) → geen nepprijzen in structured data; geen echte rij → geen Product-LD.
  - Valideren: Google Rich Results Test / validator.schema.org op een live productpagina.
- **Branch-opruiming**: `redesign-giastpc` (volledig in master gemerged) verwijderd lokaal + op origin.
  **`redesign-stitch`** (dark glassmorphism, 5 commits vooruit) bewust **behouden** als alternatief.
- **Vercel Preview-env — bewuste keuze (15-06): Production-only laten.** `RESEND_API_KEY`/`EMAIL_FROM`/
  `CRON_SECRET` blijven alleen Production zodat **preview-deploys geen échte mail naar echte gebruikers
  sturen**. Ook `BETTER_AUTH_SECRET` ontbreekt in Preview (alleen Dev+Prod) → auth-flows op preview-URL's
  werken niet; acceptabel zolang er niet op preview getest wordt. Wil je het later wél:
  `npx vercel env add RESEND_API_KEY preview` (idem `EMAIL_FROM`, `CRON_SECRET`, `BETTER_AUTH_SECRET`;
  waarden staan in `.env.local`).

**Nieuw (15 juni 2026, deel 16) — privacy-vriendelijke analytics:**
- **Vercel Web Analytics** toegevoegd: `@vercel/analytics` (v2) + `<Analytics />` (import
  `@vercel/analytics/next`) in `src/app/layout.tsx`. **Cookieloos/GDPR-vriendelijk** (geen
  consent-banner nodig), past op het Hobby-plan (gratis tier). `tsc` + `eslint` + `next build`
  (55 pagina's) groen.
- **⚠️ Handmatige stap (verplicht om data te zien)**: zet Web Analytics **aan** in het Vercel-
  dashboard (project CoreBuild → tab *Analytics* → *Enable*). Zonder dat stuurt `<Analytics />`
  niets. Alternatief als je weg wilt van Vercel: Plausible (betaald/self-host).
- **Nog handmatig (kan ik niet autonoom)**: échte verificatie met een account/apparaat —
  (1) wachtwoord-reset-mail via `/wachtwoord-vergeten` met een bestaand account, (2) prijsalert-
  mail (ingelogd → volglijst-alert → prijsdaling → dagelijkse cron), (3) mobiele weergave op een
  echt toestel (headless-Chrome mobiel is onbetrouwbaar, zie redesign-notities).

**Nieuw (15 juni 2026, deel 17) — prijsalerts v2 (doelprijs + cross-retailer):**
- **Instelbare doelprijs**: elke `/volglijst`-rij heeft nu per alert een doelprijs-veld
  ("Mail zodra de laagste prijs ≤ €X" + Bewaar). De API ondersteunde `targetEur` al; de UI
  exposet het nu (default zonder waarde = bij elke daling). `use-alerts.ts` geeft naast `alertIds`
  ook `alertById` (incl. `targetCents`) terug. Wijzigen reset de anti-spam (nieuwe drempel → mag
  weer mailen, via de bestaande upsert-reset).
- **Cross-retailer laagste prijs**: `findFiredAlerts` vergelijkt de drempel nu met de **laagste
  actuele prijs over álle retailers** voor het product, niet alleen de gevolgde url. Per alert
  worden zuster-urls afgeleid uit `listings` (zelfde categorie + naam bevat de genormaliseerde
  productnaam, ≥6 tekens; de eigen url telt altijd mee), de laatste `price_history`-prijs per url
  opgehaald en het minimum genomen. Degradeert naar de gevolgde url als er geen zusters matchen
  (nooit slechter dan v1). **Geen schema-/migratiewijziging.**
- **Pure helpers + tests**: `siblingUrls` / `lowestPrice` / `alertFires` in `src/lib/db/alerts.ts`
  zijn los testbaar; `scripts/test-alerts.ts` (11 cases) zit nu in `npm run test`. `tsc` + `eslint`
  + `next build` (55 pagina's) groen; `/volglijst` 200, `/api/alerts` 401 uitgelogd, geen runtime-fouten.
- **Bekende heuristiek-grens**: substring-matching kan een specifieker model meepakken
  (bv. "RTX 5060" ⊂ "RTX 5060 Ti"); de min-selectie + de productpagina-link beperken de impact.
  Échte e2e (ingelogd → alert → prijsdaling → dagelijkse cron-mail) blijft handmatig (vereist
  `price_history`-data + een sessie).

**Live-geverifieerd op productie (15 juni 2026, na deploy `cb827ee`):**
- **SEO live** op https://corebuildnl.com (met `curl` gecontroleerd): homepage levert de
  `Organization` + `WebSite` + `SearchAction` JSON-LD; `/opengraph-image` geeft **HTTP 200
  image/png (66 KB, giastpc-kaart)**; productpagina levert `BreadcrumbList` + `ListItem`.
- **Vercel Web Analytics**: in het dashboard **aangezet** → verzamelt nu data.
- **Google Search Console**: domein **geverifieerd** via DNS-TXT-record
  `google-site-verification=PIVZzSPpYqXnbt2uKUlZ6mcTl_NzZV1sn1johf_bP80` (in de DNS van
  corebuildnl.com). Hiermee kun je de sitemap (`/sitemap.xml`) indienen en de Rich Results- /
  URL-inspectie draaien op een productpagina om de structured data te bevestigen.
  (DNS-methode = los van de app; geen `metadata.verification.google`-metatag nodig.)

**Nieuw (15 juni 2026, deel 18) — builder-upgrades + wizard + repo-data + 3D:**
Vijf stappen, allemaal geverifieerd: `tsc` + `eslint src` + `npm run test` + `next build` (55 pagina's)
groen; de modals én het 3D-aanzicht zijn **runtime gecheckt via headless Chrome (CDP)**.
- **Retailer-links in de builder** (stap 1): elk gevuld slot toont een klikbare retailer-chip naar de
  winkel + een Bekijk-link in het build-overzicht. Mock/demo zonder dode link.
- **Inline onderdeel-kiezer** (stap 2): `components/builder/SlotPicker.tsx` — modal met zoek +
  populaire tags + catalogusresultaten (zelfde `/api/search?cat=`-flow als de categoriepagina), per
  resultaat een Bekijk- + Kies-knop. 'Voeg toe'/'wijzig' openen nu deze modal i.p.v. naar `/categorie`
  te navigeren (link naar de volledige pagina blijft onderaan).
- **Moederbord-referentie uit de Pawikoski-repo** (stap 3 — scope op jouw verzoek = alléén moederborden):
  `scripts/build_motherboards.ts` → `src/lib/specs/data/motherboards.json` (socket↔chipset, gefilterd op
  de sockets die `detect.ts` kent: **AM4 + LGA1200**; 2021-data, dus geen AM5/LGA1700). Helper
  `src/lib/specs/motherboards.ts`. In de SlotPicker toont het moederbord-slot **compatibele chipsets**
  (B550, X570, …) voor de socket van de gekozen CPU als klikbare zoekchips. Bron + herbouwstappen in
  `data/ATTRIBUTION.md`. De GPU/CPU-namenlijsten uit de repo zijn **bewust niet** gebruikt (te stale;
  onze eigen `cpu-data`/`gpu-data` zijn moderner). Scrapers blijven de bron van koopbare onderdelen/prijzen.
- **Begeleide wizard** (stap 4): `components/builder/BuildWizard.tsx` — knop 'Begeleid samenstellen'
  loopt de onderdelen in bouwvolgorde langs (CPU → moederbord → RAM → GPU → …), legt per stap uit waarom
  het telt, opent de inline picker en toont compatibiliteitshints (socket, DDR-generatie) op basis van
  eerdere keuzes.
- **Realistischer + interactief 3D** (stap 5): `BuildPreview3D` herzien — per-vlak belichting (solide,
  belichte onderdelen i.p.v. platte wireframe), open behuizing (zicht op de internals), ventilator-
  schijven op koeler + videokaart, grondschaduw. **Optimaler in gebruik**: de legenda is nu klikbaar
  (opent de picker voor dat slot) met hover-highlight, plus een 'aanzicht herstellen'-knop.
  `onSelectSlot` loopt via de `BuildPreview`-wrapper. Drag/auto-rotate/reduced-motion behouden.
- **Niets vereist een migratie**; data/logica (scrapers, Neon, `/api/*`, auth) ongemoeid.

**Nieuw (15 juni 2026, deel 19) — UX-ronde: zoeksuggesties, laad-indicator, featured build, perf, oranje:**
Vijf stappen, allemaal geverifieerd (`tsc` + `eslint src` + `npm run test` + `next build` 55 pagina's groen;
featured build + categorie-accenten visueel gecheckt via headless Chrome).
- **Zoeksuggesties op alle zoekvelden** (stap 1): nieuwe `components/SearchBox.tsx` (input + typeahead-
  dropdown) in de **categoriepagina** en de **builder-picker** — lokaal filteren i.p.v. wegnavigeren.
  `getSuggestions(query, limit, category?)` filtert nu op categorie (CPU-veld toont geen GPU's). Prefix-
  dan-bevat-matches (letters in dezelfde volgorde). Navbar + `/zoeken` hadden `SearchSuggest` al.
- **Laad-indicator bij navigatie** (stap 2): route-niveau `loading.tsx` voor de data-zware paginas
  (categorie/[type], product/[slug], zoeken, builder, galerij, builds, vergelijk, volglijst) tonen
  direct `components/PageLoading.tsx` (oranje spinner + skeleton) zodra je klikt. Reduced-motion-veilig.
- **Featured build toont de onderdelen** (stap 3): `GiastShowcase` toont nu een concrete voorbeeldbuild
  (1440p gaming) met de volledige onderdelenlijst; elke regel linkt naar de zoek-/vergelijkpagina.
- **Performance** (stap 4): de categoriepagina rendert nog maar **24 kaarten** i.p.v. alle ~100 (+ "Toon
  meer"), de picker **30** i.p.v. ~100 → veel minder DOM + minder gelijktijdige afbeeldingsverzoeken op
  de zware onderdelen-pagina's (de echte oorzaak van de lange laadtijden). Ongebruikte `feature-pc.png`
  (396KB) verwijderd. (Turbopack-build toont geen size-tabel; gemeten via `.next/static/chunks`.)
- **Oranje accenten in de onderdelen-sectie** (stap 5): categoriepagina kreeg de giastpc-oranje identiteit
  — mono `_kicker` + oranje accentbalk op de header, oranje resultaatteller, oranje hover-rand op de
  resultaatkaarten. **Interpretatie = de parts-browsing (/categorie)**; als je de homepage-bento of de
  builder bedoelde, makkelijk uit te breiden.
- **Let op (dev-omgeving)**: poort 3000 was tijdens deze sessie bezet door een **ander project
  (Kamerradar)**, dus CoreBuild `npm run dev` draaide op **3001**. Niet door elkaar halen bij lokaal testen.

**Nieuw (15 juni 2026, deel 20) — UX-fixes + smart generate v2:**
Zes punten, geverifieerd (`tsc` + `eslint src` + `npm run test` + `next build` 55 pagina's groen;
homepage + SmartGenerate visueel via headless Chrome).
- **Modal-scroll** (Lenis hijackte het muiswiel): `data-lenis-prevent=""` op de `SlotPicker`- en
  `BuildWizard`-overlay → het wiel scrollt nu de modal-inhoud i.p.v. de pagina erachter.
- **Picker-snelheid**: `Cache-Control` (`s-maxage`+`stale-while-revalidate`) op de **catalogus**- en
  **database**-responses van `/api/search` → herhaald openen van de picker/categoriepagina is op de
  CDN bijna instant. (Lokaal/dev blijft de Neon-latency; productie profiteert van de edge-cache.)
- **Featured build**: koeler was "Noctua NH-D15" (lucht) bij een **waterkoelings-foto** → nu "Arctic
  Liquid Freezer III 360" (AIO), consistent.
- **Live build-log** (`GiastTerminal`): body `justify-end` → de nieuwste regels (incl. "build gereed")
  blijven in beeld i.p.v. onderaan afgeknipt.
- **Oranje standaard zichtbaar bij onderdelen**: homepage-bento heeft nu oranje nummer-badges, een
  oranje rand op het label en oranje pijlen (niet alleen op hover); categoriekaarten kregen een
  persistente oranje rand-accent.
- **Smart generate v2** (`src/lib/specs/recommend.ts`): de generator geeft nu **community-favorieten**
  voorrang (PSU-tierlists, r/buildapc, Gamers Nexus/HWUB-consensus: koeler/voeding/behuizing/mobo/RAM/
  SSD) — maar **alleen binnen budget** (duwt de build nooit verder over budget; cheapste-compatibele
  fallback blijft), met een toelichtende notitie. **Geen live Reddit/Substack-scraper** (ToS/fragiel/
  niet te onderhouden) — de consensus is ingebakken in naam-patronen; verversen = patronen bijwerken.
  Twee nieuwe use-cases: **Esports** (competitive, hoge FPS) + **Streamen** (multicore + 32GB); de
  SmartGenerate-UI heeft nu 5 profielen + 7 snelstart-templates. `test-generate` uitgebreid.

**Nieuw (15 juni 2026, deel 21) — community-hub (Reddit Data-API bewust NIET gebruikt):**
Doel: de r/buildapc-doelgroep aanspreken. **Eerst** een volledige Reddit Data-API-koppeling gebouwd
(app-only OAuth-client + `reddit_posts`-tabel + dagelijkse cron + DB-feed), maar na het lezen van
Reddit's **Responsible Builder Policy / Developer Terms** teruggedraaid: commercieel gebruik/opslag van
Reddit-content vereist (mogelijk) schriftelijke goedkeuring, en data als input voor aanbevelingen
(onze "fase 2") is verboden zonder toestemming. Voor een commerciële site (affiliate) te riskant.
- **Compliant pivot**: `/community` is nu een **statische hub** die naar de relevante subreddits
  **linkt** (r/buildapc, r/buildapcforme, r/buildapcsales, r/pcmasterrace — linken mag altijd) en
  uitlegt hoe de **smart generate de community-consensus verwerkt** (link naar de builder). **Geen
  Reddit-content opgeslagen of getoond.** Bronvermelding onderaan. Navbar/footer/sitemap + `loading.tsx`.
- **Verwijderd** (in commit `d25bcff`): `src/lib/reddit.ts`, `src/lib/db/reddit.ts`, `/api/cron/reddit`,
  tabel `reddit_posts` (migratie 0006 + schema teruggedraaid, `_journal` hersteld t/m 0005),
  `scripts/test-reddit.ts`, de Reddit-cron uit `vercel.json`. **Geen `REDDIT_*`-env-vars nodig.**
- `tsc` + `eslint src` + `npm run test` + `next build` (56 pagina's) groen; `/community` visueel bevestigd.
- **Mocht je later toch de Data API willen**: het zit in de git-historie (commit `fde43d1`). Dan eerst
  Reddit's commerciële goedkeuring regelen + deletion-compliance (verwijderde posts niet meer tonen).

**Open punten:** fase 3 roadmap (officiële API's na KvK — voldoet nog niet aan de eisen). De optionele
redesign-restpunten (per-categorie hero-foto, preassembled-productkaarten = `/voorbeeldbuilds`, blog-bento)
zijn **afgerond in deel 23**. Nog handmatig te verifiëren (vereist account/inbox/toestel): reset-mail,
prijsalert-cron-mail, mobiele weergave. Search Console-vervolg: sitemap indienen + Rich Results-test op een productpagina.

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
| State | Zustand (persist → localStorage) |
| Forms | react-hook-form + zod |
| CI | GitHub Actions: `ci.yml` (build) + `scrape.yml` (prijzen, elke 6 uur) |
| Scrapers | TypeScript (cheerio, in `/api/search`) + Python (`scrapers/`, curl_cffi) |

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
- **Amazon** — best-effort; URL via `data-asin` → `/dp/<asin>`, voegt `?tag=` toe als `AMAZON_ASSOCIATE_TAG` gezet is. Vanaf Vercel soms geblokkeerd → mock-fallback; échte data komt via de lokale Python-runs in de database
- **Bol** — best-effort; cards `div[role="button"]`, prijs uit screen-reader-span ("De prijs van dit product is..."). Bot-detectie blokkeert Vercel → mock-fallback; échte data komt via de lokale Python-runs in de database
- **Mock-fallback** (`src/lib/mock/catalog.ts`) — ~38 realistische producten over alle 8 categorieën; deterministische prijsvariatie per retailer; resultaten dragen `mock: true` en tonen "· demo" in de retailerbadge
- `scripts/test-scrapers.ts` — `npx tsx scripts/test-scrapers.ts "zoekterm"` test alle scrapers tegen de echte sites

### Relevantielaag (juni 2026) — tegen junk-resultaten
- **Probleem**: retailer-zoekmachines matchen fuzzy ("processor" → Harry Potter
  "**Professor** Sneep"-figuren bij Alternate/Azerty) en geven accessoires terug
  (waterblocks bij GPU's, SSD-behuizingen bij Opslag, laptops bij RAM/"rtx 4070")
- `src/lib/relevance.ts` + `scrapers/corebuild_scrapers/relevance.py` (spiegels!):
  per categorie require/exclude-regexpatronen + globale junk-blocklist;
  `isJunk()`, `matchesCategory()`, `inferCategory()`
- `/api/search` accepteert `&cat=` — filtert cache én live resultaten op categorie;
  zonder `cat` wordt alleen junk geweerd
- **Catalogusmodus**: `/api/search?cat=cpu` zónder `q` → alle verse rijen voor die
  categorie uit de DB (TTL 7 dagen, ontdubbeld op retailer+url). Categoriepagina's
  openen hiermee; leeg → fallback naar de standaard-zoekterm
- `listings.category`-kolom (migratie `0002`) — gevuld door Python-scrapers
  (CATEGORY_QUERIES kent de categorie) of `inferCategory()` bij write-through
- `refresh.py` filtert vóór opslaan en logt "(N irrelevant overgeslagen)"
- **Titel-normalisatie**: `src/lib/clean-name.ts` + `clean_name.py` (spiegels!) —
  machinevertaalde Bol-titels ("Wees Stil!" → be quiet!, "Behuizing Voor S-Am5" weg),
  categorie-prefixen ("ATX Semi-tower Box …", "Motherboard …"), kapotte casing
  (Ghz/Cpu/Am5) en gedupliceerde frasen. Toegepast in `/api/search` (serve-time)
  én in `db.py` (Python-opslag)
- Tests: `npx tsx scripts/test-relevance.ts` (50 cases op echte junk-namen/titels uit de DB)
- Opschoning (idempotent): `npx tsx scripts/clean-listings.ts` (na `db:push`) —
  verwijdert junk, hercheckt categorieën, normaliseert titels

### UI (Stitch design geïmplementeerd)
- Homepage (`/`) — hero met gradient bg + zoekbalk, 8 categorie-cards, features-sectie
- Zoeken (`/zoeken?q=`) — filter sidebar (retailers/prijs/voorraad), resultatenlijst met "Beste prijs" badge
- Navbar — fixed, "CoreBuild" tekst, nav-links met active-state, zoekveld (behalve home), "Inloggen" of sessie-dropdown
- Footer — 3-kolom layout
- `PriceList` — retailer badges, product image, prijs, externe link knop

### Builder, categorie & zoeken

#### Builder + Staat
- `src/lib/store/build.ts` — Zustand build store, localStorage persist (`corebuild-build`), 8 component slots
- `src/lib/categories.ts` — `COMPONENT_META` (label, searchTerm, popularTags, wattage per slot)
- `src/lib/types.ts` — `ComponentType` union + `PriceResult` / `SearchResults` interfaces

#### Pagina's
- `/builder` — 12-col grid, gevulde/lege slots, build-overzicht sidebar met 48px prijs, power-bar (leest PSU-wattage uit productnaam), Clear all, Bewaar build
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
- `.env.local` bevat de **Neon**-URL (pooled) + `BETTER_AUTH_SECRET` — lokaal dev praat dus
  met dezelfde database als productie
- Wil je een wegwerp-database: Docker-container `corebuild-pg` bestaat
  (`docker start corebuild-pg`, URL: `postgres://postgres:test@localhost:54329/corebuild`),
  daarna wel `npm run db:push` voor het schema

### Python-scrapers (`scrapers/`) — gebouwd & getest tegen Neon
- 5 retailer-modules (zelfde selectors als de TS-scrapers), `refresh.py` CLI, zie `scrapers/README.md`
- **curl_cffi met Chrome-impersonatie** — de standaard requests-library wordt door
  Amazon geblokkeerd op TLS-fingerprint (503)
- Vanaf residentieel IP (thuis) werken **alle 5** retailers, inclusief Bol en Amazon —
  zo komt er échte Bol/Amazon-data in de database terwijl Vercel ze niet kan scrapen
- GitHub Actions (`.github/workflows/scrape.yml`): elke 6 uur megekko/azerty/alternate;
  repo-secret `DATABASE_URL` is gezet — eerste run geslaagd (963 rijen, juni 2026)
- Lokaal: `cd scrapers && .\.venv\Scripts\python refresh.py --all`

### UI/UX & security (juni 2026)
- **Mobiel menu** in de navbar (hamburger, met zoekveld en sessie-acties) — daarvoor
  was er op mobiel géén navigatie
- A11y: skip-link, `:focus-visible`-stijl, `prefers-reduced-motion`, aria-labels op
  sliders/selects/dropdowns (aria-expanded + Escape sluit), `aria-current` op nav
- `px-4 sm:px-8` op alle paginacontainers (was overal `px-8`)
- "Exporteer build" werkt nu (kopieert samenvatting naar klembord); h1 op builder
- Neppe "Sponsor"-kaart op categoriepagina's vervangen door builder-CTA
- `/over`-pagina (privacy + affiliate disclaimer) — footer-links waren dood (`#`)
- Homepage-copy eerlijk gemaakt: "volledige compatibiliteitscontrole" → wattage-check
  (compatibiliteitscheck op socket/formaat bestaat (nog) niet)
- Security: TLS-certificaatverificatie op de Neon-verbinding (was
  `rejectUnauthorized: false`), inputvalidatie + limieten op `POST /api/builds`
  (alleen bekende slots/velden, http(s)-URL's, max 100 builds/user), naïeve
  rate limit + max querylengte + URL-schema-check op `/api/search`,
  better-auth rate limit expliciet aan, `getDb()`-nullguards in builds-routes
- `npm audit --omit=dev`: 7 vulns, allemaal in build-tooling (esbuild via
  drizzle-kit-in-better-auth, postcss via next) — geen runtime-risico, "fix"
  zou breaking downgrades doen; periodiek herchecken

### Build-intelligentie (`src/lib/specs/`) — juni 2026
- **`gpu-data.ts` / `cpu-data.ts`** — ~35 GPU's en ~35 CPU's met relatieve gaming-index
  (0–100), VRAM/cores/threads/TDP/socket/DDR. Indexen zijn *indicaties* op basis van
  publieke benchmark-gemiddelden, niet exact. Uitbreiden = gewoon een rij toevoegen
  (met `aliases` voor de detectie).
- **`detect.ts`** — herkent model + socket/DDR/wattage/formfactor uit een productnaam.
  Alias-regex met word-boundaries, **specifiek alias eerst** (zodat "RTX 5060 Ti" niet
  als "RTX 5060" matcht). Hergebruikt dezelfde filosofie als `relevance.ts`.
- **`performance.ts`** — puur rekenmodel: `estimateFps` = `min(gpuFps, cpuFps)` per
  resolutie/preset/game-profiel; `analyzeBottleneck` (CPU↔GPU-balans per resolutie);
  `recommendHz`; `buildScore` (tier + gauge). Welke term de min is, bepaalt de bottleneck —
  FPS en bottleneck zijn dus consistent.
- **`build-analysis.ts`** — bindt detectie + model samen tot één `analyzeBuild(components)`
  object (specs, score, power, checks) dat de UI consumeert.
- **UI**: `components/builder/BuildIntelligence.tsx` (paneel), `components/ComponentSpecs.tsx`
  (spec-chips + prestatie-bar, herbruikbaar op kaarten).
- **Belangrijk**: het model is bewust een *indicatie*. Bij twijfel over getallen: pas de
  indexen/coëfficiënten in `gpu-data`/`cpu-data`/`performance.ts` aan en draai de tests.

### Nog te bouwen
- [x] **Prijshistorie** — append-only tabel `price_history` (deel 11). ✅ Migratie op Neon; grafiek op productpagina
- [x] **Wachtwoord vergeten** — flow + Resend-mailer (deel 13). ✅ live, `RESEND_API_KEY` gezet in Vercel Production
- [x] **Compatibiliteitscheck** — socket/DDR/PSU/formfactor + GPU-lengte/koelerhoogte/koeler-socket
  ✅ gebouwd (open-db dimensies, deel 6). Nog open: AIO-radiator vs behuizing (geen open-db-veld)
- [x] **Prijsalerts** — volglijst (deel 12) + e-mail bij prijsdaling voor ingelogde users (deel 14, Resend + dagelijkse cron)

---

## Roadmap: data-architectuur (afgesproken juni 2026)

**Database-first aanpak**: scrapers en API-data komen samen in een centrale database
(PostgreSQL of MongoDB), niet rechtstreeks naar de Next.js frontend.

1. **Bouwfase** ✅ KLAAR
   - Next.js site + TS-scrapers (alle 5) + Neon-database met DB-first zoekflow
   - Python-scrapers vullen de database; GitHub Actions ververst elke 6 uur
   - Bol/Amazon: echte data via lokale Python-runs; mock alleen als laatste fallback
2. **Inschrijven & livegang** ← volgende fase
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
- **Client**: `src/lib/auth-client.ts` — `createAuthClient()` zonder plugins; exports
  `signIn/signUp/signOut/useSession` + `requestPasswordReset/resetPassword` (deel 13)
- **Secret**: `BETTER_AUTH_SECRET` staat in `.env.local` én in Vercel (production/preview/development)
- **Wachtwoord-reset (deel 13)**: `emailAndPassword.sendResetPassword` mailt via `src/lib/email.ts`
  (Resend). Pagina's `/wachtwoord-vergeten` + `/wachtwoord-herstellen`. Vereist `RESEND_API_KEY`
  (+ optioneel `EMAIL_FROM`) — zie Deployment. Zonder sleutel werkt de flow, maar verstuurt geen mail.

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

- **`next build` eist een `DATABASE_URL`** — `src/lib/auth.ts` instantieert better-auth bij module-load en gooit "Auth vereist een database" als `getDb()` `null` is. Vercel-builds krijgen de echte env; **CI (`ci.yml`) zet daarom een placeholder** `DATABASE_URL=postgres://ci:ci@localhost:5432/ci` (+ `BETTER_AUTH_SECRET`) op de build-stap. `getDb()` maakt daar een lazy pg-Pool van (localhost → geen TLS, geen connectie tijdens de build). Lokaal werkt het omdat `.env.local` de URL heeft. (15-06: dit liet de CI rood staan nadat deel 15 'm op `master` activeerde.)
- **Geen ongelayerde CSS in `globals.css`** — regels buiten `@layer` winnen van álle Tailwind-utilities (een `* { margin: 0; padding: 0 }` reset sloeg ooit alle `px-*`/`mx-auto`/linkkleuren plat). Custom base-styles altijd in `@layer base` zetten.
- `kysely` gepinned op `0.28.17` via `overrides` in `package.json` (better-auth gebruikt kysely intern)
- `lucide-react` v1 — nieuwe icoon-namen: `TriangleAlert` / `CircleAlert` / `CircleCheck`
- **Dubbele env-var namen in `.env.local`** — dotenv pakt de éérste, een lege regel erboven wint dus van een gevulde eronder
- Vercel CLI is ingelogd (`r-ramphal`); project gelinkt — `npx vercel env ls` werkt
- **3D-scène (three.js) headless verifiëren** (deel 22): `BuildScene` is client-only (`ssr:false`), dus
  een `curl`/`--dump-dom` toont pas een `<canvas>` ná client-hydratie. Headless Chrome heeft voor WebGL
  de vlaggen `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` nodig (anders blanco
  canvas). Een gevulde build injecteren kan via een tijdelijke `public/_seed.html` die
  `localStorage["corebuild-build"]={state:{components:…},version:0}` zet en naar `/builder` redirect
  (daarna weghalen). De geometrie zelf is los te testen met `npx tsx scripts/test-build-model.ts` (geen browser).

---

## Deployment

| Omgeving | URL | Platform |
|---|---|---|
| Productie | https://corebuildnl.com | Vercel (auto-deploy `master`) |
| Database | Neon Postgres eu-central-1 | via Vercel Storage (`STORAGE_`-prefix env vars) |

**Env vars** (Vercel): `STORAGE_DATABASE_URL` (Neon-integratie, automatisch), `BETTER_AUTH_SECRET` (gezet).
Na Amazon Associates-goedkeuring: `AMAZON_ASSOCIATE_TAG` toevoegen.
Voor de wachtwoord-reset-mail (deel 13): `RESEND_API_KEY` (verplicht om te versturen) en optioneel
`EMAIL_FROM` (bv. `CoreBuild <noreply@corebuildnl.com>` na domeinverificatie in Resend) — zetten in
`.env.local` én Vercel (production/preview).
