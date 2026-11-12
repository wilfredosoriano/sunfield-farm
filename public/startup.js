/* Sunfield Farm start-up: the welcome / Google sign-in screens, the loading screen, choosing which copy of a farm to play,
   and the cloud autosave. Drawn in the same sketch style as the game (paper, pencil outlines, the Mali hand lettering).
   The game script itself is only started once the right save is in place on this device. */
(()=>{
 const guestKey='sunfield-farm-v1', LAST='sunfield-last-account';
 let user=null,revision=0,key=guestKey,pending=null,busy=false,paused=null,timer=null,started=false,configured=false,lastSync=0,state='guest',offlineAccount=false;
 const $=s=>document.querySelector(s), el=(t,c,txt)=>{const e=document.createElement(t); if(c) e.className=c; if(txt!=null) e.textContent=txt; return e;};
 // ---------- look ----------
 const css=`
 #sf-start{position:fixed;top:0;left:0;right:0;bottom:auto;height:100vh;height:100lvh;z-index:100000;box-sizing:border-box;display:grid;place-items:center;padding:14px;font-family:Mali,Nunito,system-ui,sans-serif;color:#3b2e24;
   background:radial-gradient(ellipse 90% 45% at 50% 112%,#b9d39a 0 70%,transparent 71%),radial-gradient(ellipse 70% 35% at 15% 105%,#a3c47f 0 70%,transparent 71%),linear-gradient(#cfe8ee,#eef3e2) #cfe6d0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
 #sf-start[hidden]{display:none}
 /* behind the start screens the page is the same colour, so no strip of sky shows under a phone's toolbar or home bar */
 html.sf-cover,html.sf-cover body{background:#dfeee0!important}
 @media (orientation:portrait) and (pointer:coarse){html.sf-idle,html.sf-idle body{background:#dfeee0!important}}
 #sf-start .sf-card{position:relative;background:#fbf7ec;border:2px solid #4a3f34;border-radius:16px 20px 15px 19px/19px 15px 20px 16px;box-shadow:2px 3px 0 #4a3f3526;
   width:min(440px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:18px 20px 16px;box-sizing:border-box}
 #sf-start .sf-art{display:block;width:100%;height:auto;max-height:118px;margin:-4px 0 6px}
 #sf-start h1{font-size:22px;margin:0 0 4px;font-weight:700;letter-spacing:.2px}
 #sf-start p{font-size:13.5px;line-height:1.45;margin:0 0 10px;color:#5b4c3d}
 #sf-start .sf-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:44px;margin-top:9px;padding:8px 14px;box-sizing:border-box;
   font:700 15px Mali,Nunito,system-ui,sans-serif;color:#3b2e24;background:#f1eadb;border:1.6px solid #4a3f34;border-radius:10px 12px 9px 11px/11px 9px 12px 10px;cursor:pointer}
 #sf-start .sf-btn:active{background:#e6dac3}#sf-start .sf-btn:disabled{opacity:.55;border-style:dashed;cursor:default}
 #sf-start .sf-btn.google{background:#fff}#sf-start .sf-btn.google svg{width:20px;height:20px;flex:none}
 #sf-start .sf-btn.main{background:#dcebc8}#sf-start .sf-btn.quiet{background:none;border-color:transparent;font-weight:600;text-decoration:underline;text-underline-offset:3px;min-height:36px}
 #sf-start .sf-pick{display:block;text-align:left}#sf-start .sf-pick b{display:block;font-size:14.5px}#sf-start .sf-pick small{display:block;font-size:12px;font-weight:600;opacity:.75;margin-top:2px}
 #sf-start .sf-tag{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:#dcebc8;margin-left:6px;vertical-align:1px}
 #sf-start .sf-note{font-size:12px;opacity:.75;margin:10px 0 0}
 #sf-start .sf-bar{height:12px;border:1.6px solid #4a3f34;border-radius:8px;background:#fffaf0;overflow:hidden;margin:12px 0 6px}
 #sf-start .sf-bar i{display:block;height:100%;width:0;background:repeating-linear-gradient(-45deg,#9fc46d 0 7px,#8ab35a 7px 14px);transition:width .45s}
 #sf-start .sf-step{font-size:13px;font-weight:700;margin:0;color:#5b4c3d}
 #sf-start .tractor{transform-box:fill-box;animation:sfDrive 3.2s ease-in-out infinite alternate}
 #sf-start .sprout{transform-box:fill-box;transform-origin:50% 100%;animation:sfGrow 1.6s ease-in-out infinite alternate}
 @keyframes sfDrive{from{transform:translateX(-26px)}to{transform:translateX(26px)}}@keyframes sfGrow{from{transform:scaleY(.75)}to{transform:scaleY(1.05)}}
 #sf-start .sf-rot{display:none;text-align:center}#sf-start .sf-rot svg{width:120px;height:auto;margin:0 auto 6px;display:block}
 #sf-start .sf-rot .ph{transform-box:fill-box;transform-origin:50% 50%;animation:sfTurn 2.4s ease-in-out infinite}
 @keyframes sfTurn{0%,25%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}
 @media (orientation:portrait) and (pointer:coarse){#sf-start .sf-main{display:none}#sf-start .sf-rot{display:block}}
 /* while playing, the same card is the only rotate reminder: hidden in landscape, over the game when the phone is held upright */
 #sf-start.idle{display:none;background:rgba(207,230,208,.97)}
 @media (orientation:portrait) and (pointer:coarse){#sf-start.idle{display:grid}}
 #sf-start .sf-rot .sf-btn{margin-top:12px}
 @media (max-height:430px){#sf-start .sf-art{max-height:74px}#sf-start .sf-card{padding:12px 16px}#sf-start h1{font-size:19px}#sf-start .sf-btn{min-height:38px;margin-top:7px}}
 @media (prefers-reduced-motion:reduce){#sf-start .tractor,#sf-start .sprout,#sf-start .sf-rot .ph{animation:none}}
 /* the account box inside Settings */
 #sf-acct{border:1.4px solid #4a3f34;border-radius:12px 14px 11px 13px/13px 11px 14px 12px;background:#f6f0e2;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
 #sf-acct .who{display:flex;align-items:center;gap:10px}#sf-acct .av{width:34px;height:34px;flex:none;border-radius:50%;border:1.4px solid #4a3f34;background:#dcebc8;display:grid;place-items:center;font-weight:700;font-size:15px}
 #sf-acct .who b{display:block;font-size:14px}#sf-acct .who small{display:block;font-size:11.5px;opacity:.75}
 #sf-acct .sync{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700}#sf-acct .dot{width:10px;height:10px;border-radius:50%;border:1.2px solid #4a3f34;flex:none;background:#9e9686}
 #sf-acct .dot.ok{background:#8fc46d}#sf-acct .dot.busy{background:#f2c84b}#sf-acct .dot.bad{background:#e0735a}
 #sf-acct .acts{display:flex;gap:6px}#sf-acct .acts button{flex:1;min-height:34px;justify-content:center;text-align:center}`;
 const style=el('style'); style.textContent=css; document.head.append(style);
 // ---------- pictures (original sketches; the Google "G" is Google's own mark, used unaltered as its brand rules require) ----------
 const ART=`<svg class="sf-art" viewBox="0 0 320 120" fill="none" stroke="#4a3f34" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="262" cy="30" r="15" fill="#f6d36b"/><path d="M262 6v-4M262 58v-4M238 30h-4M290 30h-4M245 13l-3-3M282 50l-3-3M245 47l-3 3M282 10l-3 3"/>
  <path d="M2 86q50-34 104-12t110-8q56-14 102 6v48H2Z" fill="#b9d39a"/><path d="M2 100q80-20 160-6t156-4v30H2Z" fill="#a3c47f"/>
  <path d="M110 64h56v34h-56Z" fill="#e0735a"/><path d="M104 66l34-24 34 24Z" fill="#c4553f"/><path d="M128 98V78h20v20M128 78l20 20M148 78l-20 20"/><path d="M118 72h8M150 72h8"/>
  <path d="M58 98V70" /><circle cx="58" cy="60" r="14" fill="#7cb36b"/><circle cx="48" cy="66" r="8" fill="#6aa25a"/>
  <path d="M190 112l30-16M206 116l34-18M222 118l34-17" stroke="#7d5a3c"/>
  <g class="tractor"><path d="M196 84h22v-10h10l4 10h6v8h-42Z" fill="#8fc46d"/><circle cx="204" cy="94" r="7" fill="#5d5045"/><circle cx="232" cy="96" r="4.5" fill="#5d5045"/><path d="M222 74v-6"/></g>
  <g class="sprout"><path d="M290 104V92"/><path d="M290 96q-10-2-11-10 9 0 11 10ZM290 93q2-10 11-10-1 9-11 10Z" fill="#8fc46d"/></g></svg>`;
 const G=`<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
 const ROT=`<svg viewBox="0 0 120 90" fill="none" stroke="#4a3f34" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g class="ph"><rect x="44" y="12" width="32" height="58" rx="6" fill="#fbf7ec"/><path d="M56 18h8"/><circle cx="60" cy="63" r="2.5"/><path d="M50 30h20v22H50Z" fill="#cfe6d0"/></g>
  <path d="M90 22q16 10 10 30" /><path d="M96 50l4 3 3-5"/></svg>`;
 // ---------- the screen ----------
 const overlay=el('div'); overlay.id='sf-start'; document.body.append(overlay);
 // Android can be locked sideways from a full-screen page; iPhone can't, so there the card simply waits for the turn
 const docEl=document.documentElement, canLock=!!(screen.orientation&&screen.orientation.lock)&&!!(docEl.requestFullscreen||docEl.webkitRequestFullscreen)&&matchMedia('(pointer:coarse)').matches;
 function lockSideways(){if(window.SunfieldLock) return window.SunfieldLock(); const lock=()=>screen.orientation.lock('landscape').catch(()=>{}); if(document.fullscreenElement) return lock();
   const req=docEl.requestFullscreen||docEl.webkitRequestFullscreen; try{Promise.resolve(req.call(docEl,{navigationUI:'hide'})).then(lock).catch(()=>{});}catch{}}
 const rot=()=>{const r=el('div','sf-rot'); r.innerHTML=ROT; r.append(el('h1',null,'Turn your phone sideways'),el('p',null,'Sunfield Farm is played in landscape. Rotate your phone to continue.'));
   if(canLock){const b=el('button','sf-btn main','Play in landscape'); b.onclick=lockSideways; r.append(b);} return r;};
 const cover=on=>{document.documentElement.classList.toggle('sf-cover',on); document.documentElement.classList.toggle('sf-idle',!on);};
 function screen(title,body,art=true){overlay.replaceChildren(); overlay.hidden=false; overlay.classList.remove('idle'); cover(true); const card=el('div','sf-card'), main=el('div','sf-main');
   if(art) main.insertAdjacentHTML('beforeend',ART); main.append(el('h1',null,title)); if(body) main.append(el('p',null,body)); card.append(main,rot()); overlay.append(card); return main;}
 const btn=(box,label,fn,cls='',disabled=false)=>{const b=el('button','sf-btn '+cls); if(cls.includes('google')){b.innerHTML=G; b.append(el('span',null,label));} else b.textContent=label;
   b.disabled=disabled; b.onclick=()=>{b.disabled=true; Promise.resolve().then(fn).catch(e=>failure(e.message)).finally(()=>{if(b.isConnected) b.disabled=disabled;});}; box.append(b); return b;};
 let loadBar=null, loadStep=null;
 function loading(step,pct){if(!loadBar||!loadBar.isConnected){const m=screen('Sunfield Farm',null); const bar=el('div','sf-bar'); loadBar=el('i'); bar.append(loadBar); loadStep=el('p','sf-step'); m.append(bar,loadStep);}
   loadStep.textContent=step; requestAnimationFrame(()=>{loadBar.style.width=Math.max(4,Math.min(100,pct))+'%';});}
 // ---------- local copies, and which revision each one came from ----------
 const read=k=>{try{const s=JSON.parse(localStorage.getItem(k)); return s&&Array.isArray(s.tiles)?s:null;}catch{return null;}};
 const metaKey=()=>key+'-sync';
 const getMeta=()=>{try{return JSON.parse(localStorage.getItem(metaKey()))||{};}catch{return {};}};
 const setMeta=m=>{try{localStorage.setItem(metaKey(),JSON.stringify(m));}catch{}};
 const remember=u=>{try{localStorage.setItem(LAST,JSON.stringify({id:u.id,name:u.name}));}catch{}};
 const lastAccount=()=>{try{return JSON.parse(localStorage.getItem(LAST));}catch{return null;}};
 function backup(k){const raw=localStorage.getItem(k); if(raw) try{localStorage.setItem(k+'-backup',raw);}catch{}}
 const strip=s=>{if(!s) return ''; const c={...s}; delete c.savedAt; delete c.me; return JSON.stringify(c);};   // the farmer's hunger and energy drift on their own: not progress
 const hashOf=s=>{const t=strip(s); let h=2166136261; for(let i=0;i<t.length;i++){h^=t.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0).toString(36)+t.length.toString(36);};   // a fingerprint of a farm's contents
 const ago=t=>{if(!t) return ''; const m=Math.round((Date.now()-t)/60000); return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago';};
 const summary=s=>s?`Level ${s.level||1} · ₱${Math.round(s.coins||0).toLocaleString()} · ${s.tiles.filter(t=>t.s==='crop').length} planted plots`:'No farm yet';
 // ---------- talking to the farm's own server ----------
 async function api(path,options={}){const r=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers},signal:options.keepalive?undefined:AbortSignal.timeout(15000)});
   let b; try{b=await r.json();}catch{throw Error('The cloud service is not answering. You can still play; your farm is saved on this device.');}
   if(!r.ok){const e=Error(b.error||'Cloud request failed'); e.status=r.status; throw e;} return b;}
 // ---------- autosave to the cloud ----------
 function setState(s){state=s; renderAcct();}
 async function flush(final=false){if(!user||!pending||busy||paused) return; busy=true; const data=pending; pending=null; setState('saving');
   const fp=hashOf(data); {const m=getMeta(); m.sent=fp; m.sentBase=revision; setMeta(m);}   // remember what went out, in case the page closes before the reply comes back
   try{const body=JSON.stringify({save:data,revision}); const r=await api('/api/save',{method:'PUT',body,keepalive:final&&body.length<60000});
     revision=r.revision; lastSync=Date.now(); setMeta({rev:revision,dirty:!!pending,at:lastSync,sent:fp,sentBase:revision-1}); setState('synced');}
   catch(e){pending=pending||data; if(e.status===409){paused='conflict'; setState('conflict');} else if(e.status===401){paused='expired'; setState('expired');} else if(e.status===400||e.status===413){paused='rejected'; setState('rejected');} else setState('offline');}
   finally{busy=false;}}
 window.SunfieldCloud={key,queue(s){if(key!==guestKey){const m=getMeta(); if(!m.dirty){m.dirty=true; setMeta(m);}} if(!user||paused) return; pending=JSON.parse(JSON.stringify(s)); if(state==='synced') setState('pending'); if(!timer) timer=setTimeout(()=>{timer=null; flush();},8000);},
   flush:()=>flush(true)};
 setInterval(()=>flush(),30000); addEventListener('online',()=>flush());
 document.addEventListener('visibilitychange',()=>{if(document.hidden) flush(true);}); addEventListener('pagehide',()=>flush(true));
 // ---------- account and sync, inside the game's Settings ----------
 const STATE={guest:['','Guest farm · saved on this device only'],synced:['ok','Auto-sync on · saved online'],pending:['busy','Auto-sync on · saving shortly'],saving:['busy','Saving online…'],
   offline:['busy','Offline · saved on this device, will sync when back online'],conflict:['bad','Another device saved newer progress. Reload to choose which farm to keep.'],
   expired:['bad','Your sign-in has expired. Sign in again to keep syncing.'],rejected:['bad','The cloud could not accept this save. It is safe on this device.'],offlineAccount:['busy','Playing offline · will sync after you sign in']};
 function renderAcct(){const sheet=$('#menu .sheet'); if(!sheet||!started) return; let box=$('#sf-acct'); if(!box){box=el('div'); box.id='sf-acct'; const after=sheet.querySelector('p'); (after||sheet.firstChild).after(box);}
   box.replaceChildren(); const who=el('div','who'), av=el('span','av', ((user?user.name:offlineAccount?lastAccount()?.name:'')||'Guest').trim().charAt(0).toUpperCase()), t=el('div');
   t.append(el('b',null,user?user.name:offlineAccount?(lastAccount()?.name||'Your account'):'Guest'),el('small',null,user?'Signed in with Google':offlineAccount?'Not signed in right now':'Not signed in')); who.append(av,t);
   const [dot,text]=STATE[offlineAccount&&!user?'offlineAccount':state]||STATE.guest, sync=el('div','sync'), d=el('span','dot '+dot), st=el('span',null,text+(state==='synced'&&lastSync?' · '+ago(lastSync):''));
   sync.append(d,st); const acts=el('div','acts'), add=(label,fn,cls='')=>{const b=el('button',cls,label); b.onclick=fn; acts.append(b);};
   if(user){if(state==='conflict') add('Choose farm',()=>location.reload()); else if(state==='expired') add('Sign in again',()=>{window.SunfieldCloud.flush(); location.assign('/auth/google');}); else add('Sync now',()=>{if(!pending&&paused==null){pending=JSON.parse(localStorage.getItem(key)||'null');} flush();});
     add('Sign out',async()=>{await flush(true); try{await api('/auth/logout',{method:'POST'});}catch{} location.reload();},'warn');}
   else if(configured) add(offlineAccount?'Sign in to sync':'Sign in with Google to save online',()=>location.assign('/auth/google'));
   box.append(who,sync,acts);}
 setInterval(()=>{if(state==='synced') renderAcct();},30000);
 // ---------- start the game ----------
 const upright=()=>matchMedia('(orientation:portrait) and (pointer:coarse)').matches;
 function sideways(){if(!upright()) return Promise.resolve(); return new Promise(ok=>{let done1=false; const mq=matchMedia('(orientation:portrait) and (pointer:coarse)'), go=()=>{if(upright()||done1) return; done1=true; mq.removeEventListener?.('change',go); removeEventListener('resize',go);
     let n=0, w=0; const settle=()=>{const W=innerWidth; if(W>innerHeight&&W===w&&++n>=3) return ok(); if(W!==w) n=0; w=W; setTimeout(settle,120);}; settle();};   // wait until the size the phone reports stops changing
   mq.addEventListener?mq.addEventListener('change',go):addEventListener('resize',go); addEventListener('resize',go);
   const poll=setInterval(()=>{if(!upright()){clearInterval(poll); go();}},300);});}   // and check now and then, in case the turn's event is missed
 async function launch(){if(started) return; started=true; window.SunfieldCloud.key=key; loading('Building your farm…',70); await sideways(); await new Promise(r=>setTimeout(r,80));
   if(!window.THREE){started=false; return failure('The 3D engine could not load. Check your connection and try again.');}
   let error=null; const onError=e=>{error=e.error||Error(e.message);}; addEventListener('error',onError);
   const script=el('script'); script.textContent=document.getElementById('sunfield-game').textContent; document.body.append(script); removeEventListener('error',onError);
   if(error){const m=screen('The farm could not start','Your save is still on this device. Reload to try again.'); btn(m,'Reload',()=>location.reload(),'main'); return;}
   // keep the loading screen up until the farm is really built: drawn, and the paths your farmer and helpers walk worked out
   window.SunfieldLoading=true; const t0=Date.now(), G=()=>window.SunfieldGame||{frames:0,navReady:false};
   const STEPS=[[0,'Putting up the barns and fences…'],[.35,'Laying the paths for your helpers…'],[.75,'Planting crops and waking the animals…']];
   await new Promise(done=>{const tick=()=>{const g=G(), f=Math.min(1,g.frames/12), n=g.navReady?1:Math.min(.9,(Date.now()-t0)/6000), p=Math.min(f*.3+n*.7,1);
       loading(STEPS.filter(s=>p>=s[0]).pop()[1],75+p*25);
       if((g.frames>=12&&g.navReady)||Date.now()-t0>15000) return done(); setTimeout(tick,120);};   // never stuck: 15 s at most
     tick();});
   window.SunfieldLoading=false; loading('Ready!',100); await new Promise(r=>setTimeout(r,250));
   overlay.replaceChildren(); const card=el('div','sf-card'); card.append(rot()); overlay.append(card); overlay.classList.add('idle'); overlay.hidden=false; cover(false);
   if(user&&state==='guest') setState(getMeta().dirty?'pending':'synced'); renderAcct();
   if(user&&getMeta().dirty){pending=JSON.parse(localStorage.getItem(key)||'null'); if(pending) flush();}}
 function guest(){user=null; offlineAccount=false; key=guestKey; state='guest'; return launch();}
 function failure(text){const m=screen('Let’s try again',text); btn(m,'Try again',boot,'main'); if(!started) btn(m,'Play as a guest',guest,'quiet');}
 async function use(save,upload){backup(key); if(save) localStorage.setItem(key,JSON.stringify(save)); else localStorage.removeItem(key);
   if(upload&&save){loading('Saving your farm online…',55); try{const r=await api('/api/save',{method:'PUT',body:JSON.stringify({save,revision})}); revision=r.revision; lastSync=Date.now(); setMeta({rev:revision,dirty:false,at:lastSync,sent:hashOf(save),sentBase:revision-1});}
     catch(e){if(e.status===409) return account(); setMeta({rev:revision,dirty:true});}}
   else setMeta({rev:revision,dirty:!save,at:Date.now(),...(save?{sent:hashOf(save),sentBase:revision-1}:{})});
   state='synced'; await launch();}
 function pick(title,body,options){const m=screen(title,body,false); for(const o of options){const b=btn(m,'',o.fn,'sf-pick'+(o.main?' main':'')); b.textContent=''; const t=el('b',null,o.label); if(o.tag){t.append(el('span','sf-tag',o.tag));} b.append(t,el('small',null,o.sub));}
   btn(m,'Sign out',async()=>{try{await api('/auth/logout',{method:'POST'});}catch{} location.reload();},'quiet');}
 // which copy to play: never ask when the answer is clear; ask only when two copies both have progress the other lacks
 async function account(){loading('Fetching your farm…',35); const cloud=await api('/api/save'); revision=cloud.revision||0; key=guestKey+'-account-'+user.id; window.SunfieldCloud.key=key;
   const local=read(key), meta=getMeta(), guestSave=read(guestKey);
   if(local&&meta.dirty&&meta.sent&&meta.sent===hashOf(local)&&cloud.revision>meta.sentBase){meta.rev=meta.sentBase+1; meta.dirty=false;}   // nothing new here since the last copy that went out (its reply may have been lost as the app closed)
   if(cloud.save){
     if(local){
       if(meta.rev===cloud.revision) return use(local,!!meta.dirty);                         // this device's copy is the cloud's, maybe with newer play on top
       if(meta.rev!=null&&meta.rev<cloud.revision&&!meta.dirty) return use(cloud.save,false);  // another device moved on; nothing unsynced here
       if(strip(local)===strip(cloud.save)) return use(cloud.save,false);
       const localNewer=(local.savedAt||0)>(cloud.updatedAt||0);
       return pick('Which farm should we keep?','This device and your online save both have progress. A backup of the other one is kept.',[
         {label:'Online farm',tag:localNewer?'':'newer',sub:summary(cloud.save)+' · saved '+ago(cloud.updatedAt),fn:()=>use(cloud.save,false),main:!localNewer},
         {label:'This device’s farm',tag:localNewer?'newer':'',sub:summary(local)+(local.savedAt?' · played '+ago(local.savedAt):''),fn:()=>use(local,true),main:localNewer}]);}
     if(guestSave&&!meta.offered){setMeta({...meta,offered:true});
       return pick('Welcome back, '+user.name+'!','You also have a guest farm on this device. Which one do you want to play?',[
         {label:'My online farm',sub:summary(cloud.save)+' · saved '+ago(cloud.updatedAt),fn:()=>use(cloud.save,false),main:true},
         {label:'The guest farm on this device',sub:summary(guestSave)+' · this replaces your online farm (a backup is kept)',fn:()=>use(guestSave,true)}]);}
     return use(cloud.save,false);}
   if(local) return use(local,true);
   if(guestSave) return pick('Welcome, '+user.name+'!','Bring the farm you played as a guest into your account, or start fresh. The guest copy stays on this device.',[
     {label:'Use my guest farm',sub:summary(guestSave),fn:()=>use(guestSave,true),main:true},{label:'Start a new farm',sub:'An empty farm saved to your account',fn:()=>use(null,false)}]);
   return use(null,false);}
 async function boot(){loading('Checking your account…',12);
   try{const s=await api('/api/session'); configured=!!s.configured; user=s.user;
     if(user){remember(user); return account();}
     const last=lastAccount(), lastKey=last?guestKey+'-account-'+last.id:null, lastLocal=lastKey&&read(lastKey);
     const back=new URLSearchParams(location.search).has('login');
     const m=screen(last?'Welcome back, '+last.name+'!':'Welcome to Sunfield Farm',back?'Sign-in was cancelled or did not finish. Try again, or keep playing on this device.':last?'Sign in to keep playing your farm and saving it online.':'Grow crops, raise animals and trade with your town. Sign in to keep your farm safe online and play it on any device.');
     btn(m,'Continue with Google',()=>location.assign('/auth/google'),'google',!configured);
     if(lastLocal) btn(m,'Play '+last.name+'’s farm offline',()=>{user=null; offlineAccount=true; key=lastKey; state='offlineAccount'; return launch();});
     btn(m,last?'Play as a guest instead':'Play as a guest',guest,'quiet');
     if(!configured) m.append(el('p','sf-note','Google sign-in is not set up yet. Guest play saves on this device.'));}
   catch(e){failure(e.message);}}
 // held upright, only the turn-sideways card shows; nothing loads until the phone is sideways, so you see the loading from the start
 screen('Sunfield Farm',null); sideways().then(boot);
})();
