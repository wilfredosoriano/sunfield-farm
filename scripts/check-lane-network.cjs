// Lane network check: loads the real lane code from public/index.html and runs every NPC route at once (highway cars that shop,
// residential cars, both Sinag Liners, terminal jeepneys, tricycles, the patrol, a factory van and a trader) for 15 simulated minutes.
// Passes when the network builds without geometry warnings, no two vehicles overlap, nobody waits too long and every trip finishes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, 'missing source: ' + a); return html.slice(i, j); };
const lanes = cut('/* ================= Lane network', 'function updateTraffic(dt,t){');
const overlap = cut('function trafficOverlap(', 'const TRAFFIC_JUNCTIONS=');
const shops = cut('let SHOPS=null;', 'const spotTaken=');
const E = new Function(`
  const HZ=-110,LE=HZ+1.75,LW=HZ-1.75,TX0=-200,TX1=430,PX=170,HWX=-60,PSX=92,SSX=-18,WHX=62,FX=395,TSPOTS=[[PX+8,-125],[PX+11,-125],[PX+14,-125]];
  const up=[];for(let k=0;k<=40;k++){const u=k/40;up.push([150+u*82,-189-u*73]);} const HROADS=[{s:up}],MTN_STOP={k:40};
  const gameHealth={errors:[]},VEH={},OWN=()=>false,S={veh:{}},TRAFFIC_JUNCTIONS=[],lerpAng=(a,b,t)=>a+((((b-a+Math.PI)%(Math.PI*2))+Math.PI*2)%(Math.PI*2)-Math.PI)*t;
  ${overlap}\n${shops}\n${lanes}
  return {LN,lnNet,lnPath,lnVeh,lnGo,lnNext,lnHide,lnStep,lnFreeAt,lnStopAt,shopList,trafficOverlap};`)();
const obj = () => ({ visible: false, userData: {}, position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { y: 0 } });
assert(E.lnNet(), 'lane network builds');
assert.deepEqual(E.LN.warn, [], 'lane geometry warnings');

// a fleet of scripted trips: each one is a list of legs [waypoints, dwell seconds], driven again and again
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shopSpots = E.shopList().flatMap(sh => sh.spots.map(sp => E.LN.spot.get(sp)));
const fleet = [];
const add = (name, len, width, vmax, trips, wait = 0) => fleet.push({ name, v: E.lnVeh(obj(), { len, width, vmax, acc: len > 7 ? 1.3 : 2 }), trips, leg: -1, wait, stuck: 0, maxStuck: 0, done: 0 });
const taken = new Map();   // one car per parking spot, like spotTaken in the game
for (let k = 0; k < 8; k++) add('car' + k, 4.6, 2.2, 12 + rnd() * 5, () => { const e = rnd() < .5, me = 'car' + k; for (const [s, c] of taken) if (c === me) taken.delete(s);
  const s = shopSpots[(rnd() * shopSpots.length) | 0]; if (rnd() < .4 && !taken.has(s)) { taken.set(s, me); return [[[e ? 'LE' : 'LW', s], 10], [[e ? 'LE$' : 'LW$'], 0]]; }
  return [[[e ? 'LE' : 'LW', e ? 'LE$' : 'LW$'], 0]]; }, k * 3);
for (let k = 0; k < 2; k++) add('res' + k, 4.6, 2.2, 11, () => [[['LW', 'eN', 'zW', 'wS', 'LE$'], 0]], 6 + k * 30);
add('liner-maynila', 10.6, 2.6, 13, () => [[['LE', 't:bay'], 14], [['LE$'], 0]]);
add('liner-bundok', 10.6, 2.6, 13, () => [[['LE', 't:bay'], 14], [['eN', 'zW', 'mtn:up'], 14], [['mtn:dn', 'eS', 'LW$'], 0, true]], 60);
for (let k = 0; k < 2; k++) add('jeep' + k, 6, 2.1, 12, () => [[[k ? 'LW' : 'LE', 't:jq'], 12], [k ? ['LE$'] : ['wN', 'zE', 'eS', 'LW$'], 0]], k * 20);
add('patrol', 4.6, 2.2, 11, () => [[['pol:park'], 20], [['pol:out', 'sS', 'pol:park'], 0]]);
add('van', 8.4, 2.3, 12, () => [[['f:home399'], 5], [['wh:dock62'], 6], [['f:home399'], 0]]);
add('trader', 7.6, 2.5, 12, () => [[['LW', 'wh:bay'], 9], [['LW$'], 0]], 15);
for (const x of [178, 181, 184]) add('trike' + x, 2.4, 1.5, 11, () => [[['tr:' + x], 8], [[rnd() < .5 ? 'LE$' : 'LW$'], 0], [[rnd() < .5 ? 'LE' : 'LW', 'tr:' + x], 0, true]], (x - 178) * 3);

