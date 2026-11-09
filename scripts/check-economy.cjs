const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
function constant(name) {
  const start = html.indexOf(`const ${name}=`);
  assert(start >= 0, name);
  return html.slice(start + `const ${name}=`.length, html.indexOf('};', start) + 1);
}
const buildingSource = constant('BLDS');
const builders = [...new Set([...buildingSource.matchAll(/build:(\w+)/g)].map(m => m[1]))];
const BLDS = new Function(...builders, `return (${buildingSource})`)(...builders.map(() => () => {}));
const ITEMS = new Function(`return (${constant('ITEMS')})`)();
const MATS = new Function(`return (${constant('MATS')})`)();
const LIFE = new Function(`return (${constant('LIFE')})`)();
const BALANCE = new Function(`return (${constant('BALANCE')})`)();
const DAY_MS = 780000;
const unit = { chick: 10, pullet: 10, duckling: 10, itik: 10, fingerling: 50, piglet: 1, calf: 1, kid: 1 };
const feedSource = html.slice(html.indexOf('const lvlOf='), html.indexOf('const FEED_NAME='));
const productionSource = html.slice(html.indexOf('const isFarm='), html.indexOf('// hunger, sickness and heat kill'));
function runtime() {
  const S = { mats: Object.fromEntries(['feed', 'feed_pig', 'feed_cow', 'feed_fish'].map(k => [k, 100000])), tiles: [] };
  const POULTRY_LV = Object.fromEntries(Object.keys(LIFE).map(k => [k, { 1: { cap: 10000 }, 2: { cap: 10000 }, 3: { cap: 10000 } }]));
  return new Function('S', 'LIFE', 'BLDS', 'POULTRY_LV', 'DAY_MS', `
    const maxN=t=>LIFE[t.b].max[(t.lvl||1)-1];
    const herdFrac=t=>t.n>0?Math.min(1,t.n/maxN(t)):0;
    const underConstruction=()=>false,hotNow=()=>false;
    ${feedSource}
    ${productionSource}
    return {S,feedMeal,feedRation,feedNeed,produce,perBatch};
  `)(S, LIFE, BLDS, POULTRY_LV, DAY_MS);
}
const results = [];
for (const b of ['broiler', 'pig', 'fish']) {
  for (const lvl of [1, 2, 3]) for (const full of [false, true]) {
    const r = runtime(), L = LIFE[b], n = full ? L.max[lvl - 1] : 1;
    const t = { s: 'bld', b, lvl, n, gp: 0, t: 0, stored: 0 };
    r.S.tiles.push(t);
    assert(r.feedMeal(t));
    let now = 0;
    while (t.gp < 1) {
      now += BLDS[b].period * 1000;
      r.produce(0, now);
      assert(now < DAY_MS * 10, 'growth stalled');
    }
    const fk = BLDS[b].feedType || 'feed';
    const feedCost = (100000 - r.S.mats[fk]) * MATS[fk].price;
    const youngCost = n * MATS[L.young].price / unit[L.young];
    const liveRevenue = L.live ? n * ITEMS[L.live].price : n * ITEMS.tilapia.price * .7;
    assert(liveRevenue - feedCost - youngCost > 0, `${b} level ${lvl} loses money`);
    if (full && lvl === 1) results.push({ animal: b, count: n, youngCost, feedCost, revenue: liveRevenue, profit: liveRevenue - feedCost - youngCost });
    assert(Number.isInteger(r.S.mats[fk]));
  }
}
for (const b of ['coop', 'duck', 'cows', 'goat']) {
  for (const lvl of [1, 2, 3]) for (const full of [false, true]) {
    const r = runtime(), n = full ? LIFE[b].max[lvl - 1] : 1;
    const t = { s: 'bld', b, lvl, n, gp: 1, t: 0, stored: 0 };
    const revenue = Object.keys(BLDS[b].gives).filter(k => !['beef', 'chevon'].includes(k)).reduce((sum, k) => sum + r.perBatch(t, k) * ITEMS[k].price * .7, 0);
    assert(revenue > r.feedRation(t) * MATS[BLDS[b].feedType || 'feed'].price, `${b} operating loss`);
  }
}
// A partly stocked pen must not buy a new sack for every meal.
{
  const r = runtime(), t = { b: 'pig', lvl: 1, n: 1 };
  for (let i = 0; i < 10000; i++) assert(r.feedMeal(t));
  assert.equal(100000 - r.S.mats.feed_pig, 2500);
  assert(Math.abs(t.feedLeft) < 1e-8);
  r.S.mats.feed_pig = 0; t.feedLeft = .75;
  assert(r.feedMeal(t));
  assert(r.feedMeal(t));
  assert(r.feedMeal(t));
  assert.equal(r.feedMeal(t), false, 'empty feed reserve must not feed indefinitely');
}
// Actual restock code must retain and subsequently reuse surplus animals.
{
  const source = html.slice(html.indexOf('function restock('), html.indexOf('function openBld('));
  const S = { mats: { duckling: 1 }, youngLoose: {}, tiles: [{ b: 'duck', lvl: 1, n: 0 }] };
  const restock = new Function('S', 'LIFE', 'UNIT', `const maxN=t=>LIFE[t.b].max[t.lvl-1],startCycle=()=>{},tilePos=()=>({x:0,z:0}),ANIMAL_OF={},MATS=${constant('MATS')};const sfx=()=>{},buzz=()=>{},floatAt=()=>{},toast=()=>{},updateTile=()=>{},changed=()=>{},renderBld=()=>{};${source};return restock;`)(S, LIFE, unit);
  restock(0, 'duckling');
  assert.equal(S.tiles[0].n, 8);
  assert.equal(S.youngLoose.duckling, 2);
  S.tiles[0].n = 0;
  restock(0, 'duckling');
  assert.equal(S.tiles[0].n, 2);
  assert.equal(S.youngLoose.duckling, 0);
}
assert(BALANCE.stressLossDays * DAY_MS / 1000 >= 1560);
assert(BALANCE.vaccineDays === 24 && BALANCE.fluPerSecond < .0002);
const fees = new Function(`return (${html.match(/KAT_FEE=(\{[^}]+\})/)[1]})`)();
const meat = new Function(`return (${constant('KAT_MEAT')})`)();
for (const [live, yieldMap] of Object.entries(meat)) {
  const net = Object.entries(yieldMap).reduce((sum, [k, n]) => sum + ITEMS[k].price * n, 0) - fees[live];
  assert(net > ITEMS[live].price, `${live}: processing should reward the additional work`);
}
// Loading the same save twice must not duplicate the relief package.
{
  const start = html.indexOf('if((S.balanceVersion||0)<1)');
  const source = html.slice(start, html.indexOf('const TRUCK_PRICE=', start));
  const S = { coins: 10, mats: {}, tiles: [{ n: 1, sick: true, ng: 900 }], me: { hunger: 1, energy: 1 }, ev: {}, orders: [] };
  const migrate = new Function('S', 'lifeTiles', 'DAY_MS', 'ITEMS', 'save', 'monthN', 'heatOn', source);
  const run = () => migrate(S, () => [0], DAY_MS, ITEMS, () => {}, () => 100, () => false);
  run();
  assert.equal(S.coins, 1510);
  assert.equal(S.tiles[0].sick, false);
  assert.equal(S.mats.feed_pig, 12);
  run();
  assert.equal(S.coins, 1510);
  assert.equal(S.mats.feed_pig, 12);
}
const costs = new Function(`return (${html.match(/COST=(\{[^;]+\});/)[1]})`)();
const workdayCost = 24 * (costs.plow + costs.plant + costs.harvest + costs.water) + 8;
assert(workdayCost < 40, 'a 24-plot workday is exhausting');
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (script[1].trim()) new Function(script[1]);
console.table(results);
console.log(`PASS: 18 meat-herd cycles, 24 layer/dairy margins, feed reserves, spare animals, care grace, and workday energy (${workdayCost.toFixed(1)}).`);
