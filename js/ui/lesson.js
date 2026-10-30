/* ===== Déroulé d'une leçon ou d'un jeu ===== */
let L=null,sel=null,chosen=[],answered=false,tick=null;
function stopTimer(){if(tick){clearInterval(tick);tick=null;}}

function start(spec){
  stopTimer();
  const q=buildLesson(spec);if(!q.length)return show();
  L={spec,q,i:0,graded:q.filter(e=>!isFree(e)).length,len:q.length,wrong:new Set(),score:0,lives:3,answered:0};
  if(spec.mode==="endless"||spec.mode==="chrono"){L.ctx=themeCtx(spec.th,knownNow(spec.th));}
  if(spec.mode==="chrono"){L.end=Date.now()+60000;tick=setInterval(()=>{const r=Math.max(0,L.end-Date.now());const b=$("#tbar");if(b)b.style.width=(r/600)+"%";const t=$("#tleft");if(t)t.textContent=Math.ceil(r/1000)+" s";if(r<=0){stopTimer();gameOver();}},200);}
  render();}

const isFree=e=>["intro","kintro"].includes(e.type)||(e.type==="speak"&&!SR.ok);
function barHTML(){
  const m=L.spec.mode;
  if(m==="endless")return `<div class="hearts" aria-label="${L.lives} vies">${"♥".repeat(L.lives)}${"♡".repeat(3-L.lives)}</div><div class="prog"><div style="width:${Math.min(100,L.score*4)}%"></div></div><div class="score">${L.score}</div>`;
  if(m==="chrono")return `<div class="score" id="tleft">${Math.ceil(Math.max(0,L.end-Date.now())/1000)} s</div><div class="prog timer"><div id="tbar" style="width:${Math.max(0,L.end-Date.now())/600}%"></div></div><div class="score">${L.score}</div>`;
  return `<div class="prog"><div style="width:${Math.round(L.i/L.q.length*100)}%"></div></div>`;}

