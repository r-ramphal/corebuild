"""Bouw compacte dimensie-datasets uit de BuildCores open-db.

De open-db (github.com/buildcores/buildcores-open-db, ODC-By) bevat per product
een JSON-bestand met fysieke maten. Wij destilleren daaruit drie kleine datasets
die de builder gebruikt voor compatibiliteitschecks:

  src/lib/specs/data/gpu-lengths.json  - per GPU-chipset de lengterange (mm)
  src/lib/specs/data/cases.json        - per behuizing de clearances + formfactors
  src/lib/specs/data/coolers.json      - per koeler de hoogte/socket/radiator

Verversen:
  1. Download + uitpakken (eenmalig):
       curl -sL https://codeload.github.com/buildcores/buildcores-open-db/tar.gz/refs/heads/main -o bc.tar.gz
       tar -xzf bc.tar.gz --wildcards '*/open-db/GPU/*' '*/open-db/PCCase/*' '*/open-db/CPUCooler/*'
  2. python scripts/build_dimensions.py --src <pad>/buildcores-open-db-main/open-db

Bron: BuildCores OpenDB, licentie ODC-By 1.0 (naamsvermelding vereist).
"""

import argparse
import glob
import json
import os
import re
import statistics

# open-db socket-/formfactor-notatie -> onze interne notatie (zie specs/cpu-data.ts)
_SOCKET_MAP = {
    "AM5": "AM5", "AM4": "AM4",
    "LGA 1851": "LGA1851", "LGA1851": "LGA1851",
    "LGA 1700": "LGA1700", "LGA1700": "LGA1700",
    "LGA 1200": "LGA1200", "LGA1200": "LGA1200",
}
_FORM_MAP = {
    "ATX": "ATX",
    "Micro ATX": "Micro-ATX", "Micro-ATX": "Micro-ATX", "mATX": "Micro-ATX",
    "Mini-ITX": "Mini-ITX", "Mini ITX": "Mini-ITX",
    "EATX": "E-ATX", "E-ATX": "E-ATX", "Extended ATX": "E-ATX",
}


def _norm_key(s: str) -> str:
    return " ".join(s.lower().split())


def _canon_gpu(chipset: str) -> str:
    """Canonieke chipset-sleutel: strip VRAM/GDDR-suffixen zodat varianten van
    hetzelfde model samenvallen ("RTX 3050 6 GB"/"8 GB" -> "rtx 3050"), maar
    Ti/Super/XT/GRE behouden blijven. Spiegelt de notatie van detectGpu().label.
    """
    k = _norm_key(chipset)
    k = re.sub(r"\s*\bgddr\d x?\b|\s*\bgddr\dx?\b", "", k)  # gddr6, gddr6x, gddr7
    k = re.sub(r"\s*\b\d{1,2}\s*gb\b", "", k)               # 6 gb, 8gb, 16 gb
    return _norm_key(k)


def _load(cat_dir: str):
    for f in glob.glob(os.path.join(cat_dir, "*.json")):
        try:
            with open(f, encoding="utf-8") as fh:
                yield json.load(fh)
        except (OSError, json.JSONDecodeError):
            continue


def build_gpu(src: str) -> dict:
    lengths: dict[str, list[int]] = {}
    for x in _load(os.path.join(src, "GPU")):
        chip = x.get("chipset")
        length = x.get("length") or 0
        if not chip or length <= 0:
            continue
        lengths.setdefault(_canon_gpu(chip), []).append(int(length))
    out = {}
    for key, vals in lengths.items():
        vals.sort()
        out[key] = {
            "min": vals[0],
            "max": vals[-1],
            "med": int(statistics.median(vals)),
            "n": len(vals),
        }
    return out


def build_cases(src: str) -> list:
    seen: set[str] = set()
    out = []
    for x in _load(os.path.join(src, "PCCase")):
        meta = x.get("metadata") or {}
        name = (meta.get("name") or "").strip()
        max_gpu = x.get("max_video_card_length") or 0
        max_cooler = x.get("max_cpu_cooler_height") or 0
        if not name or (max_gpu <= 0 and max_cooler <= 0):
            continue
        nk = _norm_key(name)
        if nk in seen:
            continue
        seen.add(nk)
        mobo = sorted({_FORM_MAP[f] for f in (x.get("supported_motherboard_form_factors") or []) if f in _FORM_MAP})
        rec = {"name": name, "m": meta.get("manufacturer") or ""}
        if max_gpu > 0:
            rec["maxGpu"] = int(max_gpu)
        if max_cooler > 0:
            rec["maxCooler"] = int(max_cooler)
        if x.get("max_psu_length"):
            rec["maxPsu"] = int(x["max_psu_length"])
        if x.get("form_factor"):
            rec["ff"] = x["form_factor"]
        if mobo:
            rec["mobo"] = mobo
        out.append(rec)
    return out


def build_coolers(src: str) -> list:
    seen: set[str] = set()
    out = []
    for x in _load(os.path.join(src, "CPUCooler")):
        meta = x.get("metadata") or {}
        name = (meta.get("name") or "").strip()
        height = x.get("height") or 0
        water = bool(x.get("water_cooled"))
        if not name or (height <= 0 and not water):
            continue
        nk = _norm_key(name)
        if nk in seen:
            continue
        seen.add(nk)
        sockets = sorted({_SOCKET_MAP[s] for s in (x.get("cpu_sockets") or []) if s in _SOCKET_MAP})
        rec = {"name": name, "m": meta.get("manufacturer") or ""}
        if height > 0:
            rec["h"] = int(height)
        if water:
            rec["w"] = True
        if x.get("radiator_size"):
            rec["rad"] = int(x["radiator_size"])
        if sockets:
            rec["sock"] = sockets
        out.append(rec)
    return out


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    repo = os.path.dirname(here)
    ap = argparse.ArgumentParser(description="Bouw dimensie-datasets uit de open-db")
    ap.add_argument("--src", default=os.path.join(repo, ".bc-scratch", "buildcores-open-db-main", "open-db"),
                    help="pad naar de uitgepakte open-db (map met GPU/PCCase/CPUCooler)")
    ap.add_argument("--out", default=os.path.join(repo, "src", "lib", "specs", "data"))
    args = ap.parse_args()

    if not os.path.isdir(args.src):
        raise SystemExit(f"open-db niet gevonden op {args.src} — zie de docstring voor download-instructies")
    os.makedirs(args.out, exist_ok=True)

    gpu = build_gpu(args.src)
    cases = build_cases(args.src)
    coolers = build_coolers(args.src)

    def write(name: str, data) -> None:
        path = os.path.join(args.out, name)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        print(f"  {name:<20} {len(data):5d} entries  {os.path.getsize(path)//1024} KB")

    print("Geschreven datasets:")
    write("gpu-lengths.json", gpu)
    write("cases.json", cases)
    write("coolers.json", coolers)

    # Coverage-rapport t.o.v. onze gpu-data labels (zodat de chipset-lookup raakt)
    labels_path = os.path.join(repo, ".bc-scratch", "our-labels.txt")
    if os.path.exists(labels_path):
        labels = [l.strip() for l in open(labels_path, encoding="utf-8") if l.strip()]
        miss = [l for l in labels if _norm_key(l) not in gpu]
        print(f"\nGPU-chipset coverage: {len(labels)-len(miss)}/{len(labels)} van onze labels gedekt")
        if miss:
            print("  niet gedekt:", ", ".join(miss))


if __name__ == "__main__":
    main()
