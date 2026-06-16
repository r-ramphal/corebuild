/**
 * Unit-test voor de fuzzy-matching (src/lib/fuzzy.ts) + de fuzzy-fallback in
 * getSuggestions. Gebruik: npx tsx scripts/test-fuzzy.ts
 */
import { editDistance, fuzzyTokenMatch, closestTerm } from "../src/lib/fuzzy";
import { getSuggestions } from "../src/lib/search-suggestions";

let failed = 0;
function expect(label: string, cond: boolean) {
  if (cond) console.log(`ok   ${label}`);
  else {
    failed++;
    console.log(`FAIL ${label}`);
  }
}

// — editDistance —
expect("editDistance gelijk = 0", editDistance("ryzen", "ryzen") === 0);
expect("editDistance transpositie 'ryzne'→'ryzen' = 1", editDistance("ryzne", "ryzen") === 1);
expect("editDistance vervanging = 1", editDistance("core", "cora") === 1);

// — fuzzyTokenMatch —
expect("typefout in merknaam matcht", fuzzyTokenMatch("ryzne 7 9700x", "Ryzen 7 9700X"));
expect("geforce verschrijving matcht", fuzzyTokenMatch("gefroce rtx 4070", "GeForce RTX 4070"));
expect("modelnummer moet exact (5080 ≠ 5070)", !fuzzyTokenMatch("rtx 5080", "GeForce RTX 5070"));
expect("totaal andere term matcht niet", !fuzzyTokenMatch("toetsenbord", "GeForce RTX 4070"));

// — closestTerm —
expect(
  "closestTerm kiest de dichtstbijzijnde",
  closestTerm("ryzne 7 9700x", ["Core i5-14600K", "Ryzen 7 9700X", "RX 7800 XT"]) === "Ryzen 7 9700X"
);
expect("closestTerm = null buiten tolerantie", closestTerm("xyz", ["Ryzen 7 9700X"]) === null);

// — getSuggestions fuzzy-fallback (end-to-end op de echte index) —
const sugg = getSuggestions("ryzne 7 9700x");
expect("getSuggestions vangt de typefout op", sugg.some((x) => /ryzen 7 9700x/i.test(x.label)));

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