function render(){
  document.body.classList.add("in-lesson");
  const ex=L.q[L.i];sel=null;chosen=[];answered=false;
  let body="";
  if(ex.type==="intro"){const v=ex.v;
    body=`<div class="intro">${pic(v.pic)}<div class="pjp">${esc(v.jp)}</div><div class="paid" style="align-items:center">${aid(v.jp,v.kana,v.ro,"pk")}</div><div class="fr">${esc(v.fr)}</div>${jaVoice?`<button class="spk" id="say" aria-label="Écouter">${SPK}</button>`:""}</div>`;
  }else if(ex.type==="kintro"){const x=ex.x,k=isKanji(ex.s);
    body=`<div class="intro"><div class="huge">${esc(x.c)}</div>${k?`<div class="fr">${esc(x.fr)}</div><div class="pk">${esc(x.kana)}</div><div class="rom pk">${esc(x.ro)}</div>`:`<div class="fr rom" style="font-family:var(--f-mono)">${esc(x.ro)}</div><div class="small">${ex.s==="kata"?`Hiragana équivalent : ${esc(toHira(x.c))}`:`Katakana équivalent : ${esc(toKata(x.c))}`}</div>`}${jaVoice?`<button class="spk" id="say" aria-label="Écouter">${SPK}</button>`:""}</div>`;
  }else if(ex.type==="mcq"){
    body=`${ex.listen?`<div class="prompt"><button class="spk big" id="play" aria-label="Réécouter">${SPK}</button><span class="small">Touche pour réécouter</span></div>`:""}
     ${ex.prompt?`<div class="prompt">${ex.prompt}${ex.speak&&jaVoice?`<button class="spk" id="say" aria-label="Écouter">${SPK}</button>`:""}</div>`:""}
     <div class="opts ${ex.two?"two":""} ${ex.pics?"pics":""}">${ex.options.map((o,i)=>`<button class="opt" data-v="${esc(o.val)}"><span class="num">${i+1}</span><span class="lab">${o.html}</span></button>`).join("")}</div>`;
  }else if(ex.type==="pairs"){
    const L1=shuffle(ex.items),R1=shuffle(ex.items);
    body=`<div class="pairs"><div class="col">${L1.map(v=>`<button class="opt" data-side="l" data-k="${esc(v.k)}"><span class="lab">${v.l}</span></button>`).join("")}</div>
     <div class="col">${R1.map(v=>`<button class="opt" data-side="r" data-k="${esc(v.k)}"><span class="lab">${v.r}</span></button>`).join("")}</div></div>`;
  }else if(ex.type==="build"){
    const tl=ex.lang==="jp";
    body=`${tl?`<div class="bubble"><div class="pfr">${esc(ex.fr)}</div></div>`:`<div class="bubble">${sentHTML(ex.jp)}${jaVoice?`<button class="spk sm" id="say2" aria-label="Écouter">${SPK}</button>`:""}</div>`}
     <div class="line" id="line"></div>
     <div class="bank" id="bank">${ex.tiles.map((t,i)=>`<button class="tile ${tl?"jp":""}" data-i="${i}">${tl?tileJP(t):esc(t)}</button>`).join("")}</div>
     ${tl?`<button class="hint" id="hint">Afficher la lecture en kana</button><div class="hinttxt" id="hinttxt" hidden>${esc(ex.hint)}</div>`:""}`;
  }else if(ex.type==="type"){
    body=`<div class="prompt">${ex.prompt}</div><input class="inp" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tape en rōmaji, ex. : kyou"><div class="preview" id="pv" aria-live="polite"></div><div class="small">Pas besoin de clavier japonais : tape en lettres latines. Voyelles longues acceptées sous toutes les formes (ō, ou, o).</div>`;
  }else if(ex.type==="speak"){
    body=`${ex.prompt}${jaVoice?`<div class="prompt"><button class="spk" id="play" aria-label="Écouter">${SPK}</button><button class="btn" id="slow">Écouter lentement</button></div>`:""}
     ${SR.ok?`<div class="micbox"><button class="mic" id="mic" aria-label="Parler">${MIC}</button><div class="small" id="srs" aria-live="polite">Touche le micro, puis prononce ${ex.single?"le mot":"la phrase"} en japonais.</div><button class="hint" id="skip">Je ne peux pas parler maintenant</button></div>`
     :`<div class="small">Ce navigateur ne propose pas la reconnaissance vocale : écoute, répète à voix haute, puis continue. Avec Chrome, Edge ou Safari, ta prononciation est vérifiée.</div>`}`;
  }else if(ex.type==="draw"){
    body=`<div class="padbox"><div class="padwrap" id="padwrap"><canvas id="cg"></canvas><canvas class="pad" id="cp" aria-label="Zone de tracé"></canvas></div><div class="btnrow"><button class="btn" id="undo">Annuler le trait</button><button class="btn" id="clr">Effacer</button>${jaVoice?`<button class="btn" id="say3">Écouter</button>`:""}</div></div>`;
  }
  const isIntro=isFree(ex);
  const m=L.spec.mode;
  $("#app").innerHTML=`
   <div class="bar"><button class="x" id="quit" aria-label="Quitter">×</button>${barHTML()}</div>
   <div class="ex">${ex.type==="intro"||ex.type==="kintro"?'<span class="badge new">Nouveau</span>':ex.retry?'<span class="badge">Erreur précédente</span>':""}${ex.type==="intro"||ex.type==="kintro"?"":`<h2 class="ttl">${ex.title}</h2>`}${ex.sub?`<div class="small" style="margin-top:-12px">${ex.sub}</div>`:""}${body}</div>
   <div class="foot" id="foot"><div class="fb" id="fb">${isIntro?'<span class="small">Écoute, mémorise, puis continue.</span>':m==="chrono"?'<span class="small">Touche la bonne réponse, vite !</span>':""}</div><button class="main" id="go" ${ex.type==="pairs"||(m==="chrono"&&ex.type==="mcq")||(ex.type==="speak"&&SR.ok)?"hidden":""} ${isIntro?"":"disabled"}>${isIntro?"Continuer":"Vérifier"}</button></div>`;
  if(isIntro)answered=true;
  $("#quit").onclick=()=>{stopTimer();show();};
  $("#go").onclick=()=>answered?next():check();
  bind(ex);
  if(ex.listen)setTimeout(()=>speak(ex.listen),250);
  if(isIntro&&ex.type!=="speak")setTimeout(()=>speak(ex.speak),250);
  if(ex.type==="speak")setTimeout(()=>speak(ex.say),250);
  if(ex.type==="kintro"&&store.ch[ex.s][ex.x.c]===undefined){store.ch[ex.s][ex.x.c]=0;save();}
}

