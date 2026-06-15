# Databronnen — dimensie-datasets

`gpu-lengths.json`, `cases.json` en `coolers.json` zijn afgeleid van de
**BuildCores OpenDB** (https://github.com/buildcores/buildcores-open-db),
beschikbaar onder de **Open Data Commons Attribution License (ODC-By 1.0)**
(https://opendatacommons.org/licenses/by/1-0/).

Naamsvermelding staat ook zichtbaar op de site (`/over`, sectie "Databronnen").

## Verversen

Gegenereerd door `scripts/build_dimensions.py`. Om bij te werken:

```sh
# 1. open-db ophalen (alleen de benodigde categorieën)
curl -sL https://codeload.github.com/buildcores/buildcores-open-db/tar.gz/refs/heads/main -o bc.tar.gz
tar -xzf bc.tar.gz --wildcards '*/open-db/GPU/*' '*/open-db/PCCase/*' '*/open-db/CPUCooler/*'

# 2. datasets regenereren
python scripts/build_dimensions.py --src <pad>/buildcores-open-db-main/open-db
```

De velden zijn bewust compact gehouden (alleen wat de compat-checks nodig hebben):
- GPU: per chipset de lengte-range `{min,max,med,n}` (mm)
- Behuizing: `maxGpu`, `maxCooler`, `maxPsu` (mm), `ff`, ondersteunde `mobo`-formfactors
- Koeler: hoogte `h` (mm), `w` (waterkoeling), `rad` (radiator-mm), `sock` (sockets)

## Moederbord-referentie (`motherboards.json`)

Afgeleid van de **Pawikoski PC-Components** dataset
(https://github.com/Pawikoski/PC-Components, 2021-snapshot). Feitelijke
socket/chipset-gegevens, gefilterd op de sockets die de builder herkent
(`detect.ts`). We tonen vooral de **chipsets** per socket (nog courant als
zoekterm); 2021-board-SKU's zijn grotendeels EOL. Regenereren:

```sh
git clone https://github.com/Pawikoski/PC-Components.git
npx tsx scripts/build_motherboards.ts PC-Components/motherboards.json
```
