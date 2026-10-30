/* ===== Nombres générés ===== */
const DK=["","一","二","三","四","五","六","七","八","九"],DH=["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"],DR=["","ichi","ni","san","yon","go","roku","nana","hachi","kyū"];
function numRead(n){
  const th=Math.floor(n/1000),h=Math.floor(n/100)%10,t=Math.floor(n/10)%10,u=n%10;let k="",ka="",ro="";
  if(th){k+=(th>1?DK[th]:"")+"千";const m={1:["せん","sen"],3:["さんぜん","sanzen"],8:["はっせん","hassen"]}[th]||[DH[th]+"せん",DR[th]+"sen"];ka+=m[0];ro+=m[1];}
  if(h){k+=(h>1?DK[h]:"")+"百";const m={1:["ひゃく","hyaku"],3:["さんびゃく","sanbyaku"],6:["ろっぴゃく","roppyaku"],8:["はっぴゃく","happyaku"]}[h]||[DH[h]+"ひゃく",DR[h]+"hyaku"];ka+=m[0];ro+=m[1];}
  if(t){k+=(t>1?DK[t]:"")+"十";ka+=(t>1?DH[t]:"")+"じゅう";ro+=(t>1?DR[t]:"")+"jū";}
  if(u){k+=DK[u];ka+=DH[u];ro+=DR[u];}
  return {k,ka,ro};}
function numMax(ctx){const j=new Set(ctx.pool.map(v=>v.jp));return j.has("千")?9999:j.has("百")?999:j.has("十")?99:0;}
function randNum(max){const r=Math.random();
  if(max<=99||r<.3)return 11+Math.floor(Math.random()*89);
  if(max<=999||r<.65)return rnd([3,6,8,1,2,4,5,7,9])*100+Math.floor(Math.random()*100);
  return rnd([3,8,1,2,5])*1000+rnd([0,3,6,8,1,4])*100+Math.floor(Math.random()*100);}

/* ===== Parcours des thèmes ===== */
function groupsOf(th){const g=[];for(let i=0;i<V[th].length;i+=4)g.push(V[th].slice(i,i+4));if(g.length>1&&g[g.length-1].length<3){const l=g.pop();g[g.length-1]=g[g.length-1].concat(l);}return g;}
function lessonsOf(th){
  const gs=groupsOf(th),Ls=[];
  gs.forEach((g,i)=>{Ls.push({kind:"learn",g:i,label:`Nouveaux mots ${i+1}`,sub:g.map(v=>v.jp).join(" · ")});
    if(i%2===1||i===gs.length-1)Ls.push({kind:"review",g:i,label:"Révision",sub:"Mélange de tout ce que tu as vu"});});
  Ls.push({kind:"master",g:gs.length-1,label:"Maîtrise",sub:"Saisie, lecture et phrases en japonais"});
  return Ls;}
function knownOf(th,gi){return groupsOf(th).slice(0,gi+1).flat();}
function knownNow(th){const Ls=lessonsOf(th),p=Math.min(store.prog[th]||0,Ls.length);if(!p)return [];return knownOf(th,Ls[p-1].g);}
function sentsFor(th,pool){const theme=new Set(V[th].map(v=>v.jp)),k=new Set(pool.map(v=>v.jp));return DATA[th].s.filter(s=>s.tok.every(t=>!theme.has(t)||k.has(t)));}
const GAME_AT=3;

/* ===== Générateurs (thèmes) ===== */
function pickV(ctx,f=()=>true){
  if(ctx.force){const v=ctx.force;ctx.force=null;ctx.u.add(v.jp);return v;}
  const pool=ctx.pool.filter(f);if(!pool.length)return null;const fresh=pool.filter(v=>!ctx.u.has(v.jp));const v=rnd(fresh.length?fresh:pool);ctx.u.add(v.jp);return v;}
function others(ctx,v,field,n,f=()=>true){
  const seen=new Set([v[field]]),out=[];
  for(const o of shuffle(ctx.pool).concat(shuffle(V[v.th]))){if(f(o)&&!seen.has(o[field])){seen.add(o[field]);out.push(o);}if(out.length>=n)break;}
  return out;}
function pickS(ctx,need){const pool=ctx.sents.filter(s=>!need||s.tok.some(t=>need.has(t)));const src=pool.length?pool:ctx.sents;if(!src.length)return null;
  const fresh=src.filter(s=>!ctx.u.has("s:"+s.fr));const s=rnd(fresh.length?fresh:src);ctx.u.add("s:"+s.fr);return s;}