function bind(ex){
  const go=$("#go");
  if($("#say"))$("#say").onclick=()=>speak(ex.speak);
  if(ex.type==="speak"){if($("#play")){$("#play").onclick=()=>speak(ex.say);$("#slow").onclick=()=>speak(ex.say,.55);}
    if(SR.ok){let tries=0,on=false;const mic=$("#mic"),msg=$("#srs");
      $("#skip").onclick=()=>{if(answered)return;answered=true;L.graded=Math.max(0,L.graded-1);next();};
      mic.onclick=async()=>{if(answered||on)return;on=true;mic.classList.add("rec");sfx.micOn();speechSynthesis&&speechSynthesis.cancel();msg.textContent="J'écoute…";
        try{const alts=await SR.listen();const r=speechScore(alts,ex.targets);tries++;ex.heard=r.heard;ex.srScore=r.score;
          if(r.score>=ex.pass){ex.srOk=true;check();}
          else if(tries>=3){ex.srOk=false;check();}
          else{msg.innerHTML=`Entendu : <span class="jx">${esc(r.heard)}</span> · ${r.score} %. Pas tout à fait, réessaie (essai ${tries}/3).`;sfx.miss();}}
        catch(e){msg.textContent=SR_MSG[e.code]||SR_MSG.error;}
        on=false;mic.classList.remove("rec");};}}
  if(ex.type==="mcq"){
    if($("#play"))$("#play").onclick=()=>speak(ex.listen);
    document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{if(answered)return;document.querySelectorAll(".opt").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");sel=b.dataset.v;go.disabled=false;sfx.tap();if(L.spec.mode==="chrono")check();});
  }else if(ex.type==="pairs"){
    let pick=null,left=ex.items.length,miss=0;
    document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
      if(b.disabled)return;
      if(!pick||pick.dataset.side===b.dataset.side){if(pick)pick.classList.remove("sel");pick=b;b.classList.add("sel");if(b.dataset.side==="l"){const v=ex.items.find(x=>x.k===b.dataset.k);if(v)speak(v.say);}return;}
      if(pick.dataset.k===b.dataset.k){[pick,b].forEach(x=>{x.classList.remove("sel");x.classList.add("good");x.disabled=true;sfx.match();setTimeout(()=>{x.classList.remove("good");x.classList.add("done");},350);});left--;
        if(!left){answered=true;$("#foot").className="foot ok";$("#fb").innerHTML=`<b>${miss?"Toutes les paires sont reliées":"Parfait !"}</b><div class="det">${miss?`${miss} erreur${miss>1?"s":""} en chemin`:"Sans faute"}</div>`;go.hidden=false;go.disabled=false;go.textContent="Continuer";go.focus();}}
      else{miss++;sfx.miss();[pick,b].forEach(x=>{x.classList.remove("sel");x.classList.add("bad");setTimeout(()=>x.classList.remove("bad"),500);});
        [pick.dataset.k,b.dataset.k].forEach(k=>mark(k,false,L.spec.s));save();L.wrong.add(L.i);}
      pick=null;});
  }else if(ex.type==="build"){
    const line=$("#line"),tl=ex.lang==="jp";
    if($("#say2"))$("#say2").onclick=()=>speak(ex.say);
    $("#bank").querySelectorAll(".tile").forEach(t=>t.onclick=()=>{if(answered||t.classList.contains("ghost"))return;
      const i=+t.dataset.i;t.classList.add("ghost");chosen.push(i);
      const c=document.createElement("button");c.className="tile"+(tl?" jp":"");c.innerHTML=tl?tileJP(ex.tiles[i]):esc(ex.tiles[i]);
      if(tl){const r=info(ex.tiles[i]);if(r.kana)speak(r.kana);}
      c.onclick=()=>{if(answered)return;chosen.splice(chosen.indexOf(i),1);c.remove();t.classList.remove("ghost");go.disabled=!chosen.length;};
      line.appendChild(c);go.disabled=false;});
    if($("#hint"))$("#hint").onclick=()=>{$("#hinttxt").hidden=false;$("#hint").hidden=true;};
  }else if(ex.type==="type"){
    const inp=$("#inp");inp.focus();inp.oninput=()=>{go.disabled=!inp.value.trim();$("#pv").textContent=/[a-z]/i.test(inp.value)?`Aperçu : ${r2k(inp.value)}`:"";};
    inp.onkeydown=e=>{if(e.key==="Enter"&&!go.disabled){e.preventDefault();e.stopPropagation();answered?next():check();}};
  }else if(ex.type==="draw"){
    setupPad(ex,()=>{go.disabled=!ex.strokes.length||answered;});
    $("#clr").onclick=()=>{if(!answered)ex.clear();};$("#undo").onclick=()=>{if(!answered)ex.undo();};
    if($("#say3"))$("#say3").onclick=()=>speak(ex.speakAfter);
  }
}

