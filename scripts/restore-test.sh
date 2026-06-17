#!/usr/bin/env bash
#
# Restore-drill: haalt de laatste versleutelde back-up uit R2, ontsleutelt 'm met
# je privé age-sleutel, herstelt naar een WEGWERP-database en checkt rij-aantallen.
# Een onbeproefde back-up is geen back-up — draai dit periodiek (bv. per kwartaal)
# en documenteer datum + duur (RTO).
#
# Vereist: aws, age, pg_restore, psql.
# Env:
#   R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
#   AGE_KEY_FILE          pad naar je privé age-sleutel (offline bewaard)
#   RESTORE_DATABASE_URL  LEGE wegwerp-DB (bv. een Neon-branch of lokale Postgres)
#
# Gebruik:
#   AGE_KEY_FILE=~/corebuild-age.key RESTORE_DATABASE_URL=postgres://... \
#     R2_BUCKET=... R2_ENDPOINT=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
#     bash scripts/restore-test.sh
set -euo pipefail

: "${RESTORE_DATABASE_URL:?zet RESTORE_DATABASE_URL naar een WEGWERP-DB}"
: "${AGE_KEY_FILE:?zet AGE_KEY_FILE naar je privé age-sleutel}"
: "${R2_BUCKET:?}" : "${R2_ENDPOINT:?}"
export AWS_DEFAULT_REGION=auto

# Veiligheidsrem: weiger te herstellen naar de productie-DB.
case "$RESTORE_DATABASE_URL" in
  *ep-rapid-math-a2p24w0q*)
    echo "✗ RESTORE_DATABASE_URL wijst naar de PRODUCTIE-host — geweigerd." >&2
    exit 1 ;;
esac

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

echo "→ Laatste back-up zoeken in s3://$R2_BUCKET/db/ ..."
latest=$(aws s3 ls "s3://$R2_BUCKET/db/" --endpoint-url "$R2_ENDPOINT" | sort | tail -1 | awk '{print $4}')
[ -n "$latest" ] || { echo "✗ Geen back-ups gevonden." >&2; exit 1; }
echo "  $latest"

aws s3 cp "s3://$R2_BUCKET/db/$latest" "$work/$latest" --endpoint-url "$R2_ENDPOINT"
age -d -i "$AGE_KEY_FILE" -o "$work/dump.pgc" "$work/$latest"

echo "→ Herstellen naar de wegwerp-DB ..."
pg_restore --clean --if-exists --no-owner --no-privileges -d "$RESTORE_DATABASE_URL" "$work/dump.pgc"

echo "→ Rij-aantallen (sanity check):"
psql "$RESTORE_DATABASE_URL" -c \
  "SELECT 'listings' AS tabel, count(*) FROM listings
   UNION ALL SELECT 'user', count(*) FROM \"user\"
   UNION ALL SELECT 'builds', count(*) FROM builds
   UNION ALL SELECT 'price_history', count(*) FROM price_history
   ORDER BY 1;"

echo "✓ Restore-drill geslaagd ($latest)."
