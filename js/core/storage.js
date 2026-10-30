/* ===== Sauvegarde : navigateur (automatique), fichier, code, Gist GitHub (optionnel) ===== */

const LS_KEY = "kotoba";
const LS_OLD = "dojo-jp";          // ancienne clé (version artifact « Dojo »)
const LS_GIST = "kotoba-gist";     // jeton et identifiant du Gist, gardés sur cet appareil uniquement
const GIST_DESC = "Kotoba : sauvegarde (ne pas renommer)";
const GIST_FILE = "kotoba-save.json";

const DEF = () => ({
  v: 2, xp: 0, prog: {}, weak: {}, best: {}, days: [],
  help: { ro: true, kana: true },
  settings: { sound: true, voiceRate: 1 },
  ch: { hira: {}, kata: {}, kanji: {} },
  updated: 0
});
function fix(o) {
  const d = DEF(); o = Object.assign(d, o || {});
  ["prog", "weak", "best"].forEach(k => { if (!o[k] || typeof o[k] !== "object") o[k] = {}; });
  if (!Array.isArray(o.days)) o.days = [];
  o.help = Object.assign({ ro: true, kana: true }, o.help || {});
  o.settings = Object.assign({ sound: true, voiceRate: 1 }, o.settings || {});
  o.ch = Object.assign({ hira: {}, kata: {}, kanji: {} }, o.ch || {});
  delete o.done;
  return o;
}

let store = DEF();
try {
  const raw = localStorage.getItem(LS_KEY) || localStorage.getItem(LS_OLD);
  store = fix(JSON.parse(raw || "{}"));
} catch (e) {}

function localSave() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {} }
function save() { store.updated = Date.now(); localSave(); gist.queue(); }

/* Série de jours (streak) */
const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function touchDay() { const k = dayKey(); if (!store.days.includes(k)) { store.days.push(k); store.days = store.days.slice(-400); } }
function streak() {
  const set = new Set(store.days); let n = 0; const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);   // la série tient jusqu'à la fin de la journée
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* Code et fichier de sauvegarde */
const encodeSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(store))));
function decodeSave(txt) {
  txt = String(txt).trim();
  const o = txt.startsWith("{") ? JSON.parse(txt) : JSON.parse(decodeURIComponent(escape(atob(txt))));
  if (!o || typeof o !== "object" || !("xp" in o)) throw new Error("format");
  return fix(o);
}
function restore(o) { store = fix(o); save(); gist.flush(); }
function downloadSave() {
  const blob = new Blob([JSON.stringify(store, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kotoba-sauvegarde-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* Synchronisation via un Gist GitHub privé */
const gist = (() => {
  let cfg = null, timer = null, busy = false, again = false;
  const st = { state: "off", msg: "" };
  try { cfg = JSON.parse(localStorage.getItem(LS_GIST) || "null"); } catch (e) {}
  const keep = () => { try { cfg ? localStorage.setItem(LS_GIST, JSON.stringify(cfg)) : localStorage.removeItem(LS_GIST); } catch (e) {} };
  const api = async (path, opt = {}) => {
    const r = await fetch("https://api.github.com" + path, Object.assign({}, opt, {
      headers: Object.assign({ "Authorization": "Bearer " + cfg.token, "Accept": "application/vnd.github+json" }, opt.body ? { "Content-Type": "application/json" } : {})
    }));
    if (r.status === 401) throw new Error("Jeton refusé : vérifie qu'il est valide et qu'il a le droit « gist ».");
    if (!r.ok) throw new Error("GitHub a répondu " + r.status + ".");
    return r.json();
  };
  const set = (state, msg) => { st.state = state; st.msg = msg || ""; if (typeof onSyncChange === "function") onSyncChange(); };

  async function findOrCreate() {
    if (cfg.id) return;
    const list = await api("/gists?per_page=100");
    const g = list.find(x => x.description === GIST_DESC);
    if (g) { cfg.id = g.id; keep(); return; }
    const made = await api("/gists", { method: "POST", body: JSON.stringify({ description: GIST_DESC, public: false, files: { [GIST_FILE]: { content: JSON.stringify(store) } } }) });
    cfg.id = made.id; keep();
  }
  async function pull() {
    const g = await api("/gists/" + cfg.id);
    const f = g.files && g.files[GIST_FILE];
    if (!f) return false;
    let content = f.content;
    if (f.truncated && f.raw_url) content = await (await fetch(f.raw_url)).text();
    const remote = fix(JSON.parse(content));
    if ((remote.updated || 0) > (store.updated || 0)) { store = remote; localSave(); return true; }
    return false;
  }
  async function flush() {
    if (!cfg || !cfg.id) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      await api("/gists/" + cfg.id, { method: "PATCH", body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(store) } } }) });
      set("on", "Synchronisé à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) { set("error", e.message); }
    busy = false;
    if (again) { again = false; flush(); }
  }
  return {
    st,
    get connected() { return !!(cfg && cfg.token); },
    queue() { if (!cfg || !cfg.id) return; clearTimeout(timer); timer = setTimeout(flush, 4000); },
    flush,
    // Au démarrage : récupère la sauvegarde la plus récente
    async init() {
      if (!cfg || !cfg.token) return;
      set("busy", "Synchronisation…");
      try {
        await findOrCreate();
        const changed = await pull();
        if (!changed) await flush(); else set("on", "Sauvegarde récupérée depuis GitHub");
        if (changed && typeof L !== "undefined" && !L) show();
      } catch (e) { set("error", e.message); }
    },
    async connect(token) {
      cfg = { token: token.trim(), id: null }; keep();
      await this.init();
      if (st.state === "error") { const m = st.msg; cfg = null; keep(); set("off", m); throw new Error(m); }
    },
    disconnect() { cfg = null; keep(); set("off", "Synchronisation désactivée sur cet appareil."); }
  };
})();
// Envoie les dernières modifications quand on quitte l'onglet
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") gist.flush(); });