const jpOpt=o=>`<span class="ojp">${esc(o.jp)}</span>${aid(o.jp,first(o.kana),first(o.ro))}`;
const tokOpt=t=>{const r=info(t);return `<span class="ojp">${esc(t)}</span>${aid(t,r.kana,r.ro)}`;};
const revV=v=>`<span class="j">${esc(v.jp)}</span> · ${esc(v.kana)} · ${esc(v.ro)} = ${esc(v.fr)}`;
const revS=s=>`<span class="j">${esc(s.tok.join(""))}</span> · ${esc(s.ro)}<br>${esc(s.fr)}`;
const typable=v=>!/[〜…]/.test(v.kana);
const frWords=s=>s.replace(/[.,?!]/g,"").split(/\s+/).filter(Boolean);
const wordPrompt=v=>`<div class="prompt">${pic(v.pic)}<div><div class="pjp">${esc(v.jp)}</div><div class="paid">${aid(v.jp,v.kana,v.ro,"pk")}</div></div></div>`;

const G={
 intro(ctx,v){ctx.u.add(v.jp);return {type:"intro",v,speak:first(v.kana)};},
 mcq_jp(ctx,v){v=v||pickV(ctx);if(!v)return null;const o=shuffle([v,...others(ctx,v,"fr",3)]);
  return {type:"mcq",title:"Que signifie ce mot ?",prompt:`<div><div class="pjp">${esc(v.jp)}</div><div class="paid">${aid(v.jp,v.kana,v.ro,"pk")}</div></div>`,speak:first(v.kana),
   options:o.map(x=>({html:esc(x.fr),val:x.fr})),answer:v.fr,reveal:revV(v),key:v.jp};},
 mcq_fr(ctx,v){v=v||pickV(ctx);if(!v)return null;const o=shuffle([v,...others(ctx,v,"jp",3)]);
  return {type:"mcq",title:`Comment dit-on « ${esc(v.fr)} » ?`,prompt:v.pic?pic(v.pic):"",two:true,options:o.map(x=>({html:jpOpt(x),val:x.jp})),answer:v.jp,reveal:revV(v),key:v.jp,speakAfter:first(v.kana)};},
 img(ctx,v){const hasPic=x=>!!x.pic;v=v&&v.pic?v:pickV(ctx,hasPic);if(!v)return G.mcq_jp(ctx);
  const o=others(ctx,v,"pic",3,hasPic);if(o.length<2)return G.mcq_jp(ctx,v);
  return {type:"mcq",title:"Sélectionne la bonne image",prompt:`<div><div class="pjp">${esc(v.jp)}</div><div class="paid">${aid(v.jp,v.kana,v.ro,"pk")}</div></div>`,speak:first(v.kana),two:true,pics:true,
   options:shuffle([v,...o]).map(x=>({html:pic(x.pic),val:x.jp})),answer:v.jp,reveal:revV(v),key:v.jp};},
 listen(ctx,v){if(!jaVoice)return G.mcq_jp(ctx,v);v=v||pickV(ctx);if(!v)return null;const o=shuffle([v,...others(ctx,v,"jp",3)]);
  return {type:"mcq",title:"Qu'entends-tu ?",listen:first(v.kana),prompt:"",two:true,options:o.map(x=>({html:jpOpt(x),val:x.jp})),answer:v.jp,reveal:revV(v),key:v.jp};},
 speak(ctx,v){if(!jaVoice&&!SR.ok)return null;v=v||pickV(ctx);if(!v)return null;
  return {type:"speak",single:true,title:SR.ok?"Prononce ce mot":"Écoute et répète à voix haute",prompt:wordPrompt(v),say:first(v.kana),fr:v.fr,targets:[v.jp,...alts(v.kana)],pass:70,reveal:revV(v),key:v.jp};},
 speak_s(ctx){if(!jaVoice&&!SR.ok)return null;const s=pickS(ctx);if(!s)return null;
  return {type:"speak",title:SR.ok?"Prononce cette phrase":"Écoute et répète la phrase",targets:[s.tok.join(""),s.ka.replace(/ /g,"")],pass:65,reveal:revS(s),prompt:`<div class="bubble">${sentHTML(s.tok)}<div class="small">${esc(s.fr)}</div></div>`,say:s.ka,fr:s.fr};},
 pairs(ctx){const items=[],f=new Set(),j=new Set();
  for(const v of shuffle(ctx.pool)){if(!f.has(v.fr)&&!j.has(v.jp)){f.add(v.fr);j.add(v.jp);items.push({k:v.jp,l:jpOpt(v),r:esc(v.fr),say:first(v.kana)});}if(items.length>=5)break;}
  if(items.length<3)return null;return {type:"pairs",title:"Relie les paires",items};},
 build_fr(ctx,need){const s=pickS(ctx,need);if(!s)return null;const ans=frWords(s.fr);const low=new Set(ans.map(w=>w.toLowerCase()));
  const dis=uniq(shuffle(TH.flatMap(t=>DATA[t].s).filter(x=>x!==s).flatMap(x=>frWords(x.fr)))).filter(w=>!low.has(w.toLowerCase())).slice(0,3);
  return {type:"build",lang:"fr",title:"Traduis cette phrase",sub:"Survole ou touche un mot pour voir sa traduction",jp:s.tok,tiles:shuffle([...ans,...dis]),answer:ans.join(" "),sep:" ",reveal:revS(s),speakAfter:s.ka,say:s.ka,key:"s:"+s.fr};},
 build_jp(ctx){const s=pickS(ctx);if(!s)return null;const set=new Set(s.tok);
  const dis=uniq(shuffle(TH.flatMap(t=>DATA[t].s.flatMap(x=>x.tok)))).filter(t=>!set.has(t)&&!STOP.has(t)).slice(0,3);
  return {type:"build",lang:"jp",title:"Écris cette phrase en japonais",fr:s.fr,hint:s.ka,tiles:shuffle([...s.tok,...dis]),answer:s.tok.join(""),sep:"",reveal:revS(s),speakAfter:s.ka,key:"s:"+s.fr};},
 blank(ctx){const s=pickS(ctx);if(!s)return null;const idx=s.tok.map((t,i)=>i).filter(i=>!STOP.has(s.tok[i]));if(!idx.length)return null;const i=rnd(idx);const ans=s.tok[i];
  const pool=uniq(shuffle(ctx.pool.map(v=>v.jp)).concat(shuffle(V[ctx.th].map(v=>v.jp)))).filter(t=>t!==ans&&!STOP.has(t));
  const o=shuffle([ans,...pool.slice(0,2)]);
  return {type:"mcq",title:"Complète la phrase",prompt:`<div class="bubble">${sentHTML(s.tok,i)}<div class="small">${esc(s.fr)}</div></div>`,
   options:o.map(x=>({html:tokOpt(x),val:x})),answer:ans,reveal:revS(s),speakAfter:s.ka,key:"s:"+s.fr};},
 type(ctx){const v=pickV(ctx,typable);if(!v)return null;
  return {type:"type",title:"Écris en japonais",sub:"En kana ou en rōmaji",prompt:`<div class="prompt">${pic(v.pic)}<div class="pfr">${esc(v.fr)}</div></div>`,answers:[...alts(v.ro),...alts(v.kana),...alts(v.jp)],reveal:revV(v),speakAfter:first(v.kana),key:v.jp};},
 read(ctx){const v=pickV(ctx,x=>typable(x)&&x.kana!==x.jp);if(!v)return G.type(ctx);
  return {type:"type",title:"Lis ce mot",sub:"Écris sa lecture en rōmaji",prompt:`<div><div class="pjp">${esc(v.jp)}</div>${store.help.kana?`<div class="pk">${esc(v.kana)}</div>`:""}</div>`,answers:[...alts(v.ro),...alts(v.kana)],reveal:revV(v),speakAfter:first(v.kana),key:v.jp};},
 num_read(ctx){const max=numMax(ctx);if(!max)return null;const n=randNum(max);const r=numRead(n);const o=new Set([n]);let guard=0;
  while(o.size<4&&guard++<60){const c=rnd([n+100,n-100,n+10,n-10,n+1000,n-1000,n+11,Math.floor(n/10)*10+(n%10+3)%10]);if(c>10&&c<=max)o.add(c);}
  return {type:"mcq",title:"Quel est ce nombre ?",prompt:`<div><div class="pjp">${r.k}</div><div class="paid">${aid(r.k,r.ka,r.ro,"pk")}</div></div>`,two:true,options:shuffle([...o]).map(x=>({html:`<span class="ojp" style="font-family:var(--f-mono)">${fmt(x)}</span>`,val:String(x)})),answer:String(n),reveal:`<span class="j">${r.k}</span> · ${r.ka} · ${r.ro} = ${fmt(n)}`,speakAfter:r.ka};},
 num_write(ctx){const max=numMax(ctx);if(!max)return null;const n=randNum(max);const r=numRead(n);
  return {type:"type",title:"Écris ce nombre en japonais",sub:"En kana, en rōmaji ou en kanji",prompt:`<div class="pjp" style="font-family:var(--f-mono)">${fmt(n)}</div>`,answers:[r.ro,r.ka,r.k],reveal:`<span class="j">${r.k}</span> · ${r.ka} · ${r.ro}`,speakAfter:r.ka};}
};

