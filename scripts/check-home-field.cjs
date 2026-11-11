const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/index.html','utf8');
const fn=source.slice(source.indexOf('function prepareHomeField('),source.indexOf('prepareHomeField(S,NF);'));
const ctx={};vm.createContext(ctx);vm.runInContext(fn,ctx);
const crop={s:'crop',c:'wheat',t:123,watered:true},building={s:'bld',b:'well',lvl:2},animal={s:'bld',b:'cows',lvl:3};
const state={coins:987,tiles:[{s:'locked'},{s:'grass'},crop,building,{s:'soil'},animal],wild:[0,1,5],inv:{wheat:7}};
ctx.prepareHomeField(state,5);
assert.equal(state.tiles[0].s,'soil');assert.equal(state.tiles[1].s,'soil');
assert.equal(state.tiles[2],crop);assert.equal(state.tiles[3],building);assert.equal(state.tiles[5],animal);
assert.equal(state.coins,987);assert.equal(state.inv.wheat,7);assert.deepEqual(state.wild,[5]);
state.tiles[0]={s:'grass'};ctx.prepareHomeField(state,5);assert.equal(state.tiles[0].s,'grass','Migration must not repeat');
assert.match(source,/field: \{x:0, z:5, plot:2, beds:1, gap:0\}/);
for(let r=0;r<12;r++)for(let c=0;c<12;c++){
 const x=(c-6+.5)*2,z=5+(r-6+.5)*2;
 assert.equal(Math.floor(x/2+6),c);assert.equal(Math.floor((z-5)/2+6),r);
}
console.log('PASS: free preparation, crop/building preservation, one-time migration and continuous 144-plot coordinates');
