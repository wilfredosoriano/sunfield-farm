// Run against wrangler dev on port 8787. Test identities are seeded in LOCAL D1 only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'sunfield-db-test-')),file=join(dir,'seed.sql');
const h=s=>createHash('sha256').update(s).digest('hex');
writeFileSync(file,`INSERT OR REPLACE INTO users VALUES ('test-a','Test A',0),('test-b','Test B',0); INSERT OR REPLACE INTO sessions VALUES ('${h('local-test-a')}','test-a',9999999999999),('${h('local-test-b')}','test-b',9999999999999); DELETE FROM farm_saves WHERE user_id IN ('test-a','test-b'); DELETE FROM save_backups WHERE user_id IN ('test-a','test-b');`);
try{execFileSync('npx',['wrangler@4','d1','execute','sunfield-farm-db','--local','--file',file],{stdio:'pipe'});}finally{rmSync(dir,{recursive:true,force:true});}
const base='http://localhost:8787';
const req=(path,method='GET',body,token='local-test-a',origin=base)=>fetch(base+path,{method,headers:{Cookie:'__Host_sf_session='+token,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
assert.equal((await req('/api/save','GET',null,'invalid')).status,401);
assert.equal((await req('/api/save','PUT',{},'local-test-a','https://evil.example')).status,403);
assert.equal((await req('/auth/google')).status,503);
const save={tiles:Array.from({length:144},()=>({s:'soil'})),coins:150,level:1,inv:{mango:9},orchard:[{kind:'mango',next:123}]};
assert.equal((await req('/api/save','PUT',{save,revision:0})).status,200);
assert.equal((await req('/api/save','PUT',{save,revision:0})).status,409);
assert.deepEqual((await(await req('/api/save')).json()).save,save);
assert.equal((await(await req('/api/save','GET',null,'local-test-b')).json()).save,null);
const parallel=await Promise.all([req('/api/save','PUT',{save:{...save,coins:151},revision:1}),req('/api/save','PUT',{save:{...save,coins:152},revision:1})]);assert.deepEqual(parallel.map(r=>r.status).sort(),[200,409]);
assert.equal((await req('/api/save','PUT',{save:{...save,coins:-1},revision:2})).status,200);   // bills can leave coins below zero; such saves must still sync
assert.equal((await req('/api/save','PUT',{save:{...save,tiles:[]},revision:3})).status,400);
assert.equal((await req('/auth/logout','POST',{})).status,200);
assert.equal((await req('/api/save')).status,401);
console.log('PASS: auth, origin protection, write/read, isolation, concurrent conflict, invalid save, logout');