/* ===== Générateurs (écriture) ===== */
const isKanji=s=>s==="kanji";
const cRev=(s,x)=>isKanji(s)?`<span class="j">${esc(x.c)}</span> · ${esc(x.kana)} · ${esc(x.ro)} = ${esc(x.fr)}`:`<span class="j">${esc(x.c)}</span> = ${esc(x.ro)}`;
const cVal=(s,x)=>isKanji(s)?x.fr:x.ro;
const cSay=(s,x)=>isKanji(s)?first(x.kana):x.c;
function pickC(ctx,f=()=>true){
  if(ctx.force){const x=ctx.force;ctx.force=null;ctx.u.add(x.c);return x;}
  const sc=c=>store.ch[ctx.s][c]??0;
  let pool=ctx.pool.filter(f).filter(x=>!ctx.u.has(x.c));if(!pool.length)pool=ctx.pool.filter(f);if(!pool.length)return null;
  pool=shuffle(pool).sort((a,b)=>sc(a.c)-sc(b.c));const x=rnd(pool.slice(0,Math.max(3,Math.ceil(pool.length/2))));ctx.u.add(x.c);return x;}
function cOthers(ctx,x,n){const key=c=>cVal(ctx.s,c);const seen=new Set([key(x)]),out=[];
  for(const o of shuffle(ctx.pool).concat(shuffle(SCR[ctx.s].list))){if(!seen.has(key(o))&&o.c!==x.c){seen.add(key(o));out.push(o);}if(out.length>=n)break;}return out;}
