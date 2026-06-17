# CoreBuild — Project Handoff

> Lees dit bestand aan het begin van elke sessie. Werk het bij aan het einde.

## ▶ Nieuw (17 juni 2026, deel 49) — security-audit stap 4: dependency-/CVE-scanning (CI)

Vierde hardening-stap: afhankelijkheden + code automatisch op kwetsbaarheden scannen. Repo is **public**
→ CodeQL, Dependency Review en secret scanning zijn gratis. Alleen CI/config, geen app-code; YAML van alle
workflows gevalideerd (js-yaml-parse).

- **`.github/dependabot.yml`** — wekelijkse updates voor **npm** (minor/patch gegroepeerd tegen PR-ruis,
  major's los) én **github-actions** (action-versies actueel houden). Security-PR's opent Dependabot sowieso
  direct bij een advisory.
- **`.github/workflows/ci.yml`** — nieuwe stap **`npm audit --omit=dev --audit-level=high`**: CVE-gate die
  faalt op high/critical in **productie-deps**. Bewust `--omit=dev` + drempel `high` zodat 'ie nu slaagt: de
  bekende **6 moderate** (next→postcss, build-tooling) blijven buiten de gate en komen via Dependabot binnen.
  Gecalibreerd: `npm audit --omit=dev --audit-level=high` → exit 0.
- **`.github/workflows/dependency-review.yml`** — `actions/dependency-review-action` op PR's: blokkeert een
  PR die een dep met een high/critical CVE (of foute licentie) toevoegt, vóór merge. Draait alleen op
  `pull_request` (niet op directe pushes naar master).
- **`.github/workflows/codeql.yml`** — CodeQL SAST (JS/TS, `security-and-quality`) op push/PR + wekelijks.
  Vindt *code*-kwetsbaarheden (complementair aan de dep-scanning); resultaten op het Security-tabblad.
- **Nog jouw GitHub-toggle (1 klik, gratis public):** repo → Settings → Code security → **Secret scanning
  push protection** aanzetten (blokkeert per-ongeluk gecommitte keys — relevant met alle auth/Resend/Turnstile/
  OAuth/CRON-secrets). Secret scanning zelf staat op public repos al automatisch aan.
- **Let op (CVE-gate-onderhoud):** als een echte high/critical in een prod-dep verschijnt faalt CI bewust —
  fix via de Dependabot-PR of bump de dep; verlaag de drempel niet zomaar. De moderate next/postcss-meldingen
  periodiek herchecken (waren al pre-existing, geen runtime-risico).

## ▶ Nieuw (17 juni 2026, deel 48) — security-audit stap 3: rate limiting / brute-force (LIVE)

Derde hardening-stap: de in-memory rate limiter lekte op serverless (elke lambda-instance had zijn eigen,
telkens resetbare teller → brute-force amper geremd). Opgelost door better-auth zijn tellers in **Postgres**
te laten opslaan (gedeeld over alle instances) + strakke per-IP-regels op de auth-endpoints. `tsc` +
`next build` groen; **end-to-end geverifieerd** tegen de live Neon-DB.

- **`src/lib/auth.ts`** → `rateLimit: { enabled, storage: "database", customRules }`:
  - `storage: "database"` — tellers in Neon i.p.v. per-instance geheugen (de serverless-fix).
  - `customRules`: `/sign-in/email` en `/sign-up/email` = **5 pogingen / 60s** per IP (strenger dan de
    default 10s-vensters); `/get-session: false` = uitgesloten (wordt bij elke `useSession` aangeroepen,
    geen brute-force-doel → anders een DB-write per sessiecheck). 2FA-verify-endpoints hebben hun eigen
    plugin-limiet; globale default (100/10s) blijft voor de rest.
- **Schema/migratie:** `rate_limit`-tabel (`id`/`key`/`count`/`last_request` bigint, index op `key`) in
  `auth-schema.ts`; `drizzle/0008_add_rate_limit.sql` (additief + idempotent) **toegepast op Neon** via
  `scripts/apply-migration.ts`.
- **Verificatie (lokale prod-build tegen Neon):** sign-in → `401,401,401,401,401,429,429` (5 toegestaan,
  dan 429); get-session → 8×200 (nooit 429); en een rij in `rate_limit` (`key=<ip>|/sign-in/email count=5`)
  bevestigt dat de tellers écht in de DB landen. **Let op:** moet ná elke config-wijziging eerst `next build`
  voor `next start` 'm oppikt (anders test je de oude bundel — kostte hier één misleidende run).
- **IP-bron:** better-auth leest de client-IP uit `x-forwarded-for` (default in `getIp`; Vercel zet die
  altijd met een geldige IP) → IP-resolutie werkt op serverless, geen extra config nodig. Lokaal is dat ::1.
- **Live-testnuance:** een token-loze probe op de live `/sign-in/email` geeft **400** (Turnstile-captcha
  `MISSING_RESPONSE`), niet 429 — de captcha vangt 'm vóór de rate-limit-laag. Dat is defense-in-depth:
  token-loze bots → goedkope captcha-400; requests mét geldig captcha-token + fout wachtwoord tellen wél mee
  → 429 na 5. De rate-limiter zelf is daarom lokaal (zonder Turnstile) end-to-end geverifieerd, niet via een
  live token-loze HTTP-probe.
- **Nog aanbevolen (dashboard, geen code):** zet **Vercel Firewall**-rate limiting aan (Pro) voor edge-niveau
  bescherming op `/api/*` — vangt volumetrisch/DoS-verkeer vóór de functions. De in-memory `Map` in
  `/api/search` (deel: search-fanout) blijft als goedkope soft-layer; bewust geen DB-write per zoekrequest.

## ▶ Nieuw (17 juni 2026, deel 47) — security-audit stap 2: 2FA/TOTP (LIVE)

Tweede stap van de hardening: tweestapsverificatie via better-auth's `twoFactor`-plugin. Opt-in per
gebruiker (nog geen admin-rol → niet verplicht; verplichting volgt met de admin-rol in een latere stap).
`tsc` + `next build` (65 pagina's) groen; migratie idempotent toegepast + geverifieerd op Neon; endpoints
gesmoke-test (enable→400, verify-totp→schone 401 `INVALID_TWO_FACTOR_COOKIE`, geen lek); pagina's 200.

- **Backend:** `src/lib/auth.ts` → `twoFactor({ issuer: "CoreBuild" })` (plugins is nu een array; captcha
  blijft env-gated). `src/lib/auth-client.ts` → `twoFactorClient({ onTwoFactorRedirect })` stuurt na een
  juist wachtwoord naar `/twee-factor`. Client-exports incl. `twoFactor`.
- **Schema/migratie:** `src/lib/db/auth-schema.ts` → `user.twoFactorEnabled` + nieuwe `twoFactor`-tabel
  (`secret`/`backupCodes`/`userId`→user.id cascade/`verified`). `drizzle/0007_add_two_factor.sql`
  (additief + **idempotent** gemaakt: `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / guarded FK).
  **Let op de toepas-methode:** géén `drizzle-kit migrate` (de bestaande tabellen zijn via `db:push`
  aangemaakt, geen `__drizzle_migrations`-journal in de DB → migrate zou 0000..N opnieuw draaien). Nieuw
  hulpmiddel **`scripts/apply-migration.ts`** voert exact één .sql-bestand uit via de pg-Pool:
  `npx tsx scripts/apply-migration.ts drizzle/0007_add_two_factor.sql`.
- **UI:** `src/app/account/page.tsx` ("Account & beveiliging") — inschakelen (wachtwoord → QR + handmatige
  sleutel + backup-codes → eerste code bevestigen), uitschakelen, nieuwe backup-codes. QR rendert
  **client-side** (`qrcode.react` → `QRCodeSVG`, inline SVG, CSP-vriendelijk) zodat het secret de browser
  nooit verlaat. `src/app/twee-factor/page.tsx` — login-stap (TOTP + "vertrouw dit apparaat 30 dagen" +
  backup-code-terugval). `Navbar.tsx` — "Account & beveiliging"-link in het sessie-menu (desktop + mobiel).
- **Nieuwe dependency:** `qrcode.react` (1 package, geen transitieve deps).
- **Veiligheidsontwerp:** activeren is verificatie-gated (geldige TOTP vereist vóór 2FA aan → geen
  lock-out door verkeerd scannen); uitschakelen met alleen wachtwoord (herstelbaar via reset); bestaande
  gebruikers onaangeroerd (`twoFactorEnabled` default false). Noodluik: `two_factor`-rij in Neon wissen.
- **Nog handmatig (kan ik niet autonoom):** échte e2e met een authenticator-app (QR scannen → code →
  uitloggen → opnieuw inloggen met verse TOTP) op de live site. Edge: social-only accounts (geen wachtwoord)
  kunnen 2FA nog niet zelf aanzetten (`allowPasswordless` staat uit — bewust).
- **Klein vervolgpunt:** pg waarschuwt dat `sslmode=prefer/require/verify-ca` straks (pg v9) andere
  semantiek krijgen; t.z.t. de Neon-URL/`ssl`-config expliciet op `verify-full` zetten.

## ▶ Nieuw (17 juni 2026, deel 46) — security-audit: stap 1 HTTP-beveiligingsheaders (LIVE)

Start van een stapsgewijze security-hardening (audit tegen 4 categorieën: injectie/input, auth,
server-config, bestanden/back-ups). **Bevinding: de app-code is solide** — alle SQL is geparametriseerd
(Drizzle query-builder + `sql`-tag met bindings, ook de `WHERE url IN (...)`-joins), input-validatie op
álle write-endpoints (`sanitizeComponents` etc.), React-escaping overal, enige `dangerouslySetInnerHTML`
is `JsonLd` die `<`→`<` escaped, en `/api/product-info` heeft een SSRF-allowlist. Zwaktes zitten in
de **config-laag**.

- **Stap 1 (deze, commit `cda6b97`, gepusht + LIVE + geverifieerd op productie):** `next.config.ts` zet nu
  via `headers()` op elke route: **HSTS** (`max-age=63072000; includeSubDomains`), **X-Frame-Options DENY**,
  **X-Content-Type-Options nosniff**, **Referrer-Policy** `strict-origin-when-cross-origin`,
  **Permissions-Policy** (camera/mic/geo uit). De **CSP staat bewust op `Content-Security-Policy-Report-Only`**
  (rapporteert, blokkeert niet) zodat we 'm veilig op de live site valideren vóór enforcing. CSP afgestemd op
  de echte bronnen: next/font (self-hosted), Vercel Analytics/Speed Insights (same-origin + `va.vercel-scripts.com`),
  Cloudflare Turnstile (`challenges.cloudflare.com` script+iframe+connect), retailer-images (`img-src https:`),
  three.js (`worker-src 'self' blob:`). `tsc` + `next build` (58 pagina's) groen; headers lokaal via `next start`
  én live op corebuildnl.com bevestigd.
  - **`'unsafe-inline'` op script-src** is voorlopig nodig (Next injecteert inline bootstrap/hydration zonder
    nonce). Verharding later: nonce via `middleware.ts` → dan kan `'unsafe-inline'` eraf.
  - **TODO vóór stap 1b (CSP enforcing):** browser-console checken op CSP-(Report-Only)-violations op `/`,
    `/inloggen` (Turnstile), `/builder` (3D-canvas), `/categorie/gpu` (images). Geen meldingen → header-key
    hernoemen `Content-Security-Policy-Report-Only` → `Content-Security-Policy`.

- **Roadmap resterende stappen (afgesproken volgorde):** 2) **2FA/TOTP** (better-auth `twoFactor`-plugin +
  migratie + enrollment-UI met QR/backup-codes, verplicht voor admin) · 3) **rate limiting** naar gedeelde
  store (Upstash) / Vercel WAF — de huidige in-memory `Map` in `/api/search` + better-auth default-storage
  lekken op serverless · 4) **dependency-scanning** (Dependabot + `npm audit` CI-gate + secret scanning) ·
  5) **least-privilege DB-rol** (Neon: aparte app-rol zonder DDL) + **externe, geteste, versleutelde back-up**.
  Kleinere punten: cron-secret-vergelijking naar `timingSafeEqual`; `/api/search` `errors`-veld generaliseren
  (geen `String(reason)`-leak); wachtwoordbeleid (min 8 → 12 + HIBP-breachcheck in de bestaande
  `databaseHooks.user.create.before`).

## ▶ Nieuw (17 juni 2026, deel 45) — junk-listing: tegenstrijdige platforms gefilterd

De junk-listing "X670E … LGA 1150 … B85" €52 (deel 30) matchte als goedkoopste X670E-moederbord in
Slim Kopen. Root cause: één bord/CPU = één platform, maar deze titel noemt zowel een AMD-chipset (X670E)
als een Intel-socket (LGA1150). Nieuwe `hasContradictorySocket()` in `src/lib/relevance.ts` **+ Python-
spiegel** `relevance.py` (`has_contradictory_socket`): AMD-platform-regex én Intel-platform-regex beide raak
= junk. Ingehaakt in `matchesCategory`/`matches_category` **alleen voor motherboard/cpu** (een CPU-koeler mag
wél AM5 + LGA1700 noemen — daarom niet universeel). Plus een **read-filter in `getBuildPricingData`** zodat de
al-opgeslagen junk-rij direct uit Slim Kopen verdwijnt (geen DB-write nodig). Tests: TS `test-relevance.ts`
72/72 (3 nieuwe cases incl. multi-socket koeler) + Python-asserts. `tsc`+`eslint src`+`npm run test`+`next build`
groen. **Effect:** X670E matcht nu een echt bord (€493) i.p.v. €52-junk; junk ook geweerd op categoriepagina's
(`/api/search` past matchesCategory toe) en bij toekomstige scrapes (refresh.py).
- **Opgevolgd (gebruikerskeuze: bord → B650):** Creator/4K kregen een B650-bord i.p.v. X670E (catalogus dun
  op betaalbare X670/X670E; "X670 ATX" matchte hetzelfde €493-bord). B650 (€125) is prima voor 9900X/9800X3D
  en past bij de prijs-prestatie-USP. Budgetten herijkt: Creator €2750→**€2650** (floor €2576), 4K €2800→**€2700**
  (floor €2631). (`clean-listings.ts` kan de fysieke junk-rij later wissen; functioneel al overal geweerd.)

## ▶ Nieuw (17 juni 2026, deel 44) — verzendtarieven getuned tegen echte cijfers

`src/lib/retailers.ts` (`RETAILER_SHIPPING`) bijgewerkt van schattingen naar de werkelijke NL-tarieven
(standaardpakket <10kg, geverifieerd juni 2026 via de bezorgpagina's). Belangrijkste correcties:
**Azerty (€5,95) en Alternate (€4,95) hebben GEEN gratis-drempel** → rekenen altijd verzending
(`NOOIT_GRATIS = Number.MAX_SAFE_INTEGER`); **bol** gratis-drempel €20→**€25** (fee €2,99); **amazon** gratis
v.a. €20, fee €2,99; **megekko** gratis v.a. €50 (was €75), fee €3,95. De split-cart rekent nu eerlijker:
1440p-voorbeeldbuild kreeg €10,90 verzending (azerty+alternate) → totaal €1.890,80, split wint nog €110,13
van één winkel. `tsc` + `eslint src` + `npm run test` groen (split-cart-test gebruikt eigen config). Tarieven
blijven actie-/lidmaatschap-afhankelijk (bol Select / Amazon Prime) — periodiek herijken.

## ▶ Nieuw (17 juni 2026, deel 43) — model/token-matcher voor "Slim Kopen" (dekking omhoog)

De naïeve substring-match (volledige onderdeelnaam moet in de listing-titel staan) miste generiek/
Nederlandstalig benoemde onderdelen. Vervangen door een **pure, geteste matcher**
`src/lib/specs/match-product.ts` (`productMatches` + `tokenize`):
- **CPU/GPU** → de bestaande `detect.ts`-modeldetectie; spec-objecten zijn referentie-gelijk per model,
  dus "zelfde model" = `===` (onderscheidt RTX 5070 vs 5070 Ti, 9700X vs 9800X3D betrouwbaar).
- **Overige categorieën** → onderscheidende tokens met normalisatie: formfactor (micro-atx→matx, e-atx→
  eatx, itx), "750 watt"/"750w"→`750w`, "32 gb"→`32gb`, 80+-rating→`80plus`, en **nvme/m.2→`ssd`-marker**
  (zodat een SSD-onderdeel geen HDD matcht). Vulwoorden (moederbord/behuizing/voeding…) zijn stopwords.
  Token-dekking via "gelijk of begint-met-gevolgd-door-niet-cijfer" → "b650"→"b650m", "6000"→"6000mhz",
  maar "120"≠"1200".
- **Toegepast in `getBuildPricingData`** (vervangt de oude `normName(...).includes(key)` + `MIN_KEY_LEN`).
  Profiteert dus overal: voorbeeldbuilds, de cross-retailer-split in de builder, én de build-alert.
- **Effect (live):** 1440p-voorbeeldbuild **4/8 → 7/8** gedekt (€1186 → €1879,90, nu consistent met de
  ~€1950 indicatie); Budget gamer 6/8. Resterende gaten = catalogus-beschikbaarheid (cooling/psu/case),
  geen matcher-fouten. Gate groen: `tsc` + `eslint src` + `npm run test` (26 nieuwe matcher-cases) + `next build`.
- **Ook opgewaardeerd:** `siblingUrls` in `src/lib/db/alerts.ts` (de per-product cross-retailer prijsalert,
  deel 17) gebruikt nu óók `productMatches` i.p.v. de substring-match — bredere alert-dekking (vangt anders
  getitelde siblings bij andere retailers). De korte-naam-guard (`MIN_KEY_LEN`) blijft. Deel-17 tests groen +
  2 nieuwe ram-cases in `test-alerts.ts`.

## ▶ Nieuw (17 juni 2026, deel 42) — "Slim Kopen" op /voorbeeldbuilds

De curated voorbeeldbuilds krijgen nu dezelfde koop-USP (split-cart + build-prijsindex), on-demand per kaart.
SEO/landing-winst, geen migratie. Gate groen: `tsc` + `eslint src` + `npm run test` + `next build`
(`/voorbeeldbuilds` blijft statisch ○); live geverifieerd + gescreenshot.
- **Refactor (reuse):** de resultaat-rendering (index + split) uit `BuildCheckout` geëxtraheerd naar
  `src/components/builder/BuildPricingResult.tsx` (puur presentatie, geen knoppen/sessie). `BuildCheckout`
  gebruikt 'm nu; `ExampleBuildBuy` ook.
- **Endpoint versoepeld (backward compatible):** `parseParts` in `/api/build-pricing` accepteert nu
  **name-only** parts (url/prijs optioneel) — de voorbeeldbuilds sturen alleen `slot`+`name`, die in de DB
  op naam worden gematcht. De builder stuurt nog steeds de volledige gekozen aanbieding. `BuildPricingPart`:
  url/retailer/priceEur optioneel.
- **UI:** `src/components/ExampleBuildBuy.tsx` (giastpc-stijl knop) per kaart op `/voorbeeldbuilds`.
- **Dekkingsframing:** de split-kaart toont nu "**voor N/P onderdelen**" als niet alles gematcht is
  (voorkomt een misleidend laag totaal naast de indicatie-richtprijs). Voorbeeld: 1440p-build matcht 4/8
  (CPU/GPU/PSU/case wel; generiek benoemde parts als "B650 ATX moederbord"/"32GB DDR5-6000" niet verbatim).
- **Bewuste grens / volgende verbetering:** de naam-matching is substring (`listing.name` bevat de volledige
  genormaliseerde part-naam). Generieke/Nederlandstalige namen ("moederbord", "behuizing") matchen daardoor
  niet altijd. Een **model/token-gebaseerde matcher** (via `detect.ts`/`clean-name`) zou de dekking op de
  voorbeeldbuilds **én** de cross-retailer-split in de builder verbeteren — losse vervolgstap.

## ▶ Nieuw (17 juni 2026, deel 41) — hele-build prijsalert (vervolg op "Slim Kopen")

Re-engagement-laag bovenop deel 40: ingelogde gebruikers krijgen een mail zodra de **actuele laagste
totaalprijs van een opgeslagen build** op/onder hun drempel zakt. Hergebruikt maximaal: cron-patroon +
Resend + auth + `getBuildPricingData` + de pure `alertFires` (deel 17). Gate groen: `tsc` + `eslint src` +
`npm run test` (nieuw: `partsFromComponents`-cases, 29 totaal) + `next build`; cron-route live geverifieerd
(401 zonder secret, `{fired:0,sent:0}` mét).
- **Schema (✅ migratie toegepast op Neon):** 3 nullable kolommen op `builds`: `alert_target_cents`,
  `alert_last_notified_cents`, `alert_last_notified_at`. Migratie `drizzle/0006_magenta_centennial.sql`
  (additief, idempotent `ADD COLUMN IF NOT EXISTS` toegepast). Alert hangt aan een **opgeslagen** build.
- **Repo:** `src/lib/db/build-alerts.ts` — `partsFromComponents` (snapshot → BuildParts, puur+getest),
  `currentBuildTotalCents` (= split-onderdeelprijs, zelfde bron als de index-"Nu"), `setBuildAlert`
  (zet/wist + reset anti-spam), `findFiredBuildAlerts` (drempelcheck via `alertFires`), `markBuildAlertNotified`.
- **API:** `PATCH /api/builds/[publicId]` uitgebreid — accepteert nu óók `alertTargetEur` (number>0 of null)
  naast `published`. Validatie + eigenaarscheck. De publieke GET lekt de drempel niet.
- **Cron:** `/api/cron/build-alerts` (CRON_SECRET-Bearer, groepeert per e-mail, anti-spam). `vercel.json`:
  `0 3,9,15,21` UTC (1u na de catalogus-refresh → verse prijzen). E-mail `buildPriceDropEmail` in de
  bestaande templatestijl (link naar de build).
- **UI:** prijsalert-control per build op **`/builds`** (`BuildAlertRow`: drempel zetten/wijzigen/uit) +
  CTA in het Slim-Kopen-paneel (`BuildCheckout`, sessie-bewust → /builds of /inloggen). `/api/builds`-lijst
  geeft `alertTargetCents` mee.
- **Open:** échte mail e2e (account → build opslaan → alert → prijsdaling → cron) = handmatig, zoals de
  per-product-alert. Geen opgeslagen builds in de DB om `currentBuildTotalCents` live te valideren (pad is
  unit-getest + hergebruikt geverifieerde functies).

## ▶ Nieuw (17 juni 2026, deel 40) — USP "Slim Kopen" in de builder (split-cart + build-prijsindex)

Nieuwe USP om de builder-funnel te sluiten: een affiliate-gedreven "laatste klik"-laag. Een PC koop je
zelden in één winkel, dus we tonen (a) de **slimste verdeling** over winkels en (b) het **prijsverloop van
de hele build**. Doel: 1 build → N affiliate-klikken i.p.v. 0. **Geen schema-/migratiewijziging** (bouwt op
`listings` + `price_history`). Gate groen: `tsc` + `eslint src` + `npm run test` (nieuw `test-build-pricing`,
20 cases) + `next build`; **end-to-end geverifieerd tegen de live Neon-DB** (read-only smoke-test).

- **Pure logica (getest):** `src/lib/specs/split-cart.ts` (`optimizeSplitCart` — goedkoopste per onderdeel,
  groepeert per winkel, geschatte verzending mee, plus goedkoopste "alles bij 1 winkel" → eerlijke besparing;
  voorraad wint van prijs) + `src/lib/specs/build-index.ts` (`computeBuildIndex` met **LOCF** over een
  daggrid; index start pas als álle getrackte onderdelen data hebben → complete som; `summarizeBuildIndex` →
  laag/hoog/`pctAboveLow` + signaal low/near/falling/neutral).
- **Verzending:** `src/lib/retailers.ts` (`RETAILER_SHIPPING` per retailer, gratis-vanaf-drempel + tarief).
  **Schattingen** — even sanity-checken/tunen tegen de echte tarieven (één regel per winkel).
- **Datalaag:** `src/lib/db/build-pricing.ts` (`getBuildPricingData`) — 1 `listings`-query (concurrerende
  aanbiedingen per onderdeel, productidentiteit = categorie + naam bevat genormaliseerde naam ≥6 tekens,
  hergebruikt de deel-17 sibling-logica) + 1 `price_history`-query (min-prijs per url per dag).
  **Index/split-consistentie:** het laatste indexpunt (vandaag) wordt **geankerd op de live goedkoopste
  prijs per getrackt onderdeel** (gedeelde `cheapestOffer` uit `split-cart.ts`), zodat "Nu" op de
  prijsindex exact gelijk is aan de onderdeelprijs van de slimme verdeling (price_history kan iets
  achterlopen op de actuele catalogus). Geverifieerd: €1634,80 == €1634,80.
- **Endpoint:** `POST /api/build-pricing` (nodejs, validatie + url-guard in stijl van `/api/builds`, max 8
  parts, mock uitgesloten). Geeft `{ split, index{+summary}, shippingNote }`.
- **UI:** `src/components/builder/BuildCheckout.tsx` (lui geladen, **on-demand** knop "Bereken de slimste
  manier om te kopen" — geen N zoekopdrachten per buildwijziging), via hook `src/lib/use-build-pricing.ts`.
  Gerenderd onder `BuildSummary` in `BuilderClient` bij ≥1 onderdeel. Twee strategie-kaarten (1 winkel vs
  verdeeld, bespaar-badge op de goedkoopste), per-winkel groepjes met affiliate-links + "kopieer lijstje",
  en de build-index-grafiek (hergebruikt `PriceHistoryChart` met nieuwe optionele `caption`-prop). Mobiel
  gestapeld, em-dashes vrij, eerlijke disclaimers (indicatief, verzending geschat).
- **Open / v2:** hele-build prijsalert ("mail me onder €X", hergebruikt de bestaande alert-cron) ·
  verzendtarieven verfijnen · index ook op `/voorbeeldbuilds` + gedeelde builds · echte-toestel-eyeball ·
  **nog niet gecommit/gepusht** (gebruiker beslist). Vervolg-USP's uit de brainstorm: assemblage-begeleiding
  op maat, "Second Opinion"-buildreviewer, community-leaderboard, "Mijn Rig"-lifecycle.

## ▶ VOLGENDE SESSIE — open punten / TODO (bijgewerkt 17 juni 2026)

**AF: mobiel-first traject (deel 38), Fase 0–5 compleet + LIVE op master** — fundament (viewport/safe-area/
fluïde type), bottom-tabbar, conversie-pagina's (sticky koop-balk + filter-bottom-sheets), landing &
ontdekking, account & secundair, cross-device sweep. `tsc`+`eslint src`+`next build` groen. Gecommit +
gepusht (commit `cba05b5`). **Enige restpunt:** eyeballen op een echt toestel (checklist staat in deel 38).
Aanpak was Tailwind-native (geen Konsta/Ionic/MUI).
**Na livegang (deel 39, ook live):** zoekpagina mobiel gefixt (sorteerbalk + dubbele padding, `73a18f9`)
en het "Featured build"-blok (`GiastShowcase`) van de homepage gehaald (`7b081d5`).

Optioneel, in volgorde van waarde:
1. **Voorbeeldbuild-prijzen periodiek herdraaien.** Bijgesteld in deel 30; DDR5/GPU schommelen, dus af en toe
   `npx tsx scripts/calibrate-example-builds.ts` draaien en de bedragen opnieuw kalibreren.

**Skew Protection**: ✅ al aangezet in het Vercel-dashboard (bevestigd 16 juni 2026). Geen code nodig — Vercel
regelt de Next.js `deploymentId` automatisch (geverifieerd in de Next 16-docs); niet handmatig in
`next.config.ts` zetten. Afgehandeld.

_(Catalogus-verversingscron → deel 29; voorbeeldbuild-prijzen herijkt → deel 30. Beide hieronder.)_

**Op productie verifiëren / eyeballen (kan ik niet autonoom):**

_Afgerond + live deze sessie (geen actie nodig): facet-filters + "Filters toepassen" (deel 35),
buildgalerij → /community + 301-redirect (deel 36), 4 nieuwe blogposts (deel 37)._

_Deze sessie (17 juni 2026) — nog te doen:_
- **Auth — social login afmaken (deel 34)**: OAuth-apps aanmaken voor Google/Microsoft/Discord en de keys in
  Vercel zetten (project is gelinkt → ik kan ze via de CLI plaatsen; plak Client ID + secret per provider).
  Callback-URL's voor **www én non-www**: `https://(www.)corebuildnl.com/api/auth/callback/<provider>`
  (+ `http://localhost:3000/...`). Daarna `NEXT_PUBLIC_SOCIAL_PROVIDERS=google,microsoft,discord` + redeploy.
  Vereiste env per provider staat in `.env.example`. (Google/MS/Discord OAuth + Turnstile zijn gratis; alleen
  Apple zou betaald zijn — niet gekozen.)
- **Auth — al LIVE (deel 34)**: e-mailverificatie (verplicht — `RESEND_API_KEY` + `EMAIL_FROM` stonden al in
  Vercel-Production), wegwerp-mailblokkade, en Cloudflare Turnstile-captcha (keys via CLI gezet + geredeployed;
  geverifieerd met een token-loze sign-in → `400 MISSING_RESPONSE`). Optioneel `BETTER_AUTH_URL=http://localhost:3000`
  in `.env.local` voor dev (haalt de "Base URL"-warning weg).
- **Intro-preloader (deel 33)**: live op de homepage; check 'm op een **echt mobiel toestel** (responsive
  opgezet, maar niet visueel door mij geverifieerd).
- **Speed Insights (deel 31)**: Vercel → Project → tab **Speed Insights** → *Enable* (anders geen Core-Web-Vitals-
  data). `<SpeedInsights />` zit al in de layout.
- **Google Search Console (deel 31)**: URL-prefix-property `https://corebuildnl.com` → methode **HTML-tag**
  (meta-tag staat op elke pagina). De eerdere **Domein**-property faalde; die kán alléén via DNS-TXT.

_Vorige sessie (16 juni 2026):_
- **Catalogus-cron (deel 29)**: Vercel → Cron Jobs toont nu óók `/api/cron/refresh-catalog` (02/08/14/20 UTC).
  Handmatig: `GET /api/cron/refresh-catalog` met `Authorization: Bearer $CRON_SECRET` → JSON
  `{saved, perCategory, ms, errors}`; daarna een categoriepagina (bv. `/categorie/cpu`) op verse
  megekko/azerty/alternate-prijzen checken (responseheader `x-corebuild-source: catalog`).
- **Cron (deel 26)**: Vercel → Cron Jobs draait elke 6 uur; échte mail testen (ingelogd → volglijst-alert →
  prijsdaling → cron). Handmatig: `GET /api/cron/price-alerts` met `Authorization: Bearer $CRON_SECRET`.
- **Afbeeldingen (deel 25)**: Vercel → Usage → Image Optimization (quotum); check dat een categorie-/zoek-
  pagina retailer-images als webp serveert; bij een blokkerende retailer-CDN valt `RetailerImage` terug op
  directe load.
- **Builder-UX (deel 24) + model-filter (deel 28)** op een **echt mobiel toestel**: compat-chips in de picker,
  prefetch-snelheid, "bedoelde je…?", en dat "RTX 5070 Ti" geen gewone 5070 meer toont.

Eerder al open (vereist account/inbox/toestel): reset-mail + mobiele weergave handmatig; Search Console
sitemap indienen + Rich Results-test.

## ▶ Nieuw (17 juni 2026, deel 39) — mobiel-fixes na livegang + Featured build eraf

Kleine vervolgwijzigingen na het mobiel-traject (deel 38), elk los gecommit + gepusht naar `master`:
- **Zoekpagina mobiel gefixt** (commit `73a18f9`): de sorteerbalk stapelt nu op mobiel en de 3-knops
  segmented control ("Laagste/Hoogste prijs/Relevantie") wordt onder 640px een compacte `<select>`
  (`sm:hidden` ↔ `hidden sm:flex`) — die overliep eerder op een smal scherm. Dubbele top-padding weg:
  `pt-24` stond zowel op de pagina-`<main>` (`zoeken/page.tsx`) als de `ZoekenClient`-container (~176px
  loze ruimte) → nu eenmaal `pt-24` op de main, container zonder eigen `pt`/`pb`. (Beide bestonden al
  vóór deel 38; vielen op bij het mobiel testen.)
- **"Featured build"-blok van de homepage** (commit `7b081d5`): op gebruikersverzoek (`GiastShowcase`
  voelde overbodig). Import + render uit `src/app/page.tsx` gehaald én de component `GiastShowcase.tsx`
  verwijderd (git bewaart 'm). **Homepage is nu: Hero → Marquee → Terminal → Categorieën → Manifest.**
  `/voorbeeldbuilds` (waar het blok naartoe linkte) blijft bereikbaar via navbar + footer.

## ▶ Nieuw (17 juni 2026, deel 38) — mobiel-first traject (Fase 0–5 COMPLEET)

Groot project: de hele site systematisch mobiel-proof gemaakt (focus op conversie/aankopen op mobiel).
Aanpak bewust **Tailwind-native** (geen Konsta/Ionic/MUI — die botsen met de giastpc-huisstijl);
huisstijl blijft 1:1. Alle 5 fasen af + geverifieerd (`tsc`+`eslint src`+`next build` groen, 58 pagina's).
Enige restpunt is **handmatig eyeballen op een echt toestel** (checklist onderaan) — kan ik niet autonoom.

- **Fase 0 — fundament** (`layout.tsx` + `globals.css`): expliciete `viewport`-export
  (`viewportFit:"cover"` → safe-area aan, themeColor wit, **bewust géén `userScalable:false`** zodat
  pinch-zoom blijft werken). Safe-area-utilities (`pt/pb/pl/pr-safe`, `bottom-tabbar`) + body krijgt
  op <1024px onderaan ruimte (3.5rem + safe-area). Koppen `text-display-lg`/`headline-lg`/`title-md`
  vloeiend gemaakt met `clamp()` — **desktop blijft identiek** (clamp-max = oude grootte), geen
  overflow meer op 320px.
- **Fase 1 — mobiele navigatie**: nieuwe `src/components/BottomTabBar.tsx` — mobiel-exclusieve
  (`lg:hidden`) app-stijl onderbalk met 5 duim-tabs (Home/Zoeken/Builder/Volglijst/Account; account
  is sessie-afhankelijk → /builds of /inloggen). Gemount in `layout.tsx`. giastpc-stijl, oranje
  actieve-accent, safe-area-aware.
- **Fase 2 — conversie-pagina's**:
  - `ProductClient`: mobiele **sticky koop-balk** (laagste prijs + "Bekijk bij retailer") die net
    boven de tabbar zweeft (`.bottom-tabbar`-utility), `lg:hidden`.
  - `ZoekenClient` + `CategorieClient`: filter-zijbalk → **bottom-sheet** op mobiel (`md:hidden`,
    `z-[60]`, achtergrond-scroll-lock, grab-handle), met "Filters · n"-trigger. Desktop houdt de vaste
    zijbalk. Eén gedeelde `FacetFilters` (geen duplicatie) via een lokale `filterPanel(onAfterApply)`.
  - `SlotPicker` + `BuildWizard` (waren al bottom-sheets): achtergrond-scroll-lock + safe-area onder
    de footer/navigatie. **BuildWizard z-index `z-40`→`z-50`** (botste met de nieuwe tabbar op z-40).
  - `BuildPreview` (3D): `touch-none`→`touch-pan-y` (geen scroll-val meer; pagina scrollt verticaal
    door, zijwaarts slepen draait nog), canvas `h-[300px] sm:h-[340px]`.
  - `PriceList`: kaart-gap `gap-4 sm:gap-6`, primaire CTA `py-3` (groter tap-doel).
- **Fase 3 — landing & ontdekking**: home-secties (`GiastShowcase`/`GiastCategories`/`GiastManifest`)
  mobiele sectie-padding verdicht (`py-20`/`py-24` → `py-12/14 sm:…`, minder loze scroll; desktop
  gelijk). **Regressie gefixt**: `GalleryClient`-vergelijkbalk stond op `fixed bottom-0` → viel achter
  de tabbar; nu `bottom-tabbar lg:bottom-0` (zweeft op mobiel erboven). Rest van Fase 3 (GiastHero/
  Terminal/Marquee, voorbeeldbuilds, blog + blog/[slug] + prose, CompareClient, community) bleek al
  mobiel-bewust → geen wijziging. GiastBlueprint is mobiel verborgen; Preloader is `z-[100]` (dekt alles).
- **z-index-conventie** (vastgelegd): sticky koop-/vergelijkbalk 30 · tabbar 40 · navbar 50 · modals
  (SlotPicker/BuildWizard) 50 · filter-sheets 60 · preloader 100. **Let op:** elke nieuwe `fixed bottom-0`
  bar moet `bottom-tabbar lg:bottom-0` gebruiken, anders valt 'ie achter de mobiele tabbar.
- **Fase 4 — account & secundair**: alle resterende hardcoded `px-8`-wrappers → `px-4 sm:px-8` (smalle
  telefoons kregen maar ~256px content): `inloggen` (+ card `p-6 sm:p-8`), `wachtwoord-vergeten`,
  `WachtwoordHerstellenClient`, `builds`, `SharedBuildClient` (3×) + totaal/CTA-rij stapelt nu op mobiel
  met volle-breedte knop, `categorie`-index, en de Suspense-fallbacks van `zoeken`/`product`/
  `wachtwoord-herstellen`. `VolglijstClient`, `contact`, `over` bleken al `px-4 sm:px-8` + mobiel-bewust
  (volglijst-rijen stapelen, alert-label icon-only op mobiel) → geen wijziging. Auth-inputs zijn `h-11`,
  submit-knoppen `h-12` (goede tap-targets). Resterende kale `px-8` zijn knop-paddings (correct).
- **Fase 5 — cross-device sweep**: systematische grep-audit (grote tekstgroottes zijn allemaal responsive
  `text-[28-30px] sm:…`; geen vaste `w-[…]`/`min-w-[…]` ≥320px → alle brede waarden zijn `max-w-` caps;
  geen verdwaalde `fixed bottom-0` meer). Eind-gate `tsc` + **volledige `eslint src`** + `next build`
  groen. Het Fase 0-fundament (fluïde clamp-type + `px-4`-containers + `overflow-x:hidden`) dekt de rest af.

**Eyeball-checklist (echt toestel, kan ik niet autonoom):**
1. **Bottom-tabbar**: valt in de duimzone, actieve tab klopt per pagina, safe-area onderaan op een toestel
   met home-indicator (iPhone), geen overlap met content.
2. **Conversie**: sticky koop-balk op `/product/*` zweeft net boven de tabbar; filter-bottom-sheet op
   `/zoeken` + `/categorie/*` (open/sluit, "Filters · n", "toepassen" sluit 'm, achtergrond scrollt niet).
3. **Builder**: SlotPicker- en BuildWizard-sheets op klein scherm; 3D-preview scrollt verticaal door
   (geen scroll-val), zijwaarts slepen draait nog.
4. **Community**: vergelijk-balk zweeft boven de tabbar (niet erachter).
5. **Type**: koppen niet afgekapt/overlopend op ≤360px; pinch-zoom werkt (bewust niet geblokkeerd).
6. Breedtes 320/360/390/414: nergens horizontale scroll.

## ▶ Nieuw (17 juni 2026, deel 37) — vier nieuwe blogposts

Posts in `src/content/blog/`: `am5-of-am4`, `ddr4-vs-ddr5`, `ssd-kopen-nvme-of-sata`,
`luchtkoeling-of-waterkoeling`, geregistreerd in `src/lib/blog.ts` (`MODULES`). Bestaande prose-stijl
(Lead/H2/P/UL/Callout/A/CTA). Vullen de gaten (CPU-platform, RAM-type, opslag, koeling), sluiten aan op de
nieuwe categoriefilters en linken naar `/categorie/*` + `/builder`. Verschijnen automatisch op `/blog` + in de
sitemap (POSTS-gedreven). Commit `5246b62`.

## ▶ Nieuw (17 juni 2026, deel 36) — buildgalerij opgegaan in /community

- `/galerij`-route verwijderd (page + loading). `GalleryClient` omgebouwd van een hele pagina (`<main>` + h1)
  naar een herbruikbare `<section>` met h2 "Builds uit de community", nu gerenderd op **`/community`** (boven de
  subreddits).
- **301-redirect** `/galerij → /community` in `next.config.ts` (oude geïndexeerde links/bookmarks behouden).
- Navbar + footer: Galerij/Buildgalerij-links verwijderd (Community blijft). Sitemap: `/galerij` eruit,
  `/community` → prioriteit 0.7.
- CompareClient (`/vergelijk`)-teruglinks, de publiceer-knoppen op `/builds` en losse teksten verwijzen nu naar
  "community". Commit `f10b056`.

## ▶ Nieuw (17 juni 2026, deel 35) — facet-filters per onderdeel + "Filters toepassen"

- Nieuw: `src/lib/specs/facets.ts` (facet-engine) + `src/lib/specs/detect-brand.ts` (merk-detector) +
  `src/components/FacetFilters.tsx` (gedeelde zijbalk). Alles **client-side** afgeleid uit de productnaam via
  `detect.ts` — **geen DB-/schemawijziging**.
- Per categorie passende facetten mét aantallen: merk, socket (AM5/AM4/LGA…), chip (GPU), form factor, DDR,
  capaciteit (RAM/opslag), wattage + 80+-rating (PSU), type (opslag/koeling). Binnen groep = OF, tussen groepen
  = EN. Prijs = **tier-checkboxes + slider**.
- **Toepassen-knop**: de concept-selectie (de inputs) staat los van de toegepaste filters; pas bij klikken op
  "Filters toepassen" worden de resultaten gefilterd. _Let op: een `next.config`-wijziging herstart de
  dev-server en verbreekt HMR → in een al-open tab is een harde refresh nodig (dat veroorzaakte de "werkt niet"-
  melding; logica is getest en correct)._
- `CategorieClient` (categoriepagina) en `ZoekenClient` (`/zoeken`) gebruiken het. `/zoeken` kreeg een
  **categorie-keuze** (werkt direct, bepaalt welke facetten tonen); retailer-/voorraadfilters vallen daar ook
  onder de toepassen-knop. Commit `9a6da22`.

## ▶ Nieuw (17 juni 2026, deel 34) — Auth: social login + anti-spam

Better Auth uitgebreid tegen spam/nepaccounts + voorbereid op social login. `tsc` + `eslint` + `next build`
groen (commit `1d5ffc6`). Geen schemawijziging (bestaande `account`/`verification`-tabellen volstaan).
- **E-mailverificatie**: `emailVerification` (sendOnSignUp + autoSignInAfterVerification) + `requireEmailVerification`
  in `emailAndPassword`, met nieuwe `verifyEmail()`-mailtemplate. Gegate op `RESEND_API_KEY` — verificatie is
  alleen verplicht als Resend bestaat (anders zou niemand kunnen bevestigen). RESEND_API_KEY + EMAIL_FROM stonden
  al in Vercel-Production → **verificatie is dus live**. Dev-vangnet: zonder Resend wordt de verificatielink in de
  console gelogd.
- **Wegwerp-mailblokkade**: `src/lib/disposable-email.ts` (curated set) via `databaseHooks.user.create.before`
  → `APIError` bij een wegwerp-domein. Direct actief, geen config.
- **Captcha (Cloudflare Turnstile)**: `captcha`-plugin op `/sign-up/email` + `/sign-in/email` (bewust niet op
  password-reset). Client-widget `src/components/auth/Turnstile.tsx` stuurt de token via header
  `x-captcha-response`. Gegate op `TURNSTILE_SECRET_KEY`. **Live**: keys via CLI in Vercel-Production gezet +
  geredeployed; geverifieerd (token-loze sign-in → `400 MISSING_RESPONSE`). Bewust alleen Production (Turnstile-
  hostnames dekken geen `*.vercel.app`).
- **Social login (Google/Microsoft/Discord)**: `socialProviders` in `auth.ts`, env-gated per provider (alleen
  actief met clientId+secret). Knoppen `src/components/auth/SocialButtons.tsx` volgen
  `NEXT_PUBLIC_SOCIAL_PROVIDERS`. **Nog te doen** — OAuth-apps + keys (zie verifieer-lijst). Apple bewust niet
  (enige betaalde optie).
- **Inlogpagina** (`src/app/inloggen/page.tsx`): social-knoppen + scheiding, Turnstile-widget, "bevestig je
  e-mail"-scherm met opnieuw-versturen; detecteert via de sessie-token of verificatie vereist is.
- **Infra**: Vercel-project is nu lokaal **gelinkt** (`.vercel`, gitignored) → env-vars kunnen via de CLI.
  `.env.example` uitgebreid met alle auth-keys + callback-URL's. CLI-scope-tip: deployments horen bij team
  `r-ramphals-projects` (gebruik `--scope r-ramphals-projects` bij `vercel redeploy`).

## ▶ Nieuw (17 juni 2026, deel 33) — Swiss-brutal intro-preloader

GSAP-overlay op de homepage (`src/components/motion/Preloader.tsx`, gemount in `page.tsx`; commit `d715377`).
Donker, blueprint-grid, oranje `gp-bar`-header, teller 0→100 met blokkige voortgangsbalk, en de 8 PC-onderdelen
(CPU…COOL) die progressief oplichten; daarna veegt het paneel omhoog weg. Toont alleen het **eerste bezoek per
sessie** (sessionStorage `cb_intro_shown`), wacht op `window.load` (cap 3,5s), reduced-motion-safe, fluïde
responsive. Eerst was een minimalistische/glossy variant (HDRI/bloom) geprobeerd — op feedback teruggebracht naar
deze schone Swiss-brutal stijl (zie memory `corebuild-3d-viewer-style`).

## ▶ Nieuw (17 juni 2026, deel 32) — Office-snelstart licht lege koeler-slot toe

Kleine fix in de build-generator (`src/lib/specs/generate.ts`, commit `0ad5b99`): de boxed-koeler-note hing aan
de generieke `tdp<95`-tak, waardoor een (hypothetische ≥95W) office-CPU géén koeler én géén uitleg kreeg. Aparte
office-tak licht nu altijd toe dat de meegeleverde boxed koeler volstaat (zonder de iGPU-regel uit stap 2 te
dubbelen). Twee asserts toegevoegd in `test-generate.ts`.

## ▶ Nieuw (17 juni 2026, deel 31) — Speed Insights, GSC-verificatie & 3D-viewer opgepoetst

Drie stukken; alle `tsc` + `eslint` + `next build` groen, in aparte commits naar master gepusht. Eén nieuwe
dependency: `@vercel/speed-insights` (de 3D-postprocessing-dependency is met de rollback weer verwijderd — punt 3).

**1. Vercel Speed Insights.** `@vercel/speed-insights` geïnstalleerd en `<SpeedInsights />` in
`src/app/layout.tsx` naast `<Analytics />`. Meet Core Web Vitals; stuurt pas data zodra Speed Insights in het
Vercel-dashboard aanstaat (zie verifieer-lijst bovenaan).

**2. Google Search Console — meta-tag-verificatie.** `verification: { google: "PIVZ…bP80" }` toegevoegd aan
de metadata in de layout → rendert `<meta name="google-site-verification" …>` op elke pagina (bevestigd in de
gebuilde HTML). **Inzicht**: de eerdere poging ("werkt niet") was een **Domein**-property — die kan alléén via
DNS-TXT. De meta-tag verifieert een **URL-prefix**-property, dus kies in GSC methode "HTML-tag". De DNS-TXT-
route (`google-site-verification=PIVZ…bP80` op host `@`) kan ik niet zetten (geen DNS-toegang).

**3. 3D build-viewer — fidelity-experiment teruggedraaid.** Eerst HDRI-`Environment` + Lightformers,
`MeshTransmissionMaterial`-glas en Bloom-postprocessing toegevoegd (commits `54cb6be` + `0600eb3`), maar op
feedback **teruggedraaid**: dat gaf een gele streep (oranje Lightformer-reflectie + bloom) en maakte het glas
juist mínder doorzichtig. `src/components/builder/BuildScene.tsx` is hersteld naar de versie van vóór deze
sessie (`git checkout 808be50 -- …`) en `@react-three/postprocessing` weer verwijderd.
- **Richtlijn voor de viewer** (zie ook memory `corebuild-3d-viewer-style`): houden zoals nu — schoon,
  **doorzichtig**, toont puur de **layout** van de componenten; géén reflecterende env-maps, getint/transmission-
  glas of bloom-gloed. Toekomstige winst alleen binnen die stijl (bv. transparantere/wireframe kastpanelen, of
  glTF via `useGLTF` met behoud van de parametrische plaatsing uit `buildModel()`).
- **Spline blijft afgeraden**: de viewer is data-gedreven (geometrie volgt `buildModel()` in mm), dus een
  statisch geauthorde scene zou de data-binding/bundle juist verslechteren.

## ▶ Nieuw (16 juni 2026, deel 30) — voorbeeldbuild-prijzen herijkt tegen de live catalogus

Tweede TODO-item van deze sessie: de `budgetEur`-richtprijzen op `/voorbeeldbuilds` opnieuw gekalibreerd
tegen de live catalogus (met toestemming, één **read-only** query — alleen SELECT, niets geschreven).
- **Nieuw read-only hulpmiddel `scripts/calibrate-example-builds.ts`**: toont per onderdeel de goedkoopste
  in-stock kandidaten uit `listings` (ge-AND ILIKE-match per onderdeel), zodat je met oordeel een
  representatieve, legit prijs kiest (geen junk / HDD-i.p.v.-NVMe / verkeerd model). Bewust **niet** in
  `npm run test` (raakt de prod-DB); draaien met `npx tsx scripts/calibrate-example-builds.ts`
  (vereist `DATABASE_URL` in `.env.local`).
- **`src/lib/example-builds.ts`**: budgetten bijgesteld op basis van de catalogus-som (conservatief
  afgerond): Budget gamer 1050→**1150** (was te optimistisch — RAM €210 + GPU €299 alleen al), 1440p
  1900→**1950**, Streamer 2100→**2200**, Creator 2800→**2750**, 4K 2850→**2800**; Esports blijft **1400**.
  Doc-comment kreeg een kalibratiedatum + scriptverwijzing.
- **Oordeel/transparantie**: een paar onderdelen zaten niet in de catalogus en zijn conservatief op
  marktprijs geschat — **RTX 5070 Ti** (~€900; bleek afwezig: de "ti"-match ving het woord "ven**ti**latoren",
  alle treffers waren gewone 5070's), **Montech AIR 903**, de specifieke **Thermalright-koelers**, en de
  full-size **O11 Dynamic**. Junk-listing genegeerd ("X670E … LGA 1150 … B85" €52). Storage: goedkoopste
  échte NVMe gekozen i.p.v. de goedkopere HDD/SATA-rijen. Daardoor liggen sommige budgetten bewust boven de
  pure catalogus-som.
- **Verificatie**: `tsc` + `eslint` (src + script) + `next build` (58 pagina's; `/voorbeeldbuilds` prerendert
  statisch met de nieuwe bedragen) groen.

## ▶ Nieuw (16 juni 2026, deel 29) — catalogus-verversingscron (Vercel Pro, megekko/azerty/alternate)

Eerste TODO-item uit deze sessie gebouwd: een Vercel-cron die de catalogus-prijzen tussen de 6-uurs
GitHub-Action-runs door vers houdt voor de 3 datacenter-IP-vriendelijke retailers. Scope vooraf met de
gebruiker afgestemd: **8 kern-categorieën (hoofdterm)** + cadans **`0 2,8,14,20` UTC** (3u verschoven t.o.v.
de Action op 05/11/17/23 → gecombineerd ~elke 3u verse prijzen). Raakt data/logica, **géén** frontend.
- **`src/app/api/cron/refresh-catalog/route.ts`** (nodejs, `maxDuration=300`): zelfde CRON_SECRET-Bearer-auth
  als `/api/cron/price-alerts`. Loopt over de 8 `COMPONENT_TYPES`, scrapet per categorie de hoofd-`searchTerm`
  bij megekko/azerty/alternate (3 parallel via `Promise.allSettled`, termen **serieel** met 800ms pauze = geen
  burst per retailer), filtert met `cleanName` + `matchesCategory` (precies zoals de catalogusmodus van
  `/api/search`) en schrijft via `saveListings(db, normalizeQuery(term), filtered, "cron", cat)` — dezelfde
  write-through naar `listings` + append naar `price_history`. Antwoordt met
  `{categories, retailers, saved, perCategory, errors, ms}` (handig voor de handmatige test).
- **`vercel.json`**: tweede cron-entry toegevoegd (`/api/cron/refresh-catalog`, `0 2,8,14,20 * * *`). Pro staat
  >2 crons + sub-dagelijkse granulariteit toe (Hobby niet — dat was de deel-14/26-beperking).
- **Bewuste keuzes**: dezelfde 3 retailers als de Action (Bol/Amazon vereisen residentieel IP, blijven buiten);
  alleen de 8 hoofdtermen (model-specifieke tag-queries blijven op de Action-cadans / live-fallback);
  `saveListings` laat een retailer die dit keer niets teruggaf ongemoeid (oude rij verdwijnt via TTL), dus een
  falende retailer wist niets. `source="cron"` onderscheidt deze rijen van de Action (`"scraper"`).
- **Verificatie**: `tsc` + `eslint src` + `next build` groen; de route compileert als dynamische functie
  (`.next/server/app/api/cron/refresh-catalog/route.js`); `vercel.json` valide JSON. Het cron-effect is pas op
  productie zichtbaar (Vercel → Cron Jobs) — zie de productie-verificatielijst bovenaan.
- **Open/optioneel**: dekking later uitbreiden naar de `popularTags` of randcategorieën als de belasting het
  toelaat; eventueel aantal-`saved`/`ms` monitoren via de JSON-respons om de cadans bij te stellen.

## ▶ Nieuw (16 juni 2026, deel 28) — model-precieze zoekfilter (5070 ≠ 5070 Ti)

Zoeken op een specifiek model gaf soms een ander model terug (bv. een gewone RTX 5070 in een
"RTX 5070 Ti"-zoektocht — die kon zelfs de "beste deal" worden). Opgelost in de zoeklaag.
- **`src/lib/search-rank.ts`** — nieuwe pure `filterByQueryModel(results, query)`: noemt de zoekterm één
  specifiek CPU/GPU-model (via `detectGpu`/`detectCpu`), dan vallen resultaten van een **ander** specifiek
  model in dezelfde familie weg (symmetrisch: "5070 Ti" weert de 5070, "5070" weert de 5070 Ti; werkt ook
  voor CPU's, bv. 9800X3D ≠ 9700X, en voor Super-varianten). **Vangnetten**: alleen strikt filteren als er
  écht exacte treffers tussen zitten (anders blijft alles staan → geen lege lijst), en generieke/onbekende
  namen blijven altijd staan (niet aantoonbaar verkeerd). GPU wint van CPU bij twijfel.
- **`src/app/api/search/route.ts`**: toegepast in het cache- én live-pad, **vóór** `rankResults`, alleen bij
  een echte `q`. Catalogusmodus (geen `q`, `/categorie/[type]`) blijft de hele familie tonen — daar wil je
  juist alles vergelijken.
- **Tests**: `scripts/test-search-rank.ts` uitgebreid (nu 15 cases: 5070 Ti/5070 beide richtingen,
  geen-exacte-treffer-vangnet, generieke zoekterm, CPU-variant).
- Verificatie: `tsc` + `eslint src` + `npm run test` + `next build` (57 pagina's) groen.
- Effect o.a.: de voorbeeldbuild-links (`/zoeken?q=GeForce RTX 5070 Ti`) tonen nu alleen écht 5070 Ti.

## ▶ Nieuw (16 juni 2026, deel 27) — voorbeeldbuilds: eerlijke prijzen (geen valse beloftes)

De `budgetEur`-bedragen op `/voorbeeldbuilds` (deel 23) waren te optimistisch — met de huidige hoge
DDR5-prijzen paste o.a. "Budget gamer ~€800" niet. Op verzoek (geen valse beloftes): bedragen naar
haalbare, bewust iets **conservatieve** niveaus + framing van een ondergrens-belofte naar een indicatie.
- **`src/lib/example-builds.ts`**: budgetten **gekalibreerd tegen de live catalogus** (eenmalige read-only
  query, goedkoopste in-stock prijs per onderdeel, met toestemming): Budget gamer 800→**1050**,
  Esports 1100→**1400**, 1440p 1500→**1900**, Streamer 1800→**2100**, Creator 2000→**2800**, 4K 2500→**2850**.
  DDR5-prijspiek bevestigd (goedkoopste in-stock: 16GB **€199** / 32GB **€369** / 64GB **€769**). Een paar
  foutieve catalogus-matches (junk-listing "X670E LGA1150" €52; een RTX 5070 in een 5070 Ti-slot) zijn
  conservatief naar boven gecorrigeerd (= niet te laag beloven). Comment bij `budgetEur` benadrukt
  "indicatie, schommelt met dagprijzen, geen belofte".
- **`src/app/voorbeeldbuilds/page.tsx`**: kaartlabel **"Richtprijs / vanaf €X" → "Indicatie / ~€X"** +
  subtekst "schommelt met dagprijzen"; header-disclaimer aangescherpt (schommelt met dagprijzen, vooral
  geheugen/GPU; actuele prijs per onderdeel staat op elke regel). De per-onderdeel-links naar `/zoeken`
  dragen de échte live prijzen.
- Verificatie: `tsc` + `eslint src` + `next build` (57 pagina's) groen; pagina prerendert statisch.
- **Open**: prijzen schommelen (vooral DDR5) — de bedragen periodiek opnieuw tegen de catalogus kalibreren
  (de query-aanpak hierboven). Een volledig live totaal op de pagina was de overwogen alternatieve aanpak
  maar bewust niet gekozen (matching-onzekerheid + zwaarder); de huidige aanpak blijft statisch + eerlijk
  gekaderd.

## ▶ Nieuw (16 juni 2026, deel 26) — Vercel Pro: prijsalert-cron vaker

De gebruiker is geüpgraded naar **Vercel Pro**. Eerste benutting daarvan in code:
- **Prijsalert-cron van 1×/dag → elke 6 uur** (`vercel.json`: `0 7 * * *` → **`0 1,7,13,19 * * *`**).
  Hobby stond cron alleen op dag-granulariteit toe (vandaar deel 14 "max 1×/dag"); Pro heft dat op.
  Bewust **2 uur na elke scrape** gepland (scrapes draaien `0 5,11,17,23` UTC via `scrape.yml`), zodat de
  cron steeds verse `price_history`-data ziet. Gebruikers worden nu binnen ~6 uur na een daling gemaild
  i.p.v. tot 24 uur. Veilig: de route vuurt alleen bij een nieuwe lagere prijs (anti-spam via
  `markAlertNotified`), dus vaker draaien geeft geen dubbele mails. Routedoc bijgewerkt ("Periodieke").
- **Overige Pro-voordelen zijn operationeel (geen code)**: commerciële-gebruikslicentie (affiliate = ok op
  Pro), meer image-optimization-quotum (deel 25 profiteert), meer bandbreedte/analytics-retentie, ruimere
  functie-timeouts. **Skew Protection** is een dashboard-toggle (Project → Advanced), geen code.
- **Mogelijke vervolgstap (niet gedaan, vereist scope-keuze)**: een Vercel-cron die de catalogus tussen de
  6-uurs GitHub-Action-runs door verst houdt voor de Vercel-scrapebare retailers (megekko/azerty/alternate)
  → nóg actuelere prijzen. Bewust niet unilateraal gebouwd: scraping zit nu in GitHub Actions (bol/amazon
  vereisen residentieel IP) en dit raakt runtime-budget/retailer-belasting.
- Verificatie: `vercel.json` valide JSON, `tsc` groen. (Cron-effect is pas op productie na deploy zichtbaar;
  handmatig te testen: `GET /api/cron/price-alerts` met `Authorization: Bearer $CRON_SECRET`.)

## ▶ Nieuw (16 juni 2026, deel 25) — afbeeldingsoptimalisatie (retailer-images via de Next-optimizer)

Vervolg op de site-brede snelheid: retailer-**productafbeeldingen** gaan nu door de Next-optimizer (webp,
op de werkelijke weergavemaat) i.p.v. `unoptimized` (volledige retailer-resolutie). Dit was in deel 24
bewust uitgesteld vanwege betrouwbaarheid; nu opgelost met een wrapper die veilig degradeert. Puur frontend.
- **Gedeelde hostlijst** `src/lib/optimizable-host.ts` (`OPTIMIZABLE_DOMAINS` + `isOptimizableHost`) = één
  bron van waarheid. `next.config.ts` bouwt hieruit de `remotePatterns` (per domein **apex én `**.`-wildcard**,
  want de wildcard dekt de apex niet); `RetailerImage` gebruikt dezelfde lijst → config en component kunnen
  niet uit sync lopen. Hosts: bol.com + s-bol.com (media.s-bol.com), media-amazon.com + ssl-images-amazon.com,
  alternate.nl, azerty.nl, megekko.nl.
- **`src/components/RetailerImage.tsx`** (`"use client"`): rendert `<Image>` met 3 niveaus — **opt** (via de
  optimizer voor allowlist-hosts) → **raw** (`unoptimized`, directe load) → **fail** (`fallback`-icoon). Een
  host die NIET in de allowlist staat start meteen op `raw`, zodat je nooit de Next "hostname not configured"-
  fout krijgt; blokkeert een retailer-CDN de optimizer, dan valt `onError` terug op de directe load. Vervangt
  de 5 `<Image unoptimized>`-plekken (SlotPicker, CategorieClient, PriceList, ProductClient, VolglijstClient)
  mét passende `sizes` + het bestaande icoon als `fallback`.
- **`next.config.ts`**: `formats: ["image/webp"]`, `minimumCacheTTL: 2678400` (31 dagen, beperkt
  her-optimalisaties/kosten), `imageSizes` uitgebreid met kleine maten (56/64/96) voor de thumbnails.
- **Test** `scripts/test-image-hosts.ts` (10 cases, incl. lookalike-domein `notbol.com` → niet optimaliseren)
  in `npm run test`.
- **Verificatie**: `tsc` + `eslint src` + `npm run test` + `next build` (57 pagina's) groen. **Runtime
  bevestigd** via lokale `next start`: `/_next/image` serveert `image/webp` op maat — `cpu.webp` 43 KB →
  256px **4.6 KB**, 64px **0.4 KB** (≈89–99% kleiner).
- **⚠️ Let op (Vercel Hobby)**: dit gebruikt het **image-optimization-transformatiequotum** van het
  Hobby-plan. `minimumCacheTTL` staat daarom hoog (varianten 31 dagen gecached). Bij overschrijding degradeert
  Vercel; en als een retailer-CDN de optimizer blokkeert valt `RetailerImage` automatisch terug op de directe
  load. Echte cijfers + eventueel host-blokkades zijn pas ná deploy zichtbaar (Vercel-dashboard → Usage/Image
  Optimization). Lokale retailer-CDN-hosts waren niet uit de prod-DB te halen (read gated); de wrapper maakt
  een onvolledige lijst onschadelijk (onbekende host → directe load).

## ▶ Nieuw (16 juni 2026, deel 24) — builder-UX (zoeken slimmer/sneller) + site-brede snelheid

**Fase 1** van een UX-traject voor de builder (plan: zoeken slimmer + sneller, dan site-brede snelheid).
Puur frontend/intelligentie; scrapers/Neon/auth/relevance ongemoeid. Alles geverifieerd: `tsc` + `eslint src`
+ `npm run test` (nu **9 scripts**) + `next build` (57 pagina's) groen.
- **Stap 1 — relevantie-ranking** (`src/lib/search-rank.ts`, puur + getest): `rankResults(results, query)`
  scoort op token-overlap + exacte modeltreffer (hergebruikt `detectCpu/detectGpu`) + op-voorraad, prijs
  als tiebreaker. Toegepast in `/api/search` **alleen bij een echte `q`** (catalogusmodus houdt prijs/
  catalogus-volgorde); ranking is deterministisch → edge-cache per (q+cat) blijft geldig. Hierdoor werkt
  ook de "Relevantie"-sorteerknop op `/zoeken` nu echt (die hield de API-volgorde aan).
- **Stap 2 — typefout-opvang** (`src/lib/fuzzy.ts`, puur + getest): Damerau-Levenshtein + `fuzzyTokenMatch`
  + `closestTerm`. **Cijfers (modelnummers) moeten exact** ("5070" ≠ "5080"); alleen alfawoorden krijgen
  tolerantie. `getSuggestions` (search-suggestions.ts) heeft nu een fuzzy-fallback → de typeahead in
  `SearchBox` toont correcties terwijl je typt. "Bedoelde je …?" in de lege staat van `ZoekenClient` en
  `SlotPicker` (één klik corrigeert).
- **Stap 3 — compat per optie + community-link** (`src/lib/specs/slot-compat.ts`, puur + getest):
  `slotCompat(type, optionName, components, analysis)` geeft een **naam-only** oordeel per resultaatrij
  (instant, geen fetch per optie) — socket, DDR, wattage, formfactor — t.o.v. de al gekozen onderdelen.
  Getoond als groene/amber/rode chip in de `SlotPicker`. Maten die per exact product verschillen
  (GPU-lengte/koelerhoogte) blijven in `BuildSummary` (daar is wél één `/api/compat`-fetch). Nieuw
  `detectBoardSocket()` in `detect.ts` (chipset→socket-map, bv. B650→AM5) zodat de socket-check ook werkt
  als de naam alleen de chipset noemt; de bestaande moederbord-hint gebruikt nu `analysis.cpu.socket`
  (betrouwbaarder). **Community-verwijzing** (`src/lib/community-links.ts`): per categorie een
  r/buildapc-zoeklink in de picker-footer — **alleen linken**, geen Reddit-content (conform deel 21).
- **Stap 4 — snellere builder** (`BuilderClient.tsx`): `SlotPicker`, `BuildWizard` (modal-only) en
  `SmartGenerate` via `next/dynamic` → kleinere initiële bundle (zoals `BuildPreview` three.js al doet).
  **Prefetch op hover/focus** van de Voeg toe/wijzig-knoppen: `preload('/api/search?cat=…', searchFetcher)`
  warmt de SWR-cache (zelfde key/fetcher; `searchFetcher` nu geëxporteerd uit `use-search.ts`) → de picker
  opent in productie bijna instant (warme edge-cache).
- **Tests**: `scripts/test-search-rank.ts` (6), `test-fuzzy.ts` (10), `test-slot-compat.ts` (14) toegevoegd
  aan `npm run test`.
- **Verificatie**: build-prerender draait `/zoeken`, `/builder` etc. server-side uit zonder fouten;
  ranking/fuzzy/slot-compat los unit-getest. **Mobiele/echte-klik-check op corebuildnl.com aanbevolen.**
**Fase 2 — site-brede laadtijden** (gemeten via `next build`-chunks; puur frontend):
- **Twee ongebruikte fonts verwijderd** (`layout.tsx`): Hanken Grotesk + Inter. Na de redesign mappen
  álle `--font-*`-tokens in `globals.css` naar Montserrat/Plex-Mono/Pixelify, dus Hanken/Inter werden
  nergens meer gebruikt maar laadden wél op elke pagina (geverifieerd: geen `--font-hanken`/`--font-inter`-
  referenties). Scheelt 2 font-families (≈7 weights) aan downloads site-breed.
- **GSAP + Lenis uit het kritieke pad** (`components/motion/SmoothScroll.tsx`): Lenis/GSAP/ScrollTrigger
  worden nu **dynamisch geïmporteerd binnen het effect** (ná hydratie, en helemaal niet bij reduced-motion)
  i.p.v. als top-level import in de root-layout. Op pagina's zonder scroll-animaties zit dit zware JS niet
  meer in de initiële bundle. (De grootste chunk blijft three.js ~888KB, maar die is al lui/alleen-builder.)
- **CDN-caching op `/api/compat`**: `s-maxage=86400` + `stale-while-revalidate` toegevoegd (maten zijn een
  pure functie van de namen + statische datasets) → herhaalde builder-checks raken de server niet meer.
- **Bewust niet**: retailer-product-images blijven `unoptimized` (proxyen via `images.remotePatterns` over
  veel wisselende retailer-CDN's is onbetrouwbaar/duur; payload is al beperkt door de 24-kaart-cap uit
  deel 19 + native lazy-loading van `next/image`).
- Verificatie: `tsc` + `eslint src` + `npm run test` + `next build` (57 pagina's) groen.

**Nog handmatig** (kan ik niet autonoom): mobiele weergave + echte-klik-flow van de builder (picker-compat-
chips, prefetch-snelheid, "bedoelde je") op een echt toestel/corebuildnl.com; Lighthouse vóór/na voor harde
cijfers.

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
  `GiastMarquee`, `GiastTerminal`, `GiastCategories` (foto-bento), ~~`GiastShowcase`~~ (verwijderd in
  deel 39), `GiastManifest`.
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
