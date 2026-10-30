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

/* --- Effets sonores : cordes pincées façon koto, gamme japonaise (aucun fichier audio) --- */
const sfx = (() => {
  let ctx = null, master = null;
  const cache = {};
  const ac = () => {
    if (!store.settings.sound) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createDynamicsCompressor(); master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  };
  // Corde pincée (algorithme de Karplus-Strong), mise en cache par hauteur
  function pluck(c, f, damp) {
    const key = f + ":" + damp; if (cache[key]) return cache[key];
    const sr = c.sampleRate, n = Math.floor(sr * 1.6), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / f)), ring = new Float32Array(p);
    for (let i = 0; i < p; i++) ring[i] = (Math.random() * 2 - 1) * (1 - i / p * .5);
    let k = 0;
    for (let i = 0; i < n; i++) { const a = ring[k], b = ring[(k + 1) % p]; d[i] = a; ring[k] = (a + b) * .5 * damp; k = (k + 1) % p; }
    return (cache[key] = buf);
  }
  // note : [fréquence, départ (s), volume, amortissement, filtre]
  const play = notes => {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + .01;
    notes.forEach(([f, s, vol = .5, damp = .996, cut = 4200]) => {
      const src = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter();
      src.buffer = pluck(c, f, damp); lp.type = "lowpass"; lp.frequency.value = cut;
      g.gain.value = vol; src.connect(lp).connect(g).connect(master); src.start(t0 + s);
    });
  };
  // Bloc de bois (claves) pour les clics
  const wood = (f = 1700, vol = .25) => {
    const c = ac(); if (!c) return;
    const t = c.currentTime + .005, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .6, t + .05);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07);
    o.connect(g).connect(master); o.start(t); o.stop(t + .09);
  };
  // Tambour grave (taiko) pour les grands moments
  const taiko = (vol = .7) => {
    const c = ac(); if (!c) return;
    const t = c.currentTime + .005, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + .35);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
    o.connect(g).connect(master); o.start(t); o.stop(t + .55);
  };
  // Gammes : yō (lumineuse) pour les réussites, miyako-bushi (mélancolique) pour les erreurs
  const Y = { D4: 293.7, E4: 329.6, G4: 392, A4: 440, B4: 493.9, D5: 587.3, E5: 659.3, G5: 784, A5: 880, B5: 987.8, D6: 1174.7 };
  const M = { D3: 146.8, Eb3: 155.6, G3: 196, A3: 220, Bb3: 233.1, D4: 293.7 };
  return {
    tap:    () => wood(1800, .18),
    ok:     () => play([[Y.A5, 0, .45], [Y.D6, .09, .5]]),
    ko:     () => play([[M.A3, 0, .55, .993, 1400], [M.Eb3, .13, .6, .992, 1100]]),
    match:  () => play([[Y.G5, 0, .35, .995]]),
    miss:   () => play([[M.Bb3, 0, .45, .99, 900]]),
    lose:   () => { play([[M.D4, 0, .5, .994, 1500], [M.Bb3, .16, .5, .994, 1400], [M.A3, .32, .5, .994, 1300], [M.Eb3, .5, .6, .993, 1100]]); },
    done:   () => { play([[Y.D5, 0], [Y.E5, .1], [Y.G5, .2], [Y.A5, .3], [Y.D6, .42, .6]]); setTimeout(() => taiko(.5), 420); },
    record: () => { taiko(); play([[Y.D5, .05], [Y.G5, .15], [Y.A5, .25], [Y.D6, .35], [Y.B5, .5], [Y.D6, .62, .6]]); setTimeout(() => taiko(.6), 620); },
    tick:   () => wood(2400, .08),
    micOn:  () => play([[Y.E5, 0, .3, .99], [Y.A5, .08, .3, .99]])
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
  "service-not-allowed": "Ce navigateur bloque le service de reconnaissance vocale (c'est le cas de Vivaldi ou Brave). Utilise Edge, Chrome ou Safari.",
  "no-speech": "Je n'ai rien entendu. Rapproche-toi du micro et réessaie.",
  "audio-capture": "Aucun micro détecté.",
  "network": "Le service de reconnaissance vocale est injoignable. Certains navigateurs (Vivaldi, Brave, Opera) le bloquent : utilise Edge, Chrome ou Safari.",
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
