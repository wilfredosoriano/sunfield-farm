const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/index.html','utf8'),ctx={ITEMS:{}};vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('const FRUIT_TREES='),src.indexOf('const BUYERS=')),ctx);
const S={coins:500,orchard:[null],mats:{sapling_mango:1},inv:{wheat:7}};
assert.equal(ctx.plantOrchard(S,0,'mango',1000),true);assert.equal(S.mats.sapling_mango,0);assert.equal(S.coins,500);
assert.equal(ctx.plantOrchard(S,0,'bayabas',1000),false);
assert.equal(ctx.harvestOrchard(S,0,180999),0);assert.equal(ctx.harvestOrchard(S,0,181000),3);
assert.equal(ctx.harvestOrchard(S,0,181000),0);assert.equal(S.inv.mango,3);assert.equal(S.inv.wheat,7);
const restored=JSON.parse(JSON.stringify(S));assert.equal(ctx.harvestOrchard(restored,0,241000),3);assert.equal(restored.inv.mango,6);
for(const k of ['kalamansi','bayabas','saging']){const st={orchard:[null],mats:{['sapling_'+k]:1},inv:{}};assert(ctx.plantOrchard(st,0,k,1000));assert(ctx.harvestOrchard(st,0,999999)>0);assert(ctx.ITEMS[k].price>0);}
console.log('PASS orchard planting, sapling consumption, maturity, repeat harvest, no duplicate harvest, save reload and fruit registration');
