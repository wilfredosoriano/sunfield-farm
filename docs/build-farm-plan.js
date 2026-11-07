// node docs/build-farm-plan.js  →  writes docs/farm-plan.svg from docs/farm-layout.js (top-down, 4 px per metre)
const fs=require('fs'), path=require('path'), F=require('./farm-layout.js');
const X0=-118, X1=52, Z0=-112, Z1=92, K=4, W=(X1-X0)*K, H=(Z1-Z0)*K;
const px=x=>((x-X0)*K).toFixed(1), pz=z=>((z-Z0)*K).toFixed(1);
// Catmull-Rom spline through the points (what the game will use for the road meshes), sampled every ~1 m
function spline(pts,closed){const P=closed?[pts[pts.length-1],...pts,pts[0],pts[1]]:[pts[0],...pts,pts[pts.length-1]], out=[];
  for(let i=1;i<P.length-2;i++){const [a,b,c,d]=[P[i-1],P[i],P[i+1],P[i+2]], n=Math.max(2,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])));
    for(let k=0;k<n;k++){const t=k/n, t2=t*t, t3=t2*t, f=(p0,p1,p2,p3)=>.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3); out.push([f(a[0],b[0],c[0],d[0]),f(a[1],b[1],c[1],d[1])]);}}
  out.push(closed?out[0]:pts[pts.length-1]); return out;}
const poly=p=>p.map(([x,z])=>px(x)+','+pz(z)).join(' ');
// an animal area's fence: the planning rectangle softened into an irregular closed curve (corners cut, sides gently bowed)
function organic([x0,z0,x1,z1],seed){let a=seed; const r=()=>((a=(a*9301+49297)%233280)/233280-.5), w=x1-x0, d=z1-z0, c=Math.min(w,d)*.18;
  return spline([[x0+c,z0+r()*1.5],[ (x0+x1)/2+r()*3,z0-1.2+r()],[x1-c,z0+r()*1.5],[x1+r(),z0+c],[x1+1+r(),(z0+z1)/2+r()*3],[x1+r(),z1-c],[x1-c,z1+r()*1.5],[(x0+x1)/2+r()*3,z1+1.2+r()],[x0+c,z1+r()*1.5],[x0+r(),z1-c],[x0-1+r(),(z0+z1)/2+r()*3],[x0+r(),z0+c]],true);}