const KG={
 intro(ctx,x){return {type:"kintro",x,s:ctx.s,speak:cSay(ctx.s,x)};},
 ch2ro(ctx,x){x=x||pickC(ctx);const o=shuffle([x,...cOthers(ctx,x,3)]);const k=isKanji(ctx.s);
  return {type:"mcq",title:k?"Que signifie ce kanji ?":"Quel son fait ce caractère ?",prompt:`<div><div class="pjp" style="font-size:4rem">${esc(x.c)}</div>${k?`<div class="paid">${aid(x.c,x.kana,x.ro,"pk")}</div>`:""}</div>`,speak:cSay(ctx.s,x),
   two:true,options:o.map(y=>({html:k?esc(y.fr):`<span class="ojp rom" style="font-family:var(--f-mono)">${esc(y.ro)}</span>`,val:cVal(ctx.s,y)})),answer:cVal(ctx.s,x),reveal:cRev(ctx.s,x),ch:x.c};},
 ro2ch(ctx,x){x=x||pickC(ctx);const o=shuffle([x,...cOthers(ctx,x,3)]);const k=isKanji(ctx.s);
  return {type:"mcq",title:k?`Quel kanji signifie « ${esc(x.fr)} » ?`:`Quel caractère se lit « ${esc(x.ro)} » ?`,prompt:"",two:true,
   options:o.map(y=>({html:`<span class="ojp big">${esc(y.c)}</span>`,val:y.c})),answer:x.c,reveal:cRev(ctx.s,x),ch:x.c,speakAfter:cSay(ctx.s,x)};},
 listen(ctx,x){if(!jaVoice||isKanji(ctx.s))return KG.ro2ch(ctx,x);x=x||pickC(ctx);const o=shuffle([x,...cOthers(ctx,x,3)]);
  return {type:"mcq",title:"Qu'entends-tu ?",listen:x.c,prompt:"",two:true,options:o.map(y=>({html:`<span class="ojp big">${esc(y.c)}</span>`,val:y.c})),answer:x.c,reveal:cRev(ctx.s,x),ch:x.c};},
 kread(ctx,x){x=x||pickC(ctx);const seen=new Set([x.kana]),o=[x];for(const y of shuffle(ctx.pool).concat(shuffle(SCR.kanji.list))){if(!seen.has(y.kana)){seen.add(y.kana);o.push(y);}if(o.length>=4)break;}
  return {type:"mcq",title:"Comment se lit ce kanji ?",prompt:`<div class="pjp" style="font-size:4rem">${esc(x.c)}</div>`,two:true,
   options:shuffle(o).map(y=>({html:`<span class="ojp">${esc(y.kana)}</span>${store.help.ro?`<span class="okn rom">${esc(y.ro)}</span>`:""}`,val:y.kana})),answer:x.kana,reveal:cRev(ctx.s,x),ch:x.c,speakAfter:first(x.kana)};},
 pairs(ctx){const items=[],seen=new Set();
  for(const x of shuffle(ctx.pool)){const v=cVal(ctx.s,x);if(!seen.has(v)){seen.add(v);items.push({k:x.c,l:`<span class="ojp big">${esc(x.c)}</span>`,r:isKanji(ctx.s)?esc(x.fr):`<span class="rom">${esc(x.ro)}</span>`,say:cSay(ctx.s,x)});}if(items.length>=5)break;}
  if(items.length<3)return null;return {type:"pairs",title:"Relie les paires",items};},
 draw(ctx,x,guide){x=x||pickC(ctx);const k=isKanji(ctx.s);
  return {type:"draw",guide,glyph:x.c,title:guide?(k?`Trace le kanji « ${esc(x.fr)} »`:`Trace « ${esc(x.ro)} »`):(k?`Écris de mémoire le kanji « ${esc(x.fr)} »`:`Écris « ${esc(x.ro)} » de mémoire`),
   sub:guide?"Repasse sur le modèle avec la souris ou le doigt":(k?`Lecture : ${esc(x.kana)}`:`En ${SCR[ctx.s].name.toLowerCase()}`),reveal:cRev(ctx.s,x),ch:x.c,speakAfter:cSay(ctx.s,x)};},
 type(ctx,x){x=x||pickC(ctx);const k=isKanji(ctx.s);
  return {type:"type",title:k?"Écris la lecture de ce kanji":"Écris le son de ce caractère",sub:"En rōmaji",prompt:`<div class="pjp" style="font-size:4rem">${esc(x.c)}</div>`,answers:k?[...alts(x.ro),...alts(x.kana)]:[x.ro,x.c],reveal:cRev(ctx.s,x),ch:x.c,speakAfter:cSay(ctx.s,x)};},
 word(ctx){if(isKanji(ctx.s))return null;const known=new Set(ctx.pool.flatMap(x=>[...x.c]));const big=ctx.pool.length>=20;
  const ok=w=>[...w].every(ch=>known.has(ch)||(big&&/[っッー]/.test(ch)));
  const cand=ALLV.filter(v=>{const w=ctx.s==="hira"?first(v.kana):v.jp;if(ctx.s==="kata"&&!/^[゠-ヿ]+$/.test(v.jp))return false;if(ctx.s==="hira"&&!/^[぀-ゟ]+$/.test(w))return false;return w.length>=2&&ok(w);});
  if(!cand.length)return null;const v=rnd(cand);const w=ctx.s==="hira"?first(v.kana):v.jp;
  return {type:"type",title:"Lis ce mot",sub:"Écris-le en rōmaji",prompt:`<div><div class="pjp">${esc(w)}</div><div class="small">${esc(v.fr)}</div></div>`,answers:[...alts(v.ro),w],reveal:`<span class="j">${esc(w)}</span> · ${esc(v.ro)} = ${esc(v.fr)}`,speakAfter:w};}
};