/* maîtrise : mots (points faibles) et caractères (barres de progression) */
function mark(key,ok,s){
  if(!key)return;
  if(s&&SCR[s]&&SCR[s].list.some(x=>x.c===key)){const c=store.ch[s][key]??0;store.ch[s][key]=ok?Math.min(5,c+1):Math.max(0,c-1);return;}
  if(key.startsWith("s:")||!ALLV.some(v=>v.jp===key))return;
  if(ok){if(store.weak[key]){store.weak[key]--;if(store.weak[key]<=0)delete store.weak[key];}}else store.weak[key]=(store.weak[key]||0)+1;
}

async function check(){
  const ex=L.q[L.i];if(answered)return;let ok=false,extra="";
  if(ex.type==="mcq")ok=sel===ex.answer;
  else if(ex.type==="build")ok=chosen.map(i=>ex.tiles[i]).join(ex.sep).toLowerCase()===ex.answer.toLowerCase();
  else if(ex.type==="type"){const v=norm($("#inp").value);ok=ex.answers.some(a=>norm(a)===v);$("#inp").disabled=true;}
  else if(ex.type==="speak"){ok=!!ex.srOk;extra=ex.heard!==undefined?`Entendu : ${ex.heard} · ${ex.srScore} %`:"";}
  else if(ex.type==="draw"){answered=true;ex.locked=true;$("#go").disabled=true;await fontReady();const r=grade(ex.strokes,ex.glyph);ok=r.ok;extra=`Ressemblance : ${r.score} %`;await ex.showModel();}
  answered=true;
  if(ex.type==="mcq")document.querySelectorAll(".opt").forEach(b=>{b.disabled=true;if(b.dataset.v===ex.answer)b.classList.add("good");else if(b.classList.contains("sel"))b.classList.add("bad");});
  const m=L.spec.mode;
  mark(ex.ch||ex.key,ok,ex.ch?L.spec.s:null);
  if(m==="endless"||m==="chrono"){L.answered++;if(ok)L.score++;else if(m==="endless")L.lives--;}
  else if(!ok){L.wrong.add(L.i);if(!ex.retry)L.q.push(Object.assign({},ex,{retry:true,strokes:[],locked:false,srOk:false,heard:undefined,options:ex.options&&shuffle(ex.options),tiles:ex.tiles&&shuffle(ex.tiles)}));}
  save();
  (ok?sfx.ok:(m==="endless"&&L.lives<=0?sfx.lose:sfx.ko))();
  if(m==="chrono"){if(!ok)speak(ex.speakAfter||"");setTimeout(()=>{if(L&&L.spec.mode==="chrono"&&tick)next();},ok?350:1100);return;}
  if(m==="endless"){const h=document.querySelector(".hearts");if(h)h.textContent="♥".repeat(Math.max(0,L.lives))+"♡".repeat(3-Math.max(0,L.lives));}
  $("#foot").className="foot "+(ok?"ok":"ko");
  $("#fb").innerHTML=ok?`<b>${rnd(["Bien joué !","Exact !","Parfait !","Très bien !"])}</b><div class="det">${extra?esc(extra)+"<br>":""}${ex.reveal||""}</div>`:`<b>${ex.type==="draw"?"Pas encore assez proche":ex.type==="speak"?"Prononciation à retravailler":"Réponse attendue"}</b><div class="det">${extra?esc(extra)+" · le modèle est affiché en vert<br>":""}${ex.reveal}</div>`;
  const go=$("#go");go.textContent=m==="endless"&&L.lives<=0?"Voir le score":"Continuer";go.disabled=false;go.hidden=false;go.focus();
  if(ex.speakAfter)speak(ex.speakAfter);
}

