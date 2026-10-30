// Génère js/data/geo.js : silhouette de chaque pays (Natural Earth, domaine public)
// et copie le drapeau correspondant (flag-icons, licence MIT) dans assets/flags/.
// Usage : cd tools && npm install && node build-geo.mjs
import fs from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath, geoConicConformal } from "d3-geo";

const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const all = feature(topo, topo.objects.countries).features;

// code ISO à 2 lettres, identifiant numérique Natural Earth, zone retenue [lonMin, latMin, lonMax, latMax]
const COUNTRIES = {
  jp: ["392", [122, 24, 150, 46]],
  fr: ["250", [-6, 41, 10, 52]],          // France métropolitaine et Corse
  us: ["840", [-126, 24, -66, 50]],       // 48 États contigus
  gb: ["826", [-9, 49, 2, 61]],
  cn: ["156", [73, 17, 136, 54]],
  kr: ["410", [124, 33, 131, 39]],
  de: ["276", [5, 47, 16, 55.5]],
  it: ["380", [6, 36, 19, 47.5]],
  es: ["724", [-10, 35, 5, 44]]           // sans les Canaries
};
const inBox = (ring, [a, b, c, d]) => ring.every(([x, y]) => x >= a && x <= c && y >= b && y <= d);

const out = {};
for (const [iso, [id, box]] of Object.entries(COUNTRIES)) {
  const f = all.find(x => x.id === id);
  if (!f) throw new Error("Pays introuvable : " + iso);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const kept = polys.filter(p => inBox(p[0], box));
  const g = { type: "Feature", geometry: { type: "MultiPolygon", coordinates: kept } };
  const proj = (iso === "us" ? geoConicConformal().parallels([33, 45]).rotate([96, 0]) : geoMercator()).fitSize([100, 100], g);
  const d = geoPath(proj).digits(1)(g);
  out[iso] = d;
  fs.copyFileSync(`node_modules/flag-icons/flags/4x3/${iso}.svg`, `../assets/flags/${iso}.svg`);
}
fs.writeFileSync("../js/data/geo.js",
  "/* Généré par tools/build-geo.mjs : silhouettes des pays (Natural Earth, domaine public), cadre 100 × 100 */\n" +
  "const GEO = " + JSON.stringify(out) + ";\n");
console.log("Pays générés :", Object.keys(out).join(", "));
