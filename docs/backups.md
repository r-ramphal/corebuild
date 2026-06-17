# Back-ups & restore (CoreBuild)

Twee lagen:

1. **Neon PITR** (ingebouwd) — Point-in-Time-Recovery binnen het retentievenster. Snel herstel bij
   per-ongeluk-verwijderen/foute migratie. Geen externe bescherming bij account-/providerverlies.
2. **Externe versleutelde back-up** (deze setup) — dagelijkse `pg_dump`, versleuteld met **age**, opgeslagen
   in een **immutable Cloudflare R2-bucket** (Object Lock). Verdediging tegen account-compromise, ransomware
   en provideruitval. Workflow: [`.github/workflows/backup.yml`](../.github/workflows/backup.yml).

> De back-up-workflow draait al, maar **no-opt** netjes tot de secrets hieronder gezet zijn.

## Eenmalige setup

### 1. age-sleutelpaar
```bash
age-keygen -o corebuild-age.key      # bewaar dit bestand OFFLINE (niet in de repo!)
# Output toont: "Public key: age1...."  ← dat is AGE_PUBLIC_KEY
```
De **publieke** sleutel versleutelt (mag in CI). De **privé**-sleutel (`corebuild-age.key`) heb je alleen
nodig om te herstellen — bewaar 'm in een password manager / offline. Kwijt = back-ups onleesbaar.

### 2. Cloudflare R2-bucket
- Maak een bucket, bv. `corebuild-backups`.
- Zet **Object Lock** aan (Compliance/Governance) met een default-retentie (bv. 30 dagen) → uploads zijn
  immutable, niet te overschrijven/verwijderen binnen het venster (anti-ransomware).
- Optioneel een lifecycle-regel om objecten na X dagen op te ruimen.
- Maak een **R2 API-token** met lees/schrijf op deze bucket → access key id + secret.
- Endpoint: `https://<accountid>.r2.cloudflarestorage.com`.

### 3. GitHub repo-secrets
Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Waarde |
|---|---|
| `BACKUP_DATABASE_URL` | Neon **unpooled** owner-URL (Vercel-env `STORAGE_DATABASE_URL_UNPOOLED`) — pg_dump gebruikt de directe endpoint, niet de pooler |
| `AGE_PUBLIC_KEY` | de `age1...` publieke sleutel |
| `R2_ACCESS_KEY_ID` | R2 access key id |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | `corebuild-backups` |

> Gebruik de **owner**-rol (`neondb_owner`) voor de dump (volledige leesrechten op schema + data), niet de
> least-privilege app-rol. Het secret leeft alleen in GitHub Actions.

### 4. Eerste run testen
Actions → **Encrypted DB Backup** → *Run workflow*. Check dat `s3://<bucket>/db/corebuild-<ts>.pgc.age`
verschijnt.

## Restore-drill (periodiek — kwartaal)

Een onbeproefde back-up is geen back-up. Herstel naar een **wegwerp-DB** (Neon-branch of lokale Postgres),
nooit productie:

```bash
AGE_KEY_FILE=~/corebuild-age.key \
RESTORE_DATABASE_URL=postgres://...wegwerp-db... \
R2_BUCKET=corebuild-backups \
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com \
R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
bash scripts/restore-test.sh
```

Het script ([`scripts/restore-test.sh`](../scripts/restore-test.sh)) haalt de laatste back-up op,
ontsleutelt, herstelt en print rij-aantallen. Het **weigert** te herstellen naar de productie-host.
Noteer per drill: datum, duur (≈ RTO), uitkomst — als compliance-bewijs.

## RPO / RTO

- **RPO** (max dataverlies): ~24u via deze dump (dagelijks) of minuten via Neon PITR.
- **RTO** (hersteltijd): meet je tijdens de drill. Verhoog de dump-frequentie (cron in `backup.yml`) als je
  RPO strakker moet.
