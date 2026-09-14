import {ReplayEngine} from './replay-engine.mjs';
import {loadGameHtml} from './game-source.mjs';
const BASE=process.env.BASE_URL||'http://127.0.0.1:8787';
const engine=ReplayEngine.fromHtml(await loadGameHtml());
function assert(x,m){if(!x)throw new Error(m)}
function hs(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function sig(r){const c={...r};delete c.signature;const s=JSON.stringify(c);return (hs(s).toString(16).padStart(8,'0')+hs(s.split('').reverse().join('')).toString(16).padStart(8,'0')).toUpperCase()}
const homeR=await fetch(BASE+'/');const home=await homeR.text();assert(homeR.status===200&&home.includes('id="tr-race-launch"')&&home.includes('<title>TRILLIONAIRE — Mars Race</title>'),'launch UI missing from home');console.log('PASS launch leaderboard surface');
const lbR=await fetch(BASE+'/leaderboard');const lb=await lbR.text();assert(lbR.status===200&&lb.includes('id="tr-race-modal"')&&lb.includes('TRILLIONAIRE_OPEN_LEADERBOARD'),'leaderboard route missing');console.log('PASS leaderboard route');
const meta=await (await fetch(BASE+'/api/v1/meta')).json();assert(meta.online&&meta.ruleset==='COMP-1.2'&&meta.build==='v0.095','meta mismatch');console.log('PASS meta');
const regR=await fetch(BASE+'/api/v1/players/anonymous',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({handle:'QA-VERIFY'})});assert(regR.status===201,'register failed');const ident=await regR.json();console.log('PASS anonymous identity');
const meR=await fetch(BASE+'/api/v1/players/me',{headers:{authorization:'Bearer '+ident.token}});assert(meR.status===200,'me failed');console.log('PASS authenticated identity');
const patchR=await fetch(BASE+'/api/v1/players/me',{method:'PATCH',headers:{'content-type':'application/json',authorization:'Bearer '+ident.token},body:JSON.stringify({handle:'QA-UPDATED'})});assert(patchR.status===200,'handle update failed');console.log('PASS handle update');
const run=engine.generateHoldRun();const payload={protocol:'TRILLIONAIRE-RUN-1',submittedAt:new Date().toISOString(),clientBuild:'v0.095',season:'S01-W01',ruleset:'COMP-1.2',player:{handle:'IGNORED'},run};
const unauth=await fetch(BASE+'/api/v1/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});assert(unauth.status===401,'unauth submission accepted');console.log('PASS auth required');
const good=await fetch(BASE+'/api/v1/runs',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+ident.token},body:JSON.stringify(payload)});const goodJ=await good.json();assert(good.status===201&&goodJ.verified===true,'valid replay rejected');console.log('PASS authoritative replay accepted');
const duplicate=await fetch(BASE+'/api/v1/runs',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+ident.token},body:JSON.stringify(payload)});assert(duplicate.status===200&&(await duplicate.json()).duplicate===true,'duplicate handling failed');console.log('PASS duplicate signature');
const cheatRun=engine.generateHoldRun();cheatRun.score+=9999;cheatRun.signature=sig(cheatRun);const cheatPayload={...payload,run:cheatRun,submittedAt:new Date().toISOString()};const cheat=await fetch(BASE+'/api/v1/runs',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+ident.token},body:JSON.stringify(cheatPayload)});assert(cheat.status===422,'forged score not rejected');console.log('PASS forged score rejected');
for(const b of ['canonical','fastest','efficient']){const r=await fetch(BASE+'/api/v1/leaderboards/current?board='+b+'&limit=10');const j=await r.json();assert(r.status===200&&Array.isArray(j.rows)&&Number.isFinite(Number(j.count)),'board '+b+' failed');console.log('PASS board',b,'count',j.count)}
const board=await (await fetch(BASE+'/api/v1/leaderboards/current?board=canonical&limit=10')).json();assert(board.rows[0]?.handle==='QA-UPDATED','board did not use current server identity');console.log('PASS server identity controls leaderboard name');
console.log('ALL COMPETITIVE SERVER QA PASSED');