const obb = (a, b) => { const ax = [[Math.sin(a.a), Math.cos(a.a)], [Math.cos(a.a), -Math.sin(a.a)], [Math.sin(b.a), Math.cos(b.a)], [Math.cos(b.a), -Math.sin(b.a)]];
  const r = (o, n) => Math.abs(Math.sin(o.a) * n[0] + Math.cos(o.a) * n[1]) * o.len / 2 + Math.abs(Math.cos(o.a) * n[0] - Math.sin(o.a) * n[1]) * o.width / 2;
  return ax.every(n => Math.abs((b.x - a.x) * n[0] + (b.z - a.z) * n[1]) < r(a, n) + r(b, n) - .05); };
const dt = .05, overlaps = [];
for (let t = 0; t < 900; t += dt) {
  for (const f of fleet) {
    const v = f.v;
    if (f.wait > 0) { f.wait -= dt; continue; }
    if (f.leg < 0) { // start a trip: the first leg puts the vehicle on the map (when its first lane is clear)
      f.plan = f.trips(); const [wps] = f.plan[0], P = E.lnPath(...wps); assert(P, f.name + ' has a path ' + wps);
      const parked = P.length === 1; if (!parked && !E.lnFreeAt(P[0], v.len / 2, v.len, v, 20)) { f.wait = .5; continue; }
      E.lnGo(v, P, parked ? P[0].L : null, { endOff: wps[wps.length - 1] === 't:bay' ? v.len / 2 : 0 }); f.leg = 0; f.dwell = f.plan[0][1]; continue; }
    if (!v.done) continue;
    if ((f.dwell -= dt) > 0) continue;
    if (++f.leg >= f.plan.length) { E.lnHide(v); f.leg = -1; f.done++; f.wait = 2 + rnd() * 8; continue; }
    const [wps, dwell, fresh] = f.plan[f.leg], tail = E.lnPath(fresh ? wps[0] : v.path[v.pi], ...(fresh ? wps.slice(1) : wps));
    assert(tail, f.name + ' has a path ' + wps);
    const ok = fresh ? (wps[0] === 'mtn:dn' || E.lnFreeAt(tail[0], v.len / 2, v.len, v, 20)) && E.lnGo(v, tail, wps[0] === 'mtn:dn' ? 0 : null) : E.lnNext(v, tail, { endOff: wps[wps.length - 1] === 't:bay' ? v.len / 2 : 0 });
    if (!ok) { f.leg--; continue; } f.dwell = dwell;
  }
  E.lnStep(dt);
  const on = fleet.filter(f => f.v.on && f.v.g.visible).map(f => ({ f, x: f.v.g.position.x, z: f.v.g.position.z, a: f.v.g.rotation.y, len: f.v.len, width: f.v.width }));
  for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) if (Math.abs(on[i].x - on[j].x) < 12 && Math.abs(on[i].z - on[j].z) < 12 && obb(on[i], on[j]) && overlaps.length < 5)
    overlaps.push(`${t.toFixed(1)}s ${on[i].f.name} and ${on[j].f.name} at ${on[i].x.toFixed(1)},${on[i].z.toFixed(1)}`);
  for (const f of fleet) { const v = f.v; if (v.on && !v.done && !v.atStop && v.v < .05) { f.stuck += dt; f.maxStuck = Math.max(f.maxStuck, f.stuck); } else f.stuck = 0; }
}
assert.deepEqual(overlaps, [], 'vehicles overlap');
for (const f of fleet) assert(f.done >= 1, `${f.name} never finished a trip (on ${f.v.path[f.v.pi] && (f.v.path[f.v.pi].name || f.v.path[f.v.pi].id)}, fail ${f.v.fail}, leg ${f.leg})`);
const worst = fleet.reduce((a, f) => f.maxStuck > a.maxStuck ? f : a);
assert(worst.maxStuck < 90, `${worst.name} waited ${worst.maxStuck.toFixed(1)} s`);
console.log(`PASS: ${E.LN.lanes.length} lanes; ${fleet.length} vehicles finished ${fleet.reduce((a, f) => a + f.done, 0)} trips in 15 minutes with no overlaps; longest wait ${worst.maxStuck.toFixed(1)} s (${worst.name}).`);