let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H+90}" font-family="Arial, sans-serif"><rect width="100%" height="100%" fill="#dfe8c9"/>`;
const T=(x,z,t,size=12,col='#1f2a14',w=700,anchor='middle')=>s+=`<text x="${px(x)}" y="${pz(z)}" font-size="${size}" font-weight="${w}" fill="${col}" text-anchor="${anchor}" paint-order="stroke" stroke="#f4f6ec" stroke-width="3">${t}</text>`;
const R=(x0,z0,x1,z1,fill,stroke,sw=1.5,rx=0,dash='')=>s+=`<rect x="${px(x0)}" y="${pz(z0)}" width="${((x1-x0)*K).toFixed(1)}" height="${((z1-z0)*K).toFixed(1)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
// highway and paddies along the farm road
R(X0,-115.6,X1,-104.4,'#5b5e62','#3f4245',1); s+=`<line x1="${px(X0)}" y1="${pz(-110)}" x2="${px(X1)}" y2="${pz(-110)}" stroke="#f1c40f" stroke-width="1.5" stroke-dasharray="10 10"/>`;
T(-100,-112.5,'HIGHWAY (paved, z = −110)',11,'#fff',700,'start');
for(let z=-96;z<-40;z+=11) for(const x of [18,52]) R(x-5,z-4.5,x+5,z+4.5,'#b9cf8e','#8fa86a',1);
// farm lot fence (smooth)
s+=`<polygon points="${poly(spline(F.fence,true))}" fill="#cfdcae" stroke="#6d4c35" stroke-width="2.5" stroke-dasharray="7 3"/>`;
// orchard
s+=`<polygon points="${poly(spline(F.orchard.pts,true))}" fill="#b2cf8a" stroke="#5e8a3a" stroke-width="1.5"/>`;
for(let z=-2;z<44;z+=4) for(let x=23;x<36;x+=4) if(x<35-Math.abs(z-20)*.05) s+=`<circle cx="${px(x+(z%8?1.5:0))}" cy="${pz(z)}" r="5.5" fill="#5f9a46" stroke="#3f6b2e"/>`;
T(29,20,'ORCHARD',11); T(29,25,'mangga · saging · kalamansi',8,'#2f4a1c',400);
// canal
s+=`<polyline points="${poly(spline(F.canal))}" fill="none" stroke="#5b9bb5" stroke-width="${1.4*K}" stroke-linecap="round" opacity=".85"/>`;
// animal areas
const COL={coop:'#f2e3b3',broiler:'#efd8a8',cows:'#c9dc9a',goat:'#d7e2a8',pig:'#e8cdbd',fish:'#a9d0d8',duck:'#bcd9c9'};
F.areas.forEach((a,ai)=>{const [x0,z0,x1,z1]=a.fence; s+=`<polygon points="${poly(organic(a.fence,ai*7+3))}" fill="${COL[a.type]}" stroke="#7a5a3a" stroke-width="2" stroke-dasharray="5 2"/>`;
  a.slots.forEach(([x,z,w,d],i)=>{const water=a.water&&a.type==='fish'; R(x-w/2,z-d/2,x+w/2,z+d/2,water?'#6fa9bf':'#fffaf0',water?'#3f7f97':'#5d4a36',1.2,water?5:1); T(x,z+3,`${i+1}`,9,'#3a2c1c',700);});
  T((x0+x1)/2,z0+2.6,a.name.toUpperCase(),9.5,'#2a1c10'); s+=`<circle cx="${px(a.gate[0])}" cy="${pz(a.gate[1])}" r="5" fill="#c0392b" stroke="#fff" stroke-width="1.5"/>`;});
// crop field: 4 beds of 6 × 6 plots with soil tracks between them
{const f=F.field, bed=6*f.plot, half=bed+f.gap/2;
  for(const sx of [-1,1]) for(const sz of [-1,1]){const cx=f.x+sx*(bed/2+f.gap/2), cz=f.z+sz*(bed/2+f.gap/2); R(cx-bed/2,cz-bed/2,cx+bed/2,cz+bed/2,'#9b7a52','#6d5438',1.2);
    for(let k=1;k<6;k++){s+=`<line x1="${px(cx-bed/2)}" y1="${pz(cz-bed/2+k*f.plot)}" x2="${px(cx+bed/2)}" y2="${pz(cz-bed/2+k*f.plot)}" stroke="#7d6040" stroke-width=".8"/>`;}}
  T(f.x,f.z-half-1.5,'CROP FIELD · 4 beds of 6 × 6 plots',10,'#3a2c1c');}
// roads on top, drawn to width
const RC={'farm road: dirt with gravel shoulders':'#b39a73','main farm service road: dirt':'#b9a07a','farm vehicle track':'#c4ad88',footpath:'#d8c7a6'};
for(const r of F.roads){const c=RC[r.kind]||RC.footpath, pts=r.kind.startsWith('footpath')?r.pts:spline(r.pts,false);   // footpaths run straight along bed and dike edges
  s+=`<polyline points="${poly(pts)}" fill="none" stroke="#8f7a58" stroke-width="${(r.w+.8)*K}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s+=`<polyline points="${poly(pts)}" fill="none" stroke="${c}" stroke-width="${r.w*K}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(r.w>=3.5) s+=`<polyline points="${poly(pts)}" fill="none" stroke="#a38a63" stroke-width="1" stroke-dasharray="4 6"/>`;}
for(const t of F.turning) s+=`<circle cx="${px(t.x)}" cy="${pz(t.z)}" r="${t.r*K}" fill="#b9a07a" stroke="#8f7a58" stroke-width="1.2" opacity=".9"/>`;
// fixed buildings
for(const b of F.buildings){R(b.x-b.w/2,b.z-b.d/2,b.x+b.w/2,b.z+b.d/2,b.id==='garage'?'#c9cfd4':b.id==='house'?'#f2c7b0':'#d9cfbd','#3a2c1c',1.5,2); T(b.x,b.z+1,b.name,9.5);}
{const g=F.buildings.find(b=>b.id==='garage'); for(let i=0;i<4;i++){const x=g.x-g.w/2+2.95+i*5.9; R(x-2.4,g.z-3.8,x+2.4,g.z+3.4,'#e8ecef','#7a8590',1); T(x,g.z+3,`bay ${i+1}`,7,'#33414c',600);}}
T(F.gate.x+2,F.gate.z-3,'GATE',10,'#7a2a1a',800,'start');
// legend
const ly=H+16; [['#b39a73','farm road 4.5 m'],['#b9a07a','service road 4.5 m'],['#c4ad88','vehicle track 3.5 m'],['#d8c7a6','footpath 1.5 m'],['#5b9bb5','irrigation canal'],['#c0392b','area gate']].forEach(([c,t],i)=>{
  s+=`<rect x="${12+(i%3)*220}" y="${ly+Math.floor(i/3)*24}" width="26" height="10" fill="${c}"/><text x="${46+(i%3)*220}" y="${ly+9+Math.floor(i/3)*24}" font-size="12">${t}</text>`;});
s+=`<text x="12" y="${ly+66}" font-size="11" fill="#444">1 m = ${K} px · x east, z south · numbered boxes are building slots (up to 3 per animal); slot sizes differ by animal</text></svg>`;
fs.writeFileSync(path.join(__dirname,'farm-plan.svg'),s); console.log('wrote docs/farm-plan.svg');
