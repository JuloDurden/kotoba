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
function pic(spec){if(!spec)return "";const i=spec.indexOf(":"),t=spec.slice(0,i),v=spec.slice(i+1);
  if(t==="e")return `<span class="pic emo" aria-hidden="true">${v}</span>`;
  if(t==="c")return `<span class="pic sw" style="background:${v}" aria-hidden="true"></span>`;
  if(t==="n"){const n=+v;return `<span class="pic num" aria-hidden="true">${n>=1&&n<=10?`<span class="dots">${"<i></i>".repeat(n)}</span>`:""}<b>${fmt(n)}</b></span>`;}
  if(t==="t"){const [h,m]=v.split(":").map(Number);return `<span class="pic clock" aria-hidden="true">${clockSVG(h,m)}</span>`;}
  if(t==="d")return `<span class="pic cal" aria-hidden="true"><i></i><b>${esc(v)}</b></span>`;
  if(t==="f"){const n=+v;return `<span class="pic freq" aria-hidden="true">${[0,1,2,3,4].map(k=>`<i class="${k<n?"on":""}"></i>`).join("")}</span>`;}
  return "";}
