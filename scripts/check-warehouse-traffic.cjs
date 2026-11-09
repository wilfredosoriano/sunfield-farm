// Bagsakan deliveries on the lane network: the real van, trader and dispatch code runs for 15 simulated minutes.
// All three vans must get a turn and empty the warehouse, both traders must finish, only one delivery uses the dock shoulder at a time,
// and no two vehicles may overlap.
const fs=require('fs'),assert=require('assert/strict');const html=fs.readFileSync('public/index.html','utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'missing source: '+a);return html.slice(i,j);};
const lanes=cut('/* ================= Lane network','function updateTraffic(dt,t){'),overlap=cut('function trafficOverlap(','const TRAFFIC_JUNCTIONS='),shops=cut('let SHOPS=null;','const spotTaken=');
const vanSource=cut('const vans=[0,1,2]',"// other traders' trucks"),traderSource=cut('const BAYX=WHX+13','function bayTaken('),dispatch=cut('function warehouseDispatchClear(','let bizT=0');
const biz=cut('function updateBiz(dt,t){','  // the gate opens for the vans')+'}';
const object=()=>({visible:true,userData:{},position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{y:0}});
const E=new Function('makeVan','makeTraderTruck',`const HZ=-110,LE=HZ+1.75,LW=HZ-1.75,TX0=-200,TX1=430,PX=170,HWX=-60,PSX=92,SSX=-18,WHX=62,FX=395,TSPOTS=[[PX+8,-125],[PX+11,-125],[PX+14,-125]],VAN_CAP=60;
  const up=[];for(let k=0;k<=40;k++){const u=k/40;up.push([150+u*82,-189-u*73]);} const HROADS=[{s:up}],MTN_STOP={k:40};
  let facRun=0;const gameHealth={errors:[]},VEH={},OWN=()=>false,S={veh:{},wh:{owned:true,stock:{rice:180}}},TRAFFIC_JUNCTIONS=[],save=()=>{},bizOpen=()=>false,renderBiz=()=>{},sfx=()=>{},lerpAng=(a,b)=>b;
  const whN=()=>Object.values(S.wh.stock).reduce((a,b)=>a+b,0),bayTaken=()=>null;
  ${overlap}\n${shops}\n${lanes}\n${vanSource}\n${traderSource}\n${dispatch}\n${biz}
  return {vans,traders,S,update:(dt,t)=>{lnStep(dt);updateBiz(dt,t);},overlap:trafficOverlap};`)(object,object);
let completed=0,traderTrips=0;const used=new Set();
for(let t=0;t<900;t+=.05){const before=E.vans.map(v=>v.state),bt=E.traders.map(v=>v.state);E.update(.05,t);
  E.vans.forEach((v,i)=>{if(v.state!=='home')used.add(i);if(before[i]==='unload'&&v.state==='home')completed++;});E.traders.forEach((v,i)=>{if(bt[i]==='out'&&v.state==='away')traderTrips++;});
  assert(E.vans.filter(v=>v.state!=='home').length+E.traders.filter(v=>v.state!=='away').length<=1,'Shared warehouse entrance dispatched conflicting deliveries');
  const all=[...E.vans.map(v=>({g:v.g,len:8.4,width:2.3})),...E.traders.filter(v=>v.g.visible).map(v=>({g:v.g,len:7.6,width:2.5}))];
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j];assert(!E.overlap({x:a.g.position.x,z:a.g.position.z,a:a.g.rotation.y,len:a.len,width:a.width},{x:b.g.position.x,z:b.g.position.z,a:b.g.rotation.y,len:b.len,width:b.width},0),'vehicle overlap at '+t.toFixed(1));}}
console.log({completed,traderTrips,vansUsed:[...used],stock:E.S.wh.stock});assert.equal(completed,3);assert.equal(Object.keys(E.S.wh.stock).length,0);assert(traderTrips>=2,'Traders must also finish');assert.equal(used.size,3,'All three delivery vans must get a turn');
console.log('PASS: the dispatch, trader and van code on the lane network completes all deliveries without overlaps or warehouse deadlocks.');
