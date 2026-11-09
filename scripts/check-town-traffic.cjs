const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const routeSource = html.slice(html.indexOf('function mkRoute('), html.indexOf('const ROUTES='));
const trafficSource = html.slice(html.indexOf('function aheadGap('), html.indexOf('function canPass('));
const linerSource = html.slice(html.indexOf('const LINERS='), html.indexOf('// jeepneys queue at the terminal'));
const patrolLine = html.match(/const loop=mkRoute\(\[\[px-8,pz,[^\n]+/)[0];
function object(x = 0, z = 0, a = 0) {
  return { visible: true, userData: {}, position: { x, y: 0, z }, rotation: { y: a } };
}
let clock = 0;
const create = new Function('performance', 'makeLiner', `
  const HZ=-110,LE=-108.25,LW=-111.75,TX0=-200,TX1=430,SPD={dirt:6};
  const HROADS=[{s:[[150,-189],[151,-215],[178,-244],[206,-252],[232,-262]]}],MTN_STOP={k:4};
  let SNAP=[];
  ${routeSource}
  ${trafficSource}
  ${linerSource}
  const px=350,pz=-150;
  ${patrolLine}
  return {liners:LINERS,patrol:loop,mkRoute,routePos,step:trafficRouteTime,clear:trafficCanMove,overlap:trafficOverlap,junctions:TRAFFIC_JUNCTIONS,setSnapshot:s=>SNAP=s};
`);
const engine = create({ now: () => clock }, () => object());
const northbound = engine.liners[1].legs[2][1];
const southbound = engine.liners[1].legs[4][1];
assert(northbound.segs.some(s => s.a[0] === 331.75 && s.b[0] === 331.75));
assert(southbound.segs.some(s => s.a[0] === 328.25 && s.b[0] === 328.25));
assert(!southbound.segs.some(s => s.a[0] === 330 && s.b[0] === 330));
const stationX = +html.match(/pol:\[(\d+),-150\]/)[1];
assert(stationX - 4 - 9 > 334.3, 'station parking overlaps road');
assert(stationX - 8 - 2.3 > 334.3, 'parked patrol overlaps road');
const fleet = [
  { name: 'mountain bus', ref: object(), R: northbound, len: 10.6, width: 2.6, e: 0 },
  { name: 'patrol', ref: object(), R: engine.patrol, len: 4.6, width: 2.2, e: 0 },
  { name: 'factory traffic', ref: object(), R: engine.mkRoute([[410, -111.75, 10], [280, -111.75]]), len: 6, width: 2.2, e: 0 },
  { name: 'eastbound bus', ref: object(), R: engine.mkRoute([[290, -108.25, 8], [430, -108.25]]), len: 10.6, width: 2.6, e: 0 }
];
for (const f of fleet) {
  const p = engine.routePos(f.R, 0);
  Object.assign(f.ref.position, { x: p.x, z: p.z }); f.ref.rotation.y = p.ang;
}
for (let t = 0; t < 240; t += .05) {
  clock = t * 1000;
  engine.setSnapshot(fleet.filter(f => f.ref.visible).map(f => ({ ref: f.ref, x: f.ref.position.x, z: f.ref.position.z, a: f.ref.rotation.y, len: f.len, width: f.width })));
  for (const f of fleet) {
    if (!f.ref.visible) continue;
    f.e = engine.step(f.ref, f.R, f.e, .05, f.len, f.width);
    const p = engine.routePos(f.R, f.e);
    Object.assign(f.ref.position, { x: p.x, z: p.z }); f.ref.rotation.y = p.ang;
    if (f.e >= f.R.T) { f.ref.visible = false; f.finished = t; }
  }
  for (let a = 0; a < fleet.length; a++) for (let b = a + 1; b < fleet.length; b++) {
    const A = fleet[a], B = fleet[b];
    if (A.ref.visible && B.ref.visible) assert(!engine.overlap({ x: A.ref.position.x, z: A.ref.position.z, a: A.ref.rotation.y, len: A.len, width: A.width }, { x: B.ref.position.x, z: B.ref.position.z, a: B.ref.rotation.y, len: B.len, width: B.width }, 0), `${A.name} collided with ${B.name}`);
  }
}
for (const f of fleet) assert(f.finished != null, `${f.name} stuck at ${f.e}/${f.R.T}`);
const commuterSource = html.slice(html.indexOf('function commuterPath('), html.indexOf('// the police patrol: out of the station'));
for (const pickup of [false, true]) {
  const x = pickup ? 124 : 282, z = pickup ? -182.1 : -130;
  const p = { root: object(x, z, -Math.PI / 2), aR: { rotation: {} } };
  const w = { p, pickup, stop: 0, k: 0, state: pickup ? 'stopWait' : 'bayWait' };
  const run = new Function('COMMUTERS', 'JEEPS', 'LINERS', 'JEEP_STOPS', 'cam', 'poseStand', 'poseWalk', commuterSource + ';return updateCommuters;')([w], [], [], [{ x: 124, z: -184.25 }], { target: { x, z }, dist: 30 }, () => {}, () => {});
  run(.1, 0);
  assert(Math.abs(p.root.rotation.y - (pickup ? Math.PI : 0)) < 1e-8, 'waiting passenger faces away from vehicle');
}
for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (m[1].trim()) new Function(m[1]);
console.table(fleet.map(f => ({ vehicle: f.name, finishedAtSeconds: f.finished.toFixed(1) })));
console.log('PASS: station and parking clear road; separated bus lanes; 240-second mixed junction simulation completes without overlaps or stuck vehicles; waiting passengers face the road.');
