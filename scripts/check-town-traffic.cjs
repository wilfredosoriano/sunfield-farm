const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
function object(x = 0, z = 0, a = 0) {
  return { visible: true, userData: {}, position: { x, y: 0, z }, rotation: { y: a } };
}
// Liners, jeepneys and the patrol drive the lane network (scripts/check-lane-network.cjs runs them); here: their stops and lanes stay off the road.
const lanes = html.slice(html.indexOf('function lnBuild('), html.indexOf('function lnConflicts('));
assert(/eN=lnRoad\('eN',\[331\.75,/.test(lanes) && /eS=lnRoad\('eS',\[328\.25,/.test(lanes), 'east road keeps separate north- and southbound lanes');
assert(/\['go',\['eN','zW','mtn:up'\]\]/.test(html) && /\['go',\['mtn:dn','eS','LW\$'\],true\]/.test(html), 'the Bundok bus climbs by the east road and comes down the same way');
const stationX = +html.match(/pol:\[(\d+),-150\]/)[1];
assert(stationX - 4 - 9 > 334.3, 'station parking overlaps road');
assert(stationX - 8 - 2.3 > 334.3, 'parked patrol overlaps road');
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
console.log('PASS: station and parking clear the road; separated bus lanes; waiting passengers face the road.');
