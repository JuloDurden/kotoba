/* ===== Lectures, infobulles, visuels ===== */
function info(t){const v=ALLV.find(x=>x.jp===t);if(v)return {kana:first(v.kana),ro:first(v.ro),fr:v.fr};const m=TOK[t];return m?{kana:m[0],ro:m[1],fr:m[2]}:{kana:t,ro:"",fr:""};}
function aid(jp,kana,ro,cls="okn"){let h="";if(store.help.kana&&kana&&kana!==jp)h+=`<span class="${cls}">${esc(kana)}</span>`;if(store.help.ro&&ro)h+=`<span class="${cls} rom">${esc(ro)}</span>`;return h;}
function sentHTML(tok,gap=-1){
  return `<div class="jps">${tok.map((t,i)=>{
    if(i===gap)return `<span class="w gapw"><span class="gap"></span>${store.help.ro?'<span class="wr">___</span>':""}</span>`;
    const r=info(t);
    return `<span class="w" tabindex="0"><span class="wj">${esc(t)}</span>${store.help.kana&&r.kana!==t?`<span class="wk">${esc(r.kana)}</span>`:""}${store.help.ro?`<span class="wr">${esc(r.ro)}</span>`:""}${r.fr?`<span class="tip">${esc(r.fr)}</span>`:""}</span>`;}).join("")}</div>`;}
function tileJP(t){const r=info(t);return `<span>${esc(t)}</span>${store.help.ro&&r.ro?`<small>${esc(r.ro)}</small>`:""}`;}
const fmt=n=>n.toLocaleString("fr-FR");
function clockSVG(h,m){const ha=((h%12)+m/60)*30,ma=m*6;const p=(a,l)=>[50+l*Math.sin(a*Math.PI/180),50-l*Math.cos(a*Math.PI/180)].map(x=>x.toFixed(1));
  let ticks="";for(let i=0;i<12;i++){const [x1,y1]=p(i*30,38),[x2,y2]=p(i*30,i%3?42:44);ticks+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;}
  const [hx,hy]=p(ha,24),[mx,my]=p(ma,34);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="var(--fg)" stroke-width="4"/><g stroke="var(--muted)" stroke-width="3" stroke-linecap="round">${ticks}</g><line x1="50" y1="50" x2="${hx}" y2="${hy}" stroke="var(--fg)" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="50" x2="${mx}" y2="${my}" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="var(--fg)"/></svg>`;}
/* Arbre généalogique : la personne recherchée est mise en couleur */
let picSeq=0;
function person(x,y,s,sex,fill,stroke){
  const h=34*s,hy=y-h+6*s;
  const body=sex==="f"?`<path d="M${x} ${(y-h+12*s).toFixed(1)}L${(x-9*s).toFixed(1)} ${y}H${(x+9*s).toFixed(1)}Z"/>`
    :`<rect x="${(x-7*s).toFixed(1)}" y="${(y-h+13*s).toFixed(1)}" width="${(14*s).toFixed(1)}" height="${(h-13*s).toFixed(1)}" rx="${(4*s).toFixed(1)}"/>`;
  return `<g fill="${fill}" stroke="${stroke||"none"}" stroke-width="1.5"><circle cx="${x}" cy="${hy.toFixed(1)}" r="${(6*s).toFixed(1)}"/>${body}</g>`;}
function familySVG(role){
  const on="var(--accent)",off="var(--edge)",me="var(--fg)";
  const c=k=>role==="family"||role===k||(role==="child"&&(k==="son"||k==="dau"))?on:off;
  const line=(d)=>`<path d="${d}" fill="none" stroke="var(--edge)" stroke-width="2"/>`;
  const meTag=(x,y)=>`<text x="${x}" y="${y}" font-size="9" font-weight="700" text-anchor="middle" fill="var(--muted)">moi</text>`;
  if(["son","dau","child","husband","wife"].includes(role)){
    const sp=role==="wife"?"f":"m";
    return `<svg viewBox="0 0 140 112" aria-hidden="true">${line("M52 30H88M70 30V64M55 64H85M55 64V72M85 64V72")}
      ${person(45,52,.85,"n",me)}${meTag(45,62)}${person(95,52,.9,sp,role==="husband"||role==="wife"?on:off)}
      ${person(55,104,.6,"m",c("son"))}${person(85,104,.6,"f",c("dau"))}</svg>`;}
  if(role==="friend")return `<svg viewBox="0 0 140 112" aria-hidden="true">${person(48,96,.9,"n",me)}${meTag(48,107)}${person(92,96,.9,"n",on)}<path d="M62 70H78" stroke="var(--edge)" stroke-width="2" stroke-dasharray="3 3"/></svg>`;
  return `<svg viewBox="0 0 140 112" aria-hidden="true">${line("M60 28H80M70 28V54M20 54H120M20 54V62M45 54V62M70 54V64M95 54V70M120 54V70")}
    ${person(55,44,.9,"m",c("father"))}${person(85,44,.9,"f",c("mother"))}
    ${person(20,100,.85,"m",c("ob"))}${person(45,100,.85,"f",c("os"))}${person(70,100,.75,"n",role==="family"?on:me)}${meTag(70,110)}${person(95,100,.6,"m",c("yb"))}${person(120,100,.6,"f",c("ys"))}</svg>`;}
function mapSVG(iso){const id="cl"+(++picSeq);const d=GEO[iso];if(!d)return "";
  return `<svg viewBox="-3 -3 106 106" aria-hidden="true"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><image href="assets/flags/${iso}.svg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/><path d="${d}" fill="none" stroke="var(--fg)" stroke-width="1.2" stroke-linejoin="round"/></svg>`;}
function pic(spec){if(!spec)return "";const i=spec.indexOf(":"),t=spec.slice(0,i),v=spec.slice(i+1);
  if(t==="e")return ICONS[v]?`<span class="pic ill" aria-hidden="true"><img src="assets/img/${ICONS[v]}.svg" alt="" draggable="false"></span>`:`<span class="pic emo" aria-hidden="true">${v}</span>`;
  if(t==="m")return `<span class="pic map">${mapSVG(v)}</span>`;
  if(t==="g")return `<span class="pic fam">${familySVG(v)}</span>`;
  if(t==="p")return `<span class="pic nat" aria-hidden="true"><svg viewBox="0 0 100 100">${person(42,92,2.2,"n","var(--fg)")}<image href="assets/flags/${v}.svg" x="58" y="10" width="38" height="28.5" preserveAspectRatio="none"/><rect x="58" y="10" width="38" height="28.5" fill="none" stroke="var(--line)" stroke-width="2"/></svg></span>`;
  if(t==="c")return `<span class="pic sw" style="background:${v}" aria-hidden="true"></span>`;
  if(t==="n"){const n=+v;return `<span class="pic num" aria-hidden="true">${n>=1&&n<=10?`<span class="dots">${"<i></i>".repeat(n)}</span>`:""}<b>${fmt(n)}</b></span>`;}
  if(t==="t"){const [h,m]=v.split(":").map(Number);return `<span class="pic clock" aria-hidden="true">${clockSVG(h,m)}</span>`;}
  if(t==="d")return `<span class="pic cal" aria-hidden="true"><i></i><b>${esc(v)}</b></span>`;
  if(t==="f"){const n=+v;return `<span class="pic freq" aria-hidden="true">${[0,1,2,3,4].map(k=>`<i class="${k<n?"on":""}"></i>`).join("")}</span>`;}
  return "";}
