/* ===== Utilitaires ===== */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const first=s=>s.split(" / ")[0];
const alts=s=>s.split(" / ").map(x=>x.trim()).flatMap(x=>x.includes("(")?[x.replace(/[()]/g,""),x.replace(/\(.*\)/,"")]:[x]);
const uniq=a=>[...new Set(a)];
function toHira(s){return s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
function norm(s){
  s=toHira(s).toLowerCase().normalize("NFC")
   .replace(/[āâ]/g,"a").replace(/[īî]/g,"i").replace(/[ūû]/g,"u").replace(/[ēê]/g,"e").replace(/[ōô]/g,"o")
   .replace(/[\s'’\-.,!?。、・ー()]/g,"");
  return s.replace(/ou/g,"o").replace(/([aiueo])\1+/g,"$1");
}
/* rōmaji → hiragana pour l'aperçu de saisie */
const RK=(()=>{const m={a:"あ",i:"い",u:"う",e:"え",o:"お"};
 const rows={k:"かきくけこ",s:"さしすせそ",t:"たちつてと",n:"なにぬねの",h:"はひふへほ",m:"まみむめも",y:"や-ゆ-よ",r:"らりるれろ",w:"わ---を",g:"がぎぐげご",z:"ざじずぜぞ",d:"だぢづでど",b:"ばびぶべぼ",p:"ぱぴぷぺぽ"};
 for(const c in rows)"aiueo".split("").forEach((v,i)=>{const k=rows[c][i];if(k!=="-")m[c+v]=k;});
 Object.assign(m,{shi:"し",chi:"ち",tsu:"つ",fu:"ふ",ji:"じ",si:"し",ti:"ち",tu:"つ",hu:"ふ"});
 const yo={ky:"き",sh:"し",ch:"ち",ny:"に",hy:"ひ",my:"み",ry:"り",gy:"ぎ",j:"じ",by:"び",py:"ぴ"};
 for(const c in yo){m[c+"a"]=yo[c]+"ゃ";m[c+"u"]=yo[c]+"ゅ";m[c+"o"]=yo[c]+"ょ";}
 m.je="じぇ";return m;})();
function r2k(s){
  s=s.toLowerCase().replace(/ā/g,"aa").replace(/ī/g,"ii").replace(/ū/g,"uu").replace(/ē/g,"ei").replace(/ō/g,"ou");
  let out="",i=0;
  while(i<s.length){const c=s[i];
    if(c==="n"){if(s[i+1]==="'"){out+="ん";i+=2;continue;}if(i+1===s.length||!/[aiueoy]/.test(s[i+1])){out+="ん";i++;continue;}}
    if(/[bcdfghjkmprstwz]/.test(c)&&s[i+1]===c){out+="っ";i++;continue;}
    let hit=false;for(const L of [3,2,1]){const p=s.substr(i,L);if(RK[p]){out+=RK[p];i+=L;hit=true;break;}}
    if(!hit){out+=c;i++;}}
  return out;}
