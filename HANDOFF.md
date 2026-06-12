# CoreBuild — Project Handoff

> Lees dit bestand aan het begin van elke sessie. Werk het bij aan het einde.

## Overzicht

Dutch-market PC-parts builder (helemaal opnieuw gebouwd, schone start t.o.v. CompuNL).
Gebruikers browsen componenten + prijzen, bouwen een PC, slaan builds op en delen ze.

- **Repo:** https://github.com/r-ramphal/corebuild (branch `master`)
- **Live:** https://corebuild-ashy.vercel.app (Vercel, auto-deploy van `master`)
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
- Root layout met ThemeProvider (dark mode ready)
- GitHub Actions CI + Vercel deployment

### Prijsvergelijking (live)
- `src/lib/amazon.ts` — Amazon PA API 5.0 (AWS4-signing, `amazon.nl`)
- `src/lib/scrapers/megekko.ts` / `azerty.ts` / `alternate.ts` — HTML-scrapers
- `/api/search?q=` — parallel fanout naar alle 4 bronnen, sorteert op prijs
- `SearchForm` + `PriceList` UI — zoekbalk + resultatenlijst met "Goedkoopst" badge
- **Amazon keys nog niet ingesteld** — aanvraag loopt (site: corebuild-ashy.vercel.app)

### Nog te bouwen
- [ ] Amazon API keys instellen op Vercel (na goedkeuring Associates)
- [ ] Scrapers testen + selectors bijstellen per retailer
- [ ] Navbar + dark mode toggle
- [ ] Productdetailpagina
- [ ] Builder (component selectie + prijstotaal)
- [ ] Auth + opgeslagen builds (Convex)

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
| Productie | https://corebuild-ashy.vercel.app | Vercel (auto-deploy `master`) |
| Convex dev | nog niet aangemaakt | — |

**Vercel env vars instellen** (na Amazon Associates goedkeuring):
1. Ga naar https://vercel.com/r-ramphals-projects/corebuild/settings/environment-variables
2. Voeg toe voor **Production**:
   - `AMAZON_ACCESS_KEY`
   - `AMAZON_SECRET_KEY`
   - `AMAZON_ASSOCIATE_TAG`
