const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const routeSource = html.slice(html.indexOf('function mkRoute('), html.indexOf('const ROUTES='));
const trafficSource = html.slice(html.indexOf('function trafficOverlap('), html.indexOf('/* ================= Lane network'));
const dispatchSource = html.slice(html.indexOf('const FARM_DISPATCH='), html.indexOf('const activeVehs='));
function object(x, z) {
  return { visible: true, userData: {}, position: { x, y: 0, z, set(x, y, z) { Object.assign(this, { x, y, z }); } }, rotation: { y: 0 } };
}
function create(recovering) {
  const S = { veh: { chicken: { trip: null }, pig: { trip: null } } };
  const VEH = { chicken: { obj: object(-8, -10), slot: -8, len: 7.2 }, pig: { obj: object(8, -10), slot: 8, len: 6.4 } };
  let clock = 100000;
  const build = new Function('S', 'VEH', 'performance', `
    const FARM={areas:[]};const SPD={slow:3.5,dirt:4},G0=-10,HZ=-110,STOP={pickup:12};let SNAP=[];
    const save=()=>{},lerpAng=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;
    ${routeSource}
    ${trafficSource}
    const routes={};for(const v in VEH){const x=VEH[v].slot;routes[v]={out:mkRoute([[x,-10,4],[x,-2,4],[10,0,4],[10,30]]),back:mkRoute([[10,30,4],[10,0,4],[x,-2,4],[x,-10]])};}
    const routesFor=v=>routes[v];
    ${dispatchSource}
    return {S,VEH,routes,phase:vehPhase,dispatch:FARM_DISPATCH,routePos,step(now,dt){
      SNAP=Object.keys(VEH).filter(v=>S.veh[v].trip).map(v=>({ref:VEH[v].obj,x:VEH[v].obj.position.x,z:VEH[v].obj.position.z,a:VEH[v].obj.rotation.y,len:VEH[v].len}));
      updateFarmDispatch(now,dt);
      for(const v in VEH){const tr=S.veh[v].trip;if(!tr)continue;const V=VEH[v],P=vehPhase(v,now);let q;
        if(P.ph==='done'){S.veh[v].trip=null;continue;}
        if(tr.farmBlocked)q={x:V.obj.position.x,z:V.obj.position.z,ang:V.obj.rotation.y};
        else if(P.ph==='queued')q={x:V.slot,z:G0,ang:0};
        else if(P.ph==='yield')q=routePos(P.yieldRoute,P.e);
        else if(P.ph==='out')q=routePos(P.R.out,P.e);
        else if(P.ph==='stop')q=routePos(P.R.out,P.R.out.T);
        else if(P.ph==='back')q=routePos(P.R.back,P.e);
        if(q&&trafficCanMove(V.obj,q.x,q.z,q.ang,V.len)){V.obj.position.set(q.x,0,q.z);V.obj.rotation.y=q.ang;}
        else if(tr.t0)tr.t0+=dt*1000;
      }
    }};
  `);
  const sim = build(S, VEH, { now: () => clock });
  for (const v of Object.keys(VEH)) S.veh[v].trip = { dest: 'pickup', area: v === 'chicken' ? 'broiler' : 'pig', t0: clock, driver: v === 'chicken' ? 'farmer' : 'h1', loaded: false };
  if (recovering) {
    S.veh.chicken.trip.loaded = true;
    S.veh.chicken.trip.got = { live_chicken: 10 };
    S.veh.chicken.trip.t0 = clock - (sim.routes.chicken.out.T + 12 + 3.5) * 1000;
    S.veh.pig.trip.t0 = clock - (sim.routes.pig.out.segs[0].dur + sim.routes.pig.out.segs[1].dur + 1.5) * 1000;
    for (const v of Object.keys(VEH)) {
      const P = sim.phase(v, clock), q = sim.routePos(P.ph === 'back' ? P.R.back : P.R.out, P.e);
      VEH[v].obj.position.set(q.x, 0, q.z); VEH[v].obj.rotation.y = q.ang;
    }
  }
  let queued = false, yielded = false, returningOwner = false;
  for (let i = 0; i < 5000; i++) {
    clock += 50; sim.step(clock, .05);
    queued ||= Object.values(S.veh).some(s => s.trip?.farmHold);
    yielded ||= Object.values(S.veh).some(s => s.trip?.farmYield);
    if (recovering && sim.dispatch.owner === 'chicken') returningOwner = true;
    if (Object.values(S.veh).every(s => !s.trip)) break;
  }
  assert(queued, 'no queue was used '+JSON.stringify({recovering,yielded,owner:sim.dispatch.owner,trips:S.veh,positions:Object.fromEntries(Object.entries(VEH).map(([k,v])=>[k,v.obj.position]))}));
  assert(Object.values(S.veh).every(s => !s.trip), 'pickup deadlock remained');
  if (recovering) { assert(yielded, 'outgoing truck did not back out'); assert(returningOwner, 'loaded returner did not get priority'); }
}
create(false);
create(true);
for (const marker of ["if(ph.ph==='yield')p=routePos", "ph.ph==='queued'", 'updateFarmDispatch(Date.now(),dt)']) assert(html.includes(marker), marker);
console.log('PASS: simultaneous farmer chicken/helper pig pickups queue and finish; an existing head-on queue backs out, gives the loaded truck priority, and both trips finish.');