function next(){
  const m=L.spec.mode;
  if(m==="endless"){if(L.lives<=0)return gameOver();L.q.push(gameEx(L.spec,L.ctx));L.i++;return render();}
  if(m==="chrono"){if(Date.now()>=L.end)return gameOver();L.q.push(gameEx(L.spec,L.ctx));L.i++;return render();}
  L.i++;if(L.i>=L.q.length)return finish();render();}

function gameOver(){
  stopTimer();const sp=L.spec,key=sp.mode==="endless"?"inf":"chr";
  const b=store.best[sp.th]||(store.best[sp.th]={});const rec=L.score>(b[key]||0);if(rec)b[key]=L.score;
  const xp=5+L.score;store.xp+=xp;touchDay();save();(rec&&L.score?sfx.record:sfx.done)();
  $("#app").innerHTML=`<div class="end"><div class="k">${rec?"新":"終"}</div><h2 class="ttl">${rec?"Nouveau record !":sp.mode==="endless"?"Plus de vies":"Temps écoulé"}</h2>
   <div class="stats"><div class="stat"><b>${L.score}</b><span>Bonnes réponses</span></div><div class="stat"><b>${b[key]}</b><span>Record</span></div><div class="stat"><b>+${xp}</b><span>XP</span></div></div>
   <div class="stats"><button class="main" id="again">Rejouer</button><button class="main sec" id="back">Parcours</button></div></div>`;
  $("#again").onclick=()=>start({mode:sp.mode,th:sp.th});$("#back").onclick=()=>path(sp.th);L=null;}

function finish(){
  const wrongFirst=[...L.wrong].filter(i=>i<L.len).length;
  const firstOk=Math.max(0,L.graded-wrongFirst);
  const xp=10+firstOk;store.xp+=xp;touchDay();sfx.done();
  const sp=L.spec;let unlocked="";
  if(sp.mode==="theme"){const before=store.prog[sp.th]||0;store.prog[sp.th]=Math.max(before,sp.idx+1);
    const ls=lessonsOf(sp.th);if(sp.idx+1>before&&sp.idx+1<ls.length)unlocked=`Leçon débloquée : ${ls[sp.idx+1].label}`;
    if(before<GAME_AT&&store.prog[sp.th]>=GAME_AT)unlocked+=(unlocked?" · ":"")+"Jeux débloqués : mode infini et contre-la-montre";}
  save();
  const pct=L.graded?Math.round(firstOk/L.graded*100):100;
  const nextTheme=sp.mode==="theme"&&sp.idx+1<lessonsOf(sp.th).length;
  const nextK=(sp.mode==="knew"||sp.mode==="krev");
  $("#app").innerHTML=`<div class="end"><div class="k">${pct===100?"完":"終"}</div><h2 class="ttl">${pct===100?"Leçon sans faute !":"Leçon terminée"}</h2>
   ${unlocked?`<div class="small">${esc(unlocked)}</div>`:""}
   <div class="stats"><div class="stat"><b>+${xp}</b><span>XP</span></div><div class="stat"><b>${pct} %</b><span>Précision</span></div><div class="stat"><b>${firstOk} / ${L.graded}</b><span>Du premier coup</span></div></div>
   <div class="stats">${nextTheme?'<button class="main" id="nx">Leçon suivante</button>':nextK?'<button class="main" id="nx">Continuer</button>':'<button class="main" id="nx">Recommencer</button>'}<button class="main sec" id="back">${sp.mode==="theme"?"Parcours":nextK?"Caractères":"Accueil"}</button></div></div>`;
  $("#nx").onclick=()=>{if(nextTheme){const ls=lessonsOf(sp.th);start({mode:"theme",th:sp.th,idx:sp.idx+1,lesson:ls[sp.idx+1]});}else if(nextK){const left=SCR[sp.s].list.some(x=>store.ch[sp.s][x.c]===undefined);start({mode:left?"knew":"krev",s:sp.s});}else start(sp);};
  $("#back").onclick=()=>show();
  L=null;
}

document.addEventListener("keydown",e=>{
  if(!L)return;const go=$("#go");if(!go)return;
  if(e.key==="Enter"&&!go.disabled&&!go.hidden&&document.activeElement!==go&&document.activeElement?.id!=="inp"){e.preventDefault();go.click();}
  const ex=L.q[L.i];if(ex&&ex.type==="mcq"&&!answered&&/^[1-4]$/.test(e.key)){const b=document.querySelectorAll(".opt")[+e.key-1];if(b)b.click();}
});
