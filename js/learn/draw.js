/* ===== Tracé et notation automatique ===== */
const PEN=.065;
async function fontReady(){try{await document.fonts.load('500 100px "Zen Kaku Gothic New"');}catch(e){}}
function drawGlyph(g,ch,N,color,thick){g.fillStyle=color;g.strokeStyle=color;g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";
  const fs=N*(ch.length>1?.46:.74);g.font=`500 ${fs}px "Zen Kaku Gothic New","Hiragino Sans","Yu Gothic",sans-serif`;g.fillText(ch,N/2,N/2+N*.02);if(thick){g.lineWidth=thick;g.strokeText(ch,N/2,N/2+N*.02);}}
function drawStrokes(g,strokes,N,w,color){g.strokeStyle=color;g.lineWidth=w;g.lineCap="round";g.lineJoin="round";
  strokes.forEach(st=>{g.beginPath();st.forEach((p,i)=>i?g.lineTo(p[0]*N,p[1]*N):g.moveTo(p[0]*N,p[1]*N));if(st.length===1)g.lineTo(st[0][0]*N+.1,st[0][1]*N);g.stroke();});}
function grade(strokes,ch){const N=96;
  const mk=()=>{const c=document.createElement("canvas");c.width=c.height=N;return c.getContext("2d",{willReadFrequently:true});};
  const gl=mk(),glT=mk(),us=mk(),usT=mk();
  drawGlyph(gl,ch,N,"#000",0);drawGlyph(glT,ch,N,"#000",N*.13);drawStrokes(us,strokes,N,N*PEN,"#000");drawStrokes(usT,strokes,N,N*.15,"#000");
  const a=c=>c.getImageData(0,0,N,N).data;const A=a(gl),AT=a(glT),U=a(us),UT=a(usT);
  let u=0,uIn=0,g=0,gCov=0;for(let i=3;i<A.length;i+=4){if(U[i]>64){u++;if(AT[i]>64)uIn++;}if(A[i]>64){g++;if(UT[i]>64)gCov++;}}
  if(u<20||!g)return {ok:false,score:0};
  const prec=uIn/u,cov=gCov/g,score=Math.round(Math.min(prec,cov)*100);
  return {ok:prec>=.7&&cov>=.62,score};}
function setupPad(ex,onChange){
  const wrap=$("#padwrap"),cg=$("#cg"),cp=$("#cp");const dpr=Math.max(1,window.devicePixelRatio||1);
  const size=()=>wrap.getBoundingClientRect().width;let S=size();
  [cg,cp].forEach(c=>{c.width=Math.round(S*dpr);c.height=Math.round(S*dpr);c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);});
  const css=getComputedStyle(document.documentElement);const col=n=>css.getPropertyValue(n).trim()||"#888";
  const g=cg.getContext("2d"),p=cp.getContext("2d");
  const grid=()=>{g.clearRect(0,0,S,S);g.strokeStyle=col("--line");g.lineWidth=1.5;g.setLineDash([6,6]);g.beginPath();g.moveTo(S/2,8);g.lineTo(S/2,S-8);g.moveTo(8,S/2);g.lineTo(S-8,S/2);g.stroke();g.setLineDash([]);};
  const guide=async()=>{grid();if(ex.guide){await fontReady();g.globalAlpha=.22;drawGlyph(g,ex.glyph,S,col("--fg"),0);g.globalAlpha=1;}};
  guide();
  ex.strokes=[];let cur=null;
  const redraw=()=>{p.clearRect(0,0,S,S);drawStrokes(p,ex.strokes,S,S*PEN,col("--fg"));};
  const pt=e=>{const r=cp.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))];};
  cp.onpointerdown=e=>{if(ex.locked)return;e.preventDefault();try{cp.setPointerCapture(e.pointerId);}catch(_){}cur=[pt(e)];ex.strokes.push(cur);redraw();};
  cp.onpointermove=e=>{if(!cur)return;cur.push(pt(e));redraw();};
  cp.onpointerup=cp.onpointercancel=()=>{if(cur){cur=null;onChange();}};
  ex.clear=()=>{ex.strokes=[];redraw();onChange();};
  ex.undo=()=>{ex.strokes.pop();redraw();onChange();};
  ex.showModel=async()=>{await fontReady();g.globalAlpha=.35;drawGlyph(g,ex.glyph,S,col("--good"),0);g.globalAlpha=1;};
}
