/* ===== Écrans principaux et navigation ===== */
const VERSION = "0.3.0";
const REPO_URL = "https://github.com/JuloDurden/kotoba";

const UNITS = [
  { t: "Les bases", d: "Compter, saluer, se repérer dans le temps", hue: "u1", th: ["nombres", "salutations", "expressions", "jours", "heures"] },
  { t: "Le quotidien", d: "Décrire, parler de soi, de ses proches et de chez soi", hue: "u2", th: ["couleurs", "saisons", "frequence", "famille", "corps", "nourriture", "maison"] },
  { t: "Sortir et partager", d: "Ville, tenues, voyages et loisirs", hue: "u3", th: ["lieux", "ville", "vetements", "transports", "pays", "arts", "sports"] },
  { t: "Culture", d: "Proverbes et expressions imagées", hue: "u4", th: ["proverbes"] }
];
const unitOf = th => UNITS.find(u => u.th.includes(th)) || UNITS[0];

/* --- Routeur (adresse #vue) --- */
let SCREEN = { name: "parcours" };
function go(h) { if (location.hash === h) route(); else location.hash = h; }
function show() { route(); }
function home() { go("#parcours"); }
function path(th) { go("#theme-" + th); }
function writing(s) { go("#caracteres-" + s); }
function route() {
  stopTimer(); L = null;
  document.body.classList.remove("in-lesson");
  const h = (location.hash || "#parcours").slice(1);
  if (h.startsWith("theme-") && DATA[h.slice(6)]) { SCREEN = { name: "theme", th: h.slice(6) }; viewTheme(SCREEN.th); }
  else if (h.startsWith("caracteres")) { const s = h.split("-")[1]; SCREEN = { name: "chars", s: SCR[s] ? s : "hira" }; viewChars(SCREEN.s); }
  else if (h.startsWith("fiche-") && DATA[h.slice(6)]) { SCREEN = { name: "fiche", th: h.slice(6) }; viewFiche(SCREEN.th); }
  else if (h === "revisions") { SCREEN = { name: "revisions" }; viewRevisions(); }
  else if (h === "profil") { SCREEN = { name: "profil" }; viewProfil(); }
  else { SCREEN = { name: "parcours" }; viewParcours(); }
  header(); navState(); window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

function header() {
  const s = streak();
  $("#hdr").innerHTML = `<a class="logo" href="#parcours"><span class="lk">言葉</span><span class="lt"><b>Kotoba</b><small>Dojo de japonais</small></span></a>
   <div class="chips"><span class="chip fire" title="Série de jours">${s ? "🔥" : "○"} ${s} j</span><span class="chip xp" title="Points d'expérience">${store.xp} XP</span></div>`;
}
function navState() {
  const cur = { parcours: "parcours", theme: "parcours", fiche: "revisions", chars: "caracteres", revisions: "revisions", profil: "profil" }[SCREEN.name];
  document.querySelectorAll("#nav a").forEach(a => a.setAttribute("aria-current", a.dataset.v === cur ? "page" : "false"));
}

/* --- Parcours --- */
function nextLesson() {
  const all = UNITS.flatMap(u => u.th);
  const started = all.find(t => { const p = store.prog[t] || 0; return p > 0 && p < lessonsOf(t).length; });
  const th = started || all.find(t => !(store.prog[t] || 0));
  if (!th) return null;
  const ls = lessonsOf(th), i = Math.min(store.prog[th] || 0, ls.length - 1);
  return { th, i, lesson: ls[i] };
}
function themeCard(t) {
  const d = DATA[t], tot = lessonsOf(t).length, n = Math.min(store.prog[t] || 0, tot), u = unitOf(t);
  return `<a class="tcard ${u.hue}" href="#theme-${t}"><span class="tbadge">${d.k}</span><span class="tinfo"><b>${d.t}</b><span class="d">${d.d}</span>
    <span class="meter"><div style="width:${n / tot * 100}%"></div></span><span class="d">${n === tot ? "Terminé" : `${n} / ${tot} leçons`}${n >= GAME_AT ? " · jeux ouverts" : ""}</span></span></a>`;
}
function viewParcours() {
  const nx = nextLesson();
  $("#app").innerHTML = `
   ${nx ? `<section class="hero ${unitOf(nx.th).hue}"><span class="tbadge big">${DATA[nx.th].k}</span><div class="hinfo"><span class="eyebrow">${store.prog[nx.th] ? "Reprendre" : "Commencer"}</span><b>${DATA[nx.th].t}</b><span>Leçon ${nx.i + 1} · ${esc(nx.lesson.label)}</span></div><button class="main" id="cont">C'est parti</button></section>` : `<section class="hero u1"><div class="hinfo"><b>Tous les thèmes sont terminés</b><span>Les jeux et les révisions t'attendent.</span></div></section>`}
   ${UNITS.map((u, i) => `<section class="unit"><div class="uhead ${u.hue}"><span class="unum">Unité ${i + 1}</span><h2>${u.t}</h2><p>${u.d}</p></div><div class="tlist">${u.th.map(themeCard).join("")}</div></section>`).join("")}
   <div class="spacer"></div>`;
  if (nx) $("#cont").onclick = () => start({ mode: "theme", th: nx.th, idx: nx.i, lesson: nx.lesson });
}

/* --- Chemin d'un thème (en zigzag) --- */
function viewTheme(th) {
  const d = DATA[th], ls = lessonsOf(th), p = store.prog[th] || 0, best = store.best[th] || {}, u = unitOf(th), open = p >= GAME_AT;
  const X = [0, 54, 84, 54, 0, -54, -84, -54];
  const icon = (l, st, i) => st === "done" ? "✓" : l.kind === "review" ? "復" : l.kind === "master" ? "★" : i + 1;
  $("#app").innerHTML = `<a class="back" href="#parcours">← Parcours</a>
   <section class="thead ${u.hue}"><span class="tbadge big">${d.k}</span><div><span class="eyebrow">${u.t}</span><h2>${d.t}</h2><div class="small">${Math.min(p, ls.length)} / ${ls.length} leçons terminées</div></div><a class="btn fbtn" href="#fiche-${th}">Fiche</a></section>
   <div class="zz ${u.hue}">${ls.map((l, i) => {
     const st = i < p ? "done" : i === p ? "cur" : "lock";
     return `<div class="zrow" style="--x:${X[i % X.length]}px">${st === "cur" ? `<span class="bubble-go">${p ? "Continuer" : "Commencer"}</span>` : ""}
       <button class="zn ${st} ${l.kind}" data-i="${i}" ${st === "lock" ? "disabled" : ""} aria-label="${esc(l.label)}">${icon(l, st, i)}</button>
       <span class="zl"><b>${esc(l.label)}</b><span>${esc(l.sub)}</span></span></div>`;
   }).join("")}</div>
   <h3 class="sect">Jeux ${open ? "" : `· ouverts après ${GAME_AT} leçons`}</h3>
   <div class="games">
    <button class="gcard" data-g="endless" ${open ? "" : "disabled"}><span class="gi">♥♥♥</span><b>Mode infini</b><span>3 vies, questions sans fin</span><span class="rec">${best.inf ? `Record : ${best.inf}` : "Pas encore de record"}</span></button>
    <button class="gcard" data-g="chrono" ${open ? "" : "disabled"}><span class="gi">⏱ 60 s</span><b>Contre-la-montre</b><span>Un maximum de bonnes réponses</span><span class="rec">${best.chr ? `Record : ${best.chr}` : "Pas encore de record"}</span></button>
   </div><div class="spacer"></div>`;
  $("#app").querySelectorAll(".zn").forEach(b => b.onclick = () => { if (!b.disabled) start({ mode: "theme", th, idx: +b.dataset.i, lesson: ls[+b.dataset.i] }); });
  $("#app").querySelectorAll(".gcard").forEach(b => b.onclick = () => { if (!b.disabled) start({ mode: b.dataset.g, th }); });
}

/* --- Caractères --- */
function viewChars(s) {
  const S = SCR[s], k = isKanji(s);
  const introN = S.list.filter(x => store.ch[s][x.c] !== undefined).length, left = S.list.length - introN;
  const cell = x => {
    if (!x) return `<div class="kc empty"></div>`;
    const sc = store.ch[s][x.c], seen = sc !== undefined;
    return `<button class="kc ${sc >= 5 ? "full" : ""} ${seen ? "seen" : ""}" data-c="${esc(x.c)}" title="${esc(k ? x.fr : x.ro)}"><b>${esc(x.c)}</b><i>${esc(k ? x.fr : x.ro)}</i><span class="mb"><s style="width:${seen ? Math.max(8, sc / 5 * 100) : 0}%"></s></span></button>`;
  };
  $("#app").innerHTML = `
   <div class="tabs" role="tablist">${["hira", "kata", "kanji"].map(x => `<a role="tab" href="#caracteres-${x}" aria-selected="${x === s}">${SCR[x].name}</a>`).join("")}</div>
   <details class="explain"><summary>Hiragana, katakana, kanji : à quoi servent-ils ?</summary>
    <p><b>Hiragana</b> <span class="jx">ひらがな</span> : l'écriture de base. Mots japonais, terminaisons des verbes et particules (<span class="jx">は を に</span>). Ex. : <span class="jx">ありがとう</span>.</p>
    <p><b>Katakana</b> <span class="jx">カタカナ</span> : les mêmes sons, en traits plus anguleux. Mots étrangers et noms propres. Ex. : <span class="jx">コーヒー</span> (café), <span class="jx">テレビ</span> (télé).</p>
    <p><b>Kanji</b> <span class="jx">漢字</span> : caractères venus du chinois, qui portent un sens. Un kanji a souvent plusieurs lectures : <span class="jx">日</span> = jour, soleil (nichi, hi). Une phrase mélange les trois : <span class="jx">私はコーヒーを飲みます</span>.</p>
   </details>
   <div class="wtitle"><h2>Apprends les ${S.name.toLowerCase()} !</h2><div class="small">${introN} / ${S.list.length} vus · touche un caractère pour l'écouter</div></div>
   <div class="wbtns"><button class="main" id="knew" ${left ? "" : "disabled"}>${left ? "Nouveaux caractères" : "Tout est vu"}</button><button class="main sec" id="krev" ${introN >= 4 ? "" : "disabled"}>Réviser</button></div>
   ${S.secs.map(sec => `${sec.t ? `<div class="ksect">${sec.t}</div><p class="ksub">${sec.sub}</p>` : ""}<div class="kgrid ${sec.cols === 3 ? "c3" : sec.cols === 4 ? "c4" : ""}">${sec.rows.flat().map(cell).join("")}</div>`).join("")}
   <p class="small" style="margin:18px 0 0">Le tracé est noté sur la ressemblance avec le modèle. L'ordre et le sens des traits ne sont pas encore vérifiés.</p><div class="spacer"></div>`;
  $("#app").querySelectorAll(".kc[data-c]").forEach(b => b.onclick = () => { const x = S.list.find(y => y.c === b.dataset.c); if (x) speak(cSay(s, x)); });
  $("#knew").onclick = () => start({ mode: "knew", s });
  $("#krev").onclick = () => start({ mode: "krev", s });
}

/* --- Révisions et jeux --- */
function viewRevisions() {
  const weakN = Object.values(store.weak).filter(c => c > 0).length;
  const anyDone = TH.some(t => (store.prog[t] || 0) > 0);
  const games = TH.filter(t => (store.prog[t] || 0) >= GAME_AT);
  $("#app").innerHTML = `<h2 class="vtitle">Révisions</h2>
   <div class="rgrid">
    <button class="rcard" id="mix" ${anyDone ? "" : "disabled"}><span class="rk">混</span><b>Révision mixte</b><span>${anyDone ? "12 exercices sur tout ce que tu as vu" : "Termine une première leçon"}</span></button>
    <button class="rcard" id="weak" ${weakN ? "" : "disabled"}><span class="rk bad">弱</span><b>Mes points faibles</b><span>${weakN ? `${weakN} mot${weakN > 1 ? "s" : ""} à retravailler` : "Rien pour l'instant"}</span></button>
   </div>
   <h3 class="sect">Fiches récapitulatives</h3>
   <div class="flist">${UNITS.flatMap(u => u.th).map(t => { const f = ficheStat(t); return `<a class="fcard ${unitOf(t).hue}" href="#fiche-${t}"><span class="tbadge">${DATA[t].k}</span><span class="ginfo"><b>${DATA[t].t}</b><span class="meter"><div style="width:${f.seen / f.total * 100}%"></div></span><span class="d">${f.seen} / ${f.total} mots · ${f.mast} maîtrisés</span></span></a>`; }).join("")}</div>
   <h3 class="sect">Jeux</h3>
   ${games.length ? `<div class="glist">${games.map(t => { const b = store.best[t] || {}; return `<div class="grow ${unitOf(t).hue}"><span class="tbadge">${DATA[t].k}</span><span class="ginfo"><b>${DATA[t].t}</b><span class="d">Records : ♥ ${b.inf || 0} · ⏱ ${b.chr || 0}</span></span><button class="btn" data-g="endless" data-t="${t}" aria-label="Mode infini">♥ Infini</button><button class="btn" data-g="chrono" data-t="${t}" aria-label="Contre-la-montre">⏱ Chrono</button></div>`; }).join("")}</div>`
     : `<div class="empty">Les jeux d'un thème s'ouvrent après ${GAME_AT} leçons terminées.</div>`}
   <div class="spacer"></div>`;
  $("#mix").onclick = () => start({ mode: "mix" });
  $("#weak").onclick = () => start({ mode: "weak" });
  $("#app").querySelectorAll(".grow .btn").forEach(b => b.onclick = () => start({ mode: b.dataset.g, th: b.dataset.t }));
}

/* --- Profil : statistiques, réglages, sauvegarde --- */
function syncLine() {
  const s = gist.st;
  if (!gist.connected) return `<span class="dot off"></span>Non connectée${s.msg ? ` · ${esc(s.msg)}` : ""}`;
  return `<span class="dot ${s.state === "error" ? "err" : s.state === "busy" ? "busy" : "on"}"></span>${esc(s.msg || "Connectée")}`;
}
function onSyncChange() { const e = $("#gstat"); if (e) e.innerHTML = syncLine(); if (SCREEN.name !== "profil" && !L) header(); }
function viewProfil() {
  const lessons = TH.reduce((a, t) => a + Math.min(store.prog[t] || 0, lessonsOf(t).length), 0);
  const totalL = TH.reduce((a, t) => a + lessonsOf(t).length, 0);
  const chars = ["hira", "kata", "kanji"].reduce((a, s) => a + Object.keys(store.ch[s]).length, 0);
  const weakN = Object.values(store.weak).filter(c => c > 0).length;
  $("#app").innerHTML = `<h2 class="vtitle">Profil</h2>
   <div class="stats4">
    <div class="stat"><b>${streak()}</b><span>Jours de suite</span></div>
    <div class="stat"><b>${store.xp}</b><span>XP</span></div>
    <div class="stat"><b>${lessons}<small> / ${totalL}</small></b><span>Leçons</span></div>
    <div class="stat"><b>${chars}</b><span>Caractères vus</span></div>
   </div>
   <h3 class="sect">Réglages</h3>
   <div class="panel">
    <label class="row"><span>Kana sous les kanji</span><input type="checkbox" id="s-kana" ${store.help.kana ? "checked" : ""}></label>
    <label class="row"><span>Rōmaji</span><input type="checkbox" id="s-ro" ${store.help.ro ? "checked" : ""}></label>
    <label class="row"><span>Effets sonores</span><input type="checkbox" id="s-snd" ${store.settings.sound ? "checked" : ""}></label>
    <label class="row"><span>Vitesse de la voix</span><select id="s-rate">${[[.8, "Lente"], [1, "Normale"], [1.2, "Rapide"]].map(([v, n]) => `<option value="${v}" ${store.settings.voiceRate == v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <div class="row"><span>Voix japonaise<br><small class="small">${jaVoice ? "Disponible" : "Aucune voix japonaise sur cet appareil"}</small></span><button class="btn" id="t-voice" ${jaVoice ? "" : "disabled"}>Tester</button></div>
    <div class="row"><span>Micro et prononciation<br><small class="small" id="micmsg">${SR.ok ? "Reconnaissance vocale disponible" : "Non disponible dans ce navigateur (Chrome, Edge ou Safari requis)"}</small></span><button class="btn" id="t-mic" ${SR.ok ? "" : "disabled"}>Tester</button></div>
   </div>
   <h3 class="sect">Sauvegarde</h3>
   <div class="panel">
    <p class="small">Ta progression est enregistrée automatiquement dans ce navigateur. Pour la retrouver ailleurs, utilise un fichier, un code ou la synchronisation GitHub.</p>
    <div class="btnrow"><button class="btn pri" id="exp-file">Télécharger un fichier</button><label class="btn" for="imp-file">Importer un fichier</label><input type="file" id="imp-file" accept=".json,application/json" hidden></div>
    <div class="btnrow"><button class="btn" id="exp-code">Copier un code</button></div>
    <textarea id="imp-code" placeholder="Colle ici un code ou le contenu d'un fichier de sauvegarde"></textarea>
    <div class="btnrow"><button class="btn" id="do-imp">Restaurer ce code</button><span class="small" id="impmsg" aria-live="polite"></span></div>
   </div>
   <h3 class="sect">Synchronisation entre navigateurs</h3>
   <div class="panel">
    <p class="small">Kotoba peut garder ta sauvegarde dans un Gist <b>privé</b> de ton compte GitHub. Sur un autre navigateur, colle le même jeton : la sauvegarde la plus récente est récupérée, puis tenue à jour automatiquement.</p>
    <div class="gstat" id="gstat" aria-live="polite">${syncLine()}</div>
    ${gist.connected ? `<div class="btnrow"><button class="btn" id="g-now">Synchroniser maintenant</button><button class="btn" id="g-off">Déconnecter cet appareil</button></div>`
      : `<ol class="steps small"><li>Crée un jeton sur <a href="https://github.com/settings/tokens/new?scopes=gist&description=Kotoba" target="_blank" rel="noopener">github.com/settings/tokens</a> avec uniquement le droit « gist ».</li><li>Colle-le ci-dessous. Il reste stocké sur cet appareil uniquement.</li></ol>
        <input class="inp sm" id="g-token" type="password" autocomplete="off" placeholder="ghp_…"><div class="btnrow"><button class="btn pri" id="g-on">Connecter</button></div>`}
   </div>
   <p class="small about">Kotoba v${VERSION} · <a href="${REPO_URL}" target="_blank" rel="noopener">code source</a> · licence GPL-3.0</p><div class="spacer"></div>`;
  const tog = (id, fn) => { $(id).onchange = e => { fn(e.target.checked); save(); }; };
  tog("#s-kana", v => store.help.kana = v); tog("#s-ro", v => store.help.ro = v);
  tog("#s-snd", v => { store.settings.sound = v; if (v) sfx.ok(); });
  $("#s-rate").onchange = e => { store.settings.voiceRate = +e.target.value; save(); speak("こんにちは"); };
  $("#t-voice").onclick = () => speak("こんにちは、よろしくおねがいします");
  $("#t-mic").onclick = async () => {
    const m = $("#micmsg"); m.textContent = "Dis « こんにちは » (konnichiwa)…"; sfx.micOn();
    try { const a = await SR.listen(); const r = speechScore(a, ["こんにちは"]); m.textContent = `Entendu : ${r.heard} · ${r.score} %`; }
    catch (e) { m.textContent = SR_MSG[e.code] || SR_MSG.error; }
  };
  const msg = t => { $("#impmsg").textContent = t; };
  $("#exp-file").onclick = () => downloadSave();
  $("#imp-file").onchange = async e => { const f = e.target.files[0]; if (!f) return;
    try { restore(decodeSave(await f.text())); route(); } catch (err) { msg("Fichier illisible."); } };
  $("#exp-code").onclick = async () => { const code = encodeSave(), ta = $("#imp-code");
    try { await navigator.clipboard.writeText(code); msg("Code copié dans le presse-papiers."); } catch (e) { ta.value = code; ta.select(); msg("Code affiché ci-dessus : copie-le."); } };
  $("#do-imp").onclick = () => { const v = $("#imp-code").value; if (!v.trim()) return;
    try { restore(decodeSave(v)); route(); } catch (e) { msg("Code illisible : vérifie qu'il est complet."); } };
  if ($("#g-on")) $("#g-on").onclick = async () => { const t = $("#g-token").value.trim(); if (!t) return;
    $("#g-on").disabled = true;
    try { await gist.connect(t); route(); } catch (e) { $("#g-on").disabled = false; $("#gstat").innerHTML = `<span class="dot err"></span>${esc(e.message)}`; } };
  if ($("#g-now")) $("#g-now").onclick = async () => { await gist.init(); };
  if ($("#g-off")) $("#g-off").onclick = () => { gist.disconnect(); route(); };
}

/* --- Fiche récapitulative d'un thème : se remplit au fil des leçons --- */
const MASTER = 3;
function seenSet(th) { const k = new Set(knownNow(th).map(v => v.jp)); V[th].forEach(v => { if (store.wm[v.jp] !== undefined) k.add(v.jp); }); return k; }
function ficheStat(th) { const seen = seenSet(th); return { total: V[th].length, seen: seen.size, mast: V[th].filter(v => (store.wm[v.jp] || 0) >= MASTER).length }; }
function viewFiche(th) {
  const d = DATA[th], u = unitOf(th), seen = seenSet(th), f = ficheStat(th);
  const gs = groupsOf(th);
  const lessonOf = v => gs.findIndex(g => g.includes(v)) + 1;
  const sents = sentsFor(th, V[th].filter(v => seen.has(v.jp)));
  const notes = NOTES[th] || [];
  const card = v => {
    if (!seen.has(v.jp)) return `<div class="wcard lock"><span class="wq">？</span><span class="small">Nouveaux mots ${lessonOf(v)}</span></div>`;
    const m = store.wm[v.jp] || 0;
    return `<button class="wcard ${m >= MASTER ? "mast" : ""}" data-say="${esc(first(v.kana))}">${v.pic ? `<span class="wpic">${pic(v.pic)}</span>` : ""}
      <b class="wjp">${esc(v.jp)}</b>${v.kana !== v.jp ? `<span class="wk">${esc(v.kana)}</span>` : ""}<span class="wr">${esc(v.ro)}</span><span class="wfr">${esc(v.fr)}</span>
      <span class="wm" aria-label="Maîtrise ${m} sur 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < m ? "on" : ""}"></i>`).join("")}</span></button>`;
  };
  $("#app").innerHTML = `<a class="back" href="#theme-${th}">← ${esc(d.t)}</a>
   <section class="thead ${u.hue}"><span class="tbadge big">${d.k}</span><div><span class="eyebrow">Fiche récapitulative</span><h2>${d.t}</h2><div class="small">${f.seen} / ${f.total} mots vus · ${f.mast} maîtrisés</div></div></section>
   <div class="meter fmeter ${u.hue}"><div style="width:${f.seen / f.total * 100}%"></div></div>
   ${notes.length ? `<div class="panel notes"><span class="eyebrow">À retenir</span><ul>${notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
   <h3 class="sect">Vocabulaire</h3>
   <div class="wgrid">${V[th].map(card).join("")}</div>
   <p class="small">Un mot est maîtrisé après ${MASTER} bonnes réponses de plus que d'erreurs. Touche un mot pour l'écouter.</p>
   <h3 class="sect">Phrases</h3>
   ${sents.length ? `<div class="slist">${sents.map(x => `<div class="bubble">${sentHTML(x.tok)}<div class="srow"><span class="small">${esc(x.fr)}</span>${jaVoice ? `<button class="spk sm" data-say="${esc(x.ka)}" aria-label="Écouter">${SPK}</button>` : ""}</div></div>`).join("")}</div>`
     : `<div class="empty">Les phrases apparaissent quand tu connais leurs mots.</div>`}
   <div class="spacer"></div>`;
  $("#app").querySelectorAll("[data-say]").forEach(b => b.onclick = () => speak(b.dataset.say));
}