/* ===== Composition des leçons ===== */
function themeCtx(th,pool){return {th,pool,u:new Set(),sents:sentsFor(th,pool)};}
function buildLesson(spec){
  const m=spec.mode;
  if(m==="weak"){
    const keys=Object.entries(store.weak).filter(([k,c])=>c>0).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);
    const vs=keys.map(k=>ALLV.find(x=>x.jp===k)).filter(Boolean);const q=[];
    vs.forEach((v,i)=>{const ctx=themeCtx(v.th,V[v.th]);const t=["mcq_fr","img","mcq_jp","type"][i%4];if(t==="type"&&typable(v)){ctx.force=v;q.push(G.type(ctx));}else q.push(G[t==="type"?"mcq_jp":t](ctx,v));});
    return q.filter(Boolean);}
  if(m==="mix"){
    const open=TH.filter(t=>(store.prog[t]||0)>0);const q=[];const types=["mcq_jp","mcq_fr","img","build_fr","blank","listen"];
    for(let i=0;i<12;i++){const t=rnd(open);const ctx=themeCtx(t,knownNow(t));q.push(i===5?G.pairs(ctx):G[rnd(types)](ctx));}
    return q.filter(Boolean);}
  if(m==="knew"||m==="krev"){
    const s=spec.s,list=SCR[s].list,intro=list.filter(x=>store.ch[s][x.c]!==undefined);
    if(m==="knew"){
      const S=list.filter(x=>store.ch[s][x.c]===undefined).slice(0,5);if(!S.length)return [];
      const ctx={s,pool:intro.concat(S),u:new Set()};const q=[];
      S.forEach(x=>{q.push(KG.intro(ctx,x),KG.draw(ctx,x,true),KG.ch2ro(ctx,x));});
      q.push(KG.pairs(ctx));shuffle(S).slice(0,2).forEach(x=>q.push(KG.ro2ch(ctx,x)));
      if(isKanji(s))shuffle(S).slice(0,2).forEach(x=>q.push(KG.kread(ctx,x)));else q.push(KG.listen(ctx,rnd(S)));
      q.push(KG.draw(ctx,rnd(S),false),KG.type(ctx,rnd(S)));
      return q.filter(Boolean);}
    const ctx={s,pool:intro,u:new Set()};
    const q=[KG.ch2ro(ctx),KG.ro2ch(ctx),KG.pairs(ctx),KG.listen(ctx),KG.draw(ctx,null,false),KG.type(ctx),KG.word(ctx),KG.ch2ro(ctx),KG.draw(ctx,null,false),KG.ro2ch(ctx),isKanji(s)?KG.kread(ctx):KG.word(ctx),KG.type(ctx)];
    return q.filter(Boolean);}
  if(m==="endless"||m==="chrono"){const ctx=themeCtx(spec.th,knownNow(spec.th));return [gameEx(spec,ctx)].filter(Boolean);}
  const th=spec.th,lesson=spec.lesson;
  const ctx=themeCtx(th,knownOf(th,lesson.g));let q=[];
  if(lesson.kind==="learn"){
    const g=groupsOf(th)[lesson.g];const need=new Set(g.map(v=>v.jp));
    g.forEach(v=>{q.push(G.intro(ctx,v));q.push(v.pic&&Math.random()<.6?G.img(ctx,v):G.mcq_jp(ctx,v));});
    q.push(G.pairs(ctx));
    shuffle(g).slice(0,2).forEach(v=>q.push(G.mcq_fr(ctx,v)));
    if(jaVoice)q.push(G.listen(ctx,rnd(g)));q.push(G.speak(ctx,rnd(g)));
    const s=G.build_fr(ctx,need);q.push(s||G.img(ctx,rnd(g)));
  }else if(lesson.kind==="review"){
    q=[G.img(ctx),G.mcq_fr(ctx),G.pairs(ctx),G.build_fr(ctx),G.mcq_jp(ctx),G.blank(ctx),G.listen(ctx),G.build_fr(ctx),G.speak_s(ctx),G.img(ctx),G.build_jp(ctx)];
    if(th==="nombres")q.splice(4,0,G.num_read(ctx),G.num_read(ctx));
  }else{
    q=[G.type(ctx),G.read(ctx),G.build_jp(ctx),G.blank(ctx),G.type(ctx),G.pairs(ctx),G.build_jp(ctx),G.read(ctx),G.speak_s(ctx),G.type(ctx),G.build_fr(ctx)];
    if(th==="nombres")q=[G.num_read(ctx),G.num_write(ctx),G.type(ctx),G.build_jp(ctx),G.num_read(ctx),G.num_write(ctx),G.read(ctx),G.blank(ctx),G.num_write(ctx),G.pairs(ctx)];
  }
  return q.filter(Boolean);
}
function gameEx(spec,ctx){
  if(ctx.u.size>Math.max(6,ctx.pool.length-2))ctx.u.clear();
  const types=spec.mode==="chrono"?["mcq_jp","mcq_fr","img","mcq_jp"]:["mcq_jp","mcq_fr","img","listen","blank","build_fr","mcq_jp","img"];
  if(spec.th==="nombres"&&numMax(ctx))types.push("num_read","num_read");
  for(let i=0;i<6;i++){const e=G[rnd(types)](ctx);if(e&&e.type!=="pairs")return e;}
  return G.mcq_jp(ctx);}
