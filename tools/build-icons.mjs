// Copie les illustrations Fluent Emoji (Microsoft, licence MIT) utilisées par les thèmes
// dans assets/img/ et génère js/data/icons.js (emoji -> fichier).
// Usage : node build-icons.mjs <chemin vers un clone de microsoft/fluentui-emoji>
import fs from "node:fs";
import path from "node:path";

const repo = process.argv[2];
if (!repo) { console.error("Indique le chemin du dépôt fluentui-emoji."); process.exit(1); }
const src = fs.readFileSync("../js/data/themes.js", "utf8");
const glyphs = [...new Set([...src.matchAll(/"e:([^"]+)"/g)].map(m => m[1]))];
const strip = s => s.replace(/️/g, "");
const index = {};
for (const dir of fs.readdirSync(path.join(repo, "assets"))) {
  const meta = path.join(repo, "assets", dir, "metadata.json");
  if (!fs.existsSync(meta)) continue;
  const m = JSON.parse(fs.readFileSync(meta, "utf8"));
  index[strip(m.glyph)] = dir;
}
fs.mkdirSync("../assets/img", { recursive: true });
const map = {}, missing = [], need = [];
for (const g of glyphs) {
  const dir = index[strip(g)];
  if (!dir) { missing.push(g); continue; }
  const base = path.join(repo, "assets", dir);
  const flat = fs.existsSync(path.join(base, "Flat")) ? path.join(base, "Flat") : path.join(base, "Default", "Flat");
  const slug = dir.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!fs.existsSync(flat)) { need.push(dir); continue; }
  const file = fs.readdirSync(flat).find(f => f.endsWith(".svg"));
  fs.copyFileSync(path.join(flat, file), `../assets/img/${slug}.svg`);
  map[g] = slug;
}
fs.writeFileSync("../js/data/icons.js",
  "/* Généré par tools/build-icons.mjs : illustrations Fluent Emoji (Microsoft, licence MIT) */\nconst ICONS = " + JSON.stringify(map) + ";\n");
if (need.length) fs.writeFileSync("need-dirs.txt", need.join("\n"));
console.log(Object.keys(map).length, "illustrations,", need.length, "dossiers à récupérer, manquants :", missing.join(" "));
