/* ===== Audio : voix japonaise, effets sonores, reconnaissance vocale ===== */

/* --- Synthèse vocale (lecture des mots) --- */
let jaVoice = null;
function findVoice() {
  try { jaVoice = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang)) || null; }
  catch (e) { jaVoice = null; }
}
if ("speechSynthesis" in window) {
  findVoice();
  try {
    speechSynthesis.addEventListener("voiceschanged", () => {
      const had = !!jaVoice; findVoice();
      if (!had && jaVoice && typeof L !== "undefined" && !L) show();
    });
  } catch (e) {}
}
function speak(t, rate) {
  if (!jaVoice || !t) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "ja-JP"; u.voice = jaVoice;
    u.rate = (rate || .85) * (store.settings.voiceRate || 1);
    speechSynthesis.speak(u);
  } catch (e) {}
}
const SPK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';

/* --- Effets sonores (générés, aucun fichier) --- */
const sfx = (() => {
  let ctx = null;
  const ac = () => {
    if (!store.settings.sound) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  };
  // note(fréquence, début, durée, type, volume)
  const play = notes => {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + .01;
    notes.forEach(([f, s, d, type = "sine", vol = .18]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0 + s);
      g.gain.setValueAtTime(0, t0 + s);
      g.gain.linearRampToValueAtTime(vol, t0 + s + .015);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + s + d);
      o.connect(g).connect(c.destination);
      o.start(t0 + s); o.stop(t0 + s + d + .05);
    });
  };
  return {
    tap:    () => play([[660, 0, .06, "triangle", .08]]),
    ok:     () => play([[784, 0, .12, "triangle"], [1175, .09, .22, "triangle"]]),
    ko:     () => play([[220, 0, .18, "sawtooth", .09], [165, .12, .26, "sawtooth", .08]]),
    match:  () => play([[880, 0, .08, "sine", .12]]),
    miss:   () => play([[180, 0, .15, "square", .06]]),
    lose:   () => play([[392, 0, .14, "triangle"], [311, .12, .14, "triangle"], [233, .24, .3, "triangle"]]),
    done:   () => play([[523, 0, .14, "triangle"], [659, .12, .14, "triangle"], [784, .24, .14, "triangle"], [1047, .36, .4, "triangle"]]),
    record: () => play([[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .18], [784, .48, .1], [1047, .58, .5]]),
    tick:   () => play([[1200, 0, .03, "square", .04]]),
    micOn:  () => play([[600, 0, .07, "sine", .1], [900, .07, .09, "sine", .1]])
  };
})();

/* --- Reconnaissance vocale (micro) --- */
const SR = (() => {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return {
    ok: !!Ctor,
    // Écoute une fois et renvoie les transcriptions candidates
    listen() {
      return new Promise((resolve, reject) => {
        if (!Ctor) return reject({ code: "unsupported" });
        let r;
        try { r = new Ctor(); } catch (e) { return reject({ code: "unsupported" }); }
        r.lang = "ja-JP"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
        let done = false;
        r.onresult = e => {
          done = true;
          const res = e.results[0]; const alts = [];
          for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
          resolve(alts);
        };
        r.onerror = e => { done = true; reject({ code: e.error || "error" }); };
        r.onend = () => { if (!done) reject({ code: "no-speech" }); };
        try { r.start(); } catch (e) { reject({ code: "busy" }); }
        setTimeout(() => { try { r.stop(); } catch (e) {} }, 7000);
      });
    }
  };
})();
const SR_MSG = {
  "not-allowed": "Micro refusé. Autorise le micro pour ce site dans les réglages du navigateur.",
  "service-not-allowed": "Micro refusé. Autorise le micro pour ce site dans les réglages du navigateur.",
  "no-speech": "Je n'ai rien entendu. Rapproche-toi du micro et réessaie.",
  "audio-capture": "Aucun micro détecté.",
  "network": "La reconnaissance vocale a besoin d'Internet.",
  "unsupported": "Ce navigateur ne propose pas la reconnaissance vocale (utilise Chrome, Edge ou Safari).",
  "busy": "Le micro est déjà en cours d'utilisation.",
  "error": "La reconnaissance vocale a échoué. Réessaie."
};

/* Similarité entre ce qui a été entendu et la cible (0 à 1) */
function levenshtein(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function speechNorm(s) {
  return toHira(String(s))
    .replace(/\d+/g, d => (+d > 0 && +d < 10000) ? numRead(+d).k : d)
    .replace(/[\s、。，．,.!?！？・「」『』ー〜~]/g, "");
}
function speechScore(alts, targets) {
  let best = 0, heard = alts[0] || "";
  alts.forEach(a => {
    const na = speechNorm(a);
    targets.forEach(t => {
      const nt = speechNorm(t); if (!nt) return;
      const sim = 1 - levenshtein(na, nt) / Math.max(na.length, nt.length);
      if (sim > best) { best = sim; heard = a; }
    });
  });
  return { score: Math.round(best * 100), heard };
}
