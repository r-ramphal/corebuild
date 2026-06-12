# CoreBuild Python-scrapers

Vullen de centrale `listings`-tabel (Neon Postgres) met actuele prijzen.
De Next.js-site serveert deze rijen direct uit de database (TTL 30 min per zoekterm).

## Setup (eenmalig)

```powershell
cd scrapers
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

`DATABASE_URL` wordt gelezen uit de `.env.local` in de projectroot.

## Gebruik

```powershell
# Eén zoekterm, alle 5 retailers
.\.venv\Scripts\python refresh.py --query "rtx 4070"

# Alle populaire zoektermen (±44 stuks, duurt 15-25 min)
.\.venv\Scripts\python refresh.py --all

# Subset van retailers, beperkt aantal zoektermen, eigen delay
.\.venv\Scripts\python refresh.py --all --retailers megekko,azerty,alternate --limit 10 --delay 3
```

## Opbouw

| Bestand | Doel |
|---|---|
| `refresh.py` | CLI-runner: scrape → schrijf naar database |
| `corebuild_scrapers/db.py` | Postgres-verbinding + `save_listings` (vervang per query+retailer) |
| `corebuild_scrapers/queries.py` | Populaire zoektermen per categorie (spiegel van `src/lib/categories.ts`) |
| `corebuild_scrapers/retailers/` | Eén module per retailer; elke `search(query)` geeft een lijst dicts |
| `corebuild_scrapers/retailers/common.py` | HTTP via curl_cffi (Chrome-impersonatie) + prijs-parsing |

## Belangrijk

- **curl_cffi met `impersonate="chrome"`** is essentieel: Amazon (en mogelijk Bol)
  blokkeren de standaard requests-library op TLS-fingerprint.
- **Bol en Amazon werken alleen vanaf residentiële IP's** (thuis). Vanaf
  datacenter-IP's (GitHub Actions, Vercel) worden ze geblokkeerd — daarvoor
  draait `.github/workflows/scrape.yml` alleen megekko/azerty/alternate.
- Wees beleefd: standaard 2s delay tussen requests, max 10 resultaten per retailer.
- Rijen krijgen `source='python'`; de site toont ze als gewone (niet-demo) data.

## Automatisch verversen

- **GitHub Actions** (`.github/workflows/scrape.yml`): elke 6 uur
  megekko/azerty/alternate voor alle populaire zoektermen.
  Vereist repo-secret `DATABASE_URL` (Settings → Secrets and variables → Actions).
- **Lokaal (Bol + Amazon erbij)**: draai handmatig of via Windows Taakplanner:
  `schtasks /create /tn CoreBuildScrape /tr "C:\...\scrapers\.venv\Scripts\python.exe C:\...\scrapers\refresh.py --all" /sc daily /st 09:00`
