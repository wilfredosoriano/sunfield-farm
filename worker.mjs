const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const cookies=r=>Object.fromEntries((r.headers.get('Cookie')||'').split(';').map(v=>v.trim().split('=')));
const redirect=(url,c)=>new Response(null,{status:302,headers:{Location:url,'Set-Cookie':c,'Cache-Control':'no-store'}});
export function validSave(s){return s&&Array.isArray(s.tiles)&&[144,192,240,288].includes(s.tiles.length)&&Number.isFinite(s.coins)&&Number.isInteger(s.level)&&s.level>0&&s.tiles.every(t=>t&&['locked','grass','soil','crop','bld','occ'].includes(t.s));}
async function session(r,db){const token=cookies(r).__Host_sf_session;if(!token)return null;return db.prepare('SELECT users.id, users.name, sessions.expires_at AS expires FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').bind(await hash(token),Date.now()).first();}
// a session that is still being used is kept alive: within 15 days of expiring it is extended to a fresh 30 days
async function renew(r,db,user){if(!user||user.expires-Date.now()>1296000000)return null;const token=cookies(r).__Host_sf_session;await db.prepare('UPDATE sessions SET expires_at=? WHERE token_hash=?').bind(Date.now()+2592000000,await hash(token)).run();return cookie('__Host_sf_session',token,2592000);}
export default {async fetch(r,env){const u=new URL(r.url),p=u.pathname,db=env.DB;
 if(!p.startsWith('/api/')&&!p.startsWith('/auth/'))return env.ASSETS.fetch(r);
 try{
 const configured=!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET);
 if(r.method!=='GET'&&r.headers.get('Origin')!==u.origin)return json({error:'Origin rejected'},403);
 if(p==='/api/session'&&r.method==='GET'){const s=await session(r,db),c=await renew(r,db,s),res=json({configured,user:s&&{id:s.id,name:s.name}});if(c)res.headers.append('Set-Cookie',c);return res;}
 if(p==='/auth/google'&&r.method==='GET'){
  if(!configured)return json({error:'Google sign-in is not configured yet'},503);
  const state=random(),verifier=random(),digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const challenge=btoa(String.fromCharCode(...digest)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  await db.batch([db.prepare('DELETE FROM oauth_states WHERE expires_at<?').bind(Date.now()),db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),db.prepare('INSERT INTO oauth_states VALUES (?,?,?)').bind(await hash(state),verifier,Date.now()+600000)]);
  const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:u.origin+'/auth/callback',response_type:'code',scope:'openid profile',state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'});
  return redirect(target.href,cookie('__Host_sf_oauth',state,600));
 }
 if(p==='/auth/callback'&&r.method==='GET'){
  const state=u.searchParams.get('state');if(!configured||!state||state!==cookies(r).__Host_sf_oauth||!u.searchParams.get('code'))return redirect('/?login=failed',cookie('__Host_sf_oauth','',0));
  const row=await db.prepare('DELETE FROM oauth_states WHERE state_hash=? AND expires_at>? RETURNING verifier').bind(await hash(state),Date.now()).first();if(!row)return json({error:'Login expired. Please try again.'},400);
  const tr=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:u.searchParams.get('code'),client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:u.origin+'/auth/callback',grant_type:'authorization_code',code_verifier:row.verifier})});
  if(!tr.ok)return redirect('/?login=failed',cookie('__Host_sf_oauth','',0));const token=await tr.json();
  const pr=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token.access_token}});if(!pr.ok)return json({error:'Could not verify Google account'},401);const profile=await pr.json();if(!profile.sub)return json({error:'Invalid Google account'},401);
  const sid=random();await db.batch([db.prepare('INSERT INTO users VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').bind(profile.sub,String(profile.name||'Farmer').slice(0,100),Date.now()),db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(sid),profile.sub,Date.now()+2592000000)]);
  return redirect('/',cookie('__Host_sf_session',sid,2592000));
 }
 if(p==='/auth/logout'&&r.method==='POST'){const t=cookies(r).__Host_sf_session;if(t)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(t)).run();return new Response('{}',{headers:{'Content-Type':'application/json','Set-Cookie':cookie('__Host_sf_session','',0),'Cache-Control':'no-store'}});}
 const user=await session(r,db);if(!user)return json({error:'Sign in required'},401);
 if(p==='/api/save'&&r.method==='GET'){const row=await db.prepare('SELECT data,revision,updated_at FROM farm_saves WHERE user_id=?').bind(user.id).first();return json(row?{save:JSON.parse(row.data),revision:row.revision,updatedAt:row.updated_at}:{save:null,revision:0});}
 if(p==='/api/save'&&r.method==='PUT'){
  if(Number(r.headers.get('Content-Length')||0)>1000000)return json({error:'Save too large'},413);
  const raw=await r.text();if(new TextEncoder().encode(raw).length>1000000)return json({error:'Save too large'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid JSON'},400);}
  if(!validSave(body.save)||!Number.isInteger(body.revision)||body.revision<0)return json({error:'Invalid save'},400);
  const now=Date.now(),data=JSON.stringify(body.save);
  const result=body.revision===0?await db.prepare('INSERT INTO farm_saves VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(user.id,data,now).run():await db.prepare('UPDATE farm_saves SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(data,now,user.id,body.revision).run();
  if(!result.meta.changes)return json({error:'Cloud save changed on another device. Reload to choose which farm to keep.'},409);
  return json({revision:body.revision+1,updatedAt:now});
 }
 return json({error:'Not found'},404);
 }catch{return json({error:'Service unavailable. Your local farm is safe; please retry.'},503);}
}};
