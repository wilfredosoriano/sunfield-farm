// The language table: every entry keeps its {0} placeholders in both languages, and t() fills them in and switches both ways.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/i18n.js','utf8'), store={};
const ctx={location:{search:''},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},MutationObserver:class{observe(){}},
  document:{documentElement:{},body:{nodeType:9},createTreeWalker:()=>({nextNode:()=>null})},addEventListener(){},dispatchEvent(){},Event:class{},window:{}};
ctx.window=ctx; vm.createContext(ctx);
const table=JSON.parse('{'+src.slice(src.indexOf(' add({\n')+7,src.lastIndexOf('\n });')).trim()+'}');   // the table is plain JSON lines
let n=0; for(const [k,v] of Object.entries(table)){const ph=(k.match(/\{\d+\}/g)||[]).sort().join(); for(const l of ['en','tl']) if(v[l]!=null){n++; assert.equal((v[l].match(/\{\d+\}/g)||[]).sort().join(),ph,`placeholders differ (${l}): ${k}`);} assert(v.tl,'no Tagalog for: '+k);}
vm.runInContext(src,ctx); const L=ctx.SFI18N;
const pick=Object.keys(table).find(k=>/^[^{]*[A-Za-z]{3}[^{]*\{0\}[^{]*$/.test(k)&&!/\{1\}/.test(k)), plain=Object.keys(table).find(k=>!/\{/.test(k)&&table[k].tl!==k);
assert.equal(L.lang,'en'); assert.equal(L.t(plain),table[plain].en??plain);
L.set('tl'); assert.equal(store['sunfield-lang'],'tl'); assert.equal(L.t('  '+plain+' '),'  '+table[plain].tl+' ');
assert.equal(L.t(pick.replace('{0}','42')),table[pick].tl.replace('{0}','42'));
assert.equal(L.t('no such text here'),'no such text here'); assert.equal(L.t('₱1,200'),'₱1,200');
L.set('en'); assert.equal(L.t(plain),table[plain].en??plain);
console.log(`PASS: ${Object.keys(table).length} texts, ${n} translations keep their placeholders; t() fills {0} and switches both ways`);
