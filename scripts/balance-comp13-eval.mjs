import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';

const engine=ReplayEngine.fromHtml(await loadGameHtml());
const N=Math.max(1,Number(process.env.COUNT||30));
const OFFSET=Math.max(0,Number(process.env.OFFSET||0));
const CHECK_REPLAY=process.env.CHECK_REPLAY==='1';
const TARGETS={launch:66,energy:70,robotics:58,habitat:64,life:68,industry:64,autonomy:56,reliability:68};
const CORE=['launch','energy','robotics','habitat','life','industry','autonomy'];
const RULES={
  strict93_floor75:s=>gate(s)&&avgReadiness(s)>=.93&&minReadiness(s)>=.75,
  balanced90_floor70:s=>gate(s)&&avgReadiness(s)>=.90&&minReadiness(s)>=.70,
  sixOfSeven_floor75:s=>gate(s)&&countMet(s)>=6&&minReadiness(s)>=.75,
  fiveOfSeven_avg92_floor75:s=>gate(s)&&countMet(s)>=5&&avgReadiness(s)>=.92&&minReadiness(s)>=.75,
  fiveOfSeven_avg90_floor70:s=>gate(s)&&countMet(s)>=5&&avgReadiness(s)>=.90&&minReadiness(s)>=.70
};
function gate(s){return !!s.flags?.crew&&s.dep<=18&&(s.systems?.reliability||0)>=68&&(s.debt||0)<220}
function ratios(s){return CORE.map(k=>Math.min(1,(s.systems?.[k]||0)/TARGETS[k]))}
function avgReadiness(s){const r=ratios(s);return r.reduce((a,b)=>a+b,0)/r.length}
function minReadiness(s){return Math.min(...ratios(s))}
function countMet(s){return CORE.filter(k=>(s.systems?.[k]||0)>=TARGETS[k]).length}
function ev(c,s){return vm.runInContext(s,c,{timeout:3000})}
function ac(c){return engine.actions(c).length}
function call(c,s){const b=ac(c);try{ev(c,s)}catch{}return ac(c)>b}
function snap(c){return ev(c,`(()=>({phase:state.phase,turn:state.turn,pending:!!state.pendingIncident,special:!!(SPECIALS[state.turn]&&!state.specialDone[state.turn]),cash:state.cash,debt:state.debt,systems:JSON.parse(JSON.stringify(state.systems||{})),built:JSON.parse(JSON.stringify(state.built||[])),pipeline:JSON.parse(JSON.stringify(state.pipeline||[])),selected:JSON.parse(JSON.stringify(state.selectedProjects||[])),flags:JSON.parse(JSON.stringify(state.flags||{})),dep:earthDependency(),rival:state.rival,failures:state.stats?.failures||0}))()`)}
function rng(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function choose(c,p){const data=JSON.stringify(p);const ranked=ev(c,`(()=>{const p=${data};const b=new Set(Array.isArray(state.built)?state.built.map(x=>typeof x==='string'?x:x?.id):Object.keys(state.built||{}).filter(k=>state.built[k]));const q=new Set((state.pipeline||[]).map(x=>typeof x==='string'?x:x?.id));const sys=state.systems||{};const ratios=Object.fromEntries(Object.entries(TARGETS).map(([k,v])=>[k,(sys[k]||0)/v]));const ok=x=>!b.has(x.id)&&!q.has(x.id)&&!(x.excludes||[]).some(id=>b.has(id))&&(!x.chainAll||x.chainAll.every(id=>b.has(id)))&&(!x.chainAny||x.chainAny.some(id=>b.has(id)))&&(!x.req||Object.entries(x.req).every(([k,v])=>Number(sys[k]||0)>=Number(v)));const strategic=new Set(['water','regolith','spares','closed_loop','greenhouse','machine_ecosystem','industrial_stack','closed_ecology','oxygen_fuel_complex','automated_mines','settlement_package','open_standard','boring_tests','construction_swarm','humanoids','mission_ai','digital_twin']);const score=x=>{let s=0;for(const [k,v] of Object.entries(x.effects||{})){const deficit=Math.max(.02,1-Math.min(1.2,ratios[k]||0));s+=Number(v||0)*(p.base[k]||1)*(2.5+deficit*p.deficit)}s-=Number(x.risk||0)*100*p.risk;s-=Number(x.cost||0)*p.cost;if(strategic.has(x.id))s+=p.strategic;if(x.id==='crew_later'&&!state.flags.crew&&state.turn>12)s+=p.crewProject;return s};return PROJECTS.filter(ok).sort((a,z)=>score(z)-score(a)||a.cost-z.cost).slice(0,14).map(x=>x.id)})()`);let n=0;for(const id of ranked){if(n>=p.portfolio)break;call(c,`toggleProject(${JSON.stringify(id)})`);n=snap(c).selected.length}if(snap(c).selected.length&&call(c,'commitPortfolio()'))return true;return call(c,'holdCycle089()')}
function run(i){const r=rng(0x9e3779b9^(i*2654435761));const keys=Object.keys(TARGETS);const base={};for(const k of keys)base[k]=0.75+r()*1.5;const p={base,deficit:6+r()*12,risk:.08+r()*.45,cost:r()*.18,strategic:5+r()*25,crewProject:40+r()*100,portfolio:r()<.12?1:r()<.35?2:3,finance:['none','supplier_equity','sovereign','public_bond'][Math.floor(r()*4)],proc:r()<.65?'open':'vertical',exec:r()<.82?'qualify':'iterate',auto:r()<.75?'review':'delegated',incident:Math.floor(r()*3),crewReadiness:48+r()*22};const c=engine.fresh();engine.startChallenge(c);let guard=0,stuck=null;const first={};
 const check=()=>{const s=snap(c);for(const [name,fn] of Object.entries(RULES)){if(!first[name]&&fn(s))first[name]={turn:s.turn,dep:+s.dep.toFixed(2),debt:+Number(s.debt||0).toFixed(1),reliability:+Number(s.systems.reliability||0).toFixed(1),avg:+avgReadiness(s).toFixed(3),min:+minReadiness(s).toFixed(3),met:countMet(s),systems:s.systems,crew:!!s.flags?.crew}}};check();
 while(snap(c).phase!=='ending'&&guard++<300){const s=snap(c),before=ac(c);try{if(s.pending)ev(c,`chooseIncident(${p.incident})`);else if(s.phase==='incidentOutcome')ev(c,'continueAfterIncident()');else if(s.special){if(s.turn===12){const ready=(s.systems.launch+s.systems.habitat+s.systems.life+s.systems.reliability+s.systems.energy)/5;ev(c,`chooseSpecial(${ready>=p.crewReadiness?0:1})`)}else ev(c,`chooseSpecial(${Math.floor(r()*3)})`)}else if(s.phase==='outcome')ev(c,'advance()');else if(s.phase==='event'){if(s.turn===0){call(c,`chooseDoctrine('procurement','${p.proc}')`);if(p.finance!=='none')call(c,`applyCapitalDeal('${p.finance}')`)}if(s.turn===1)call(c,`chooseDoctrine('execution','${p.exec}')`);if(s.turn===2)call(c,`chooseDoctrine('autonomy','${p.auto}')`);if(s.debt>=205)call(c,'repayDebt()');choose(c,p)}else{stuck='phase '+s.phase;break}}catch(e){stuck=e.message;break}check();if(ac(c)===before&&snap(c).phase===s.phase&&snap(c).turn===s.turn){stuck='no progress';break}}
 const final=snap(c),record=engine.record(c),actions=engine.actions(c);let replayOk=true;if(CHECK_REPLAY){try{const rr=engine.replay(actions);replayOk=JSON.stringify(rr.record)===JSON.stringify(record)}catch{replayOk=false}}return{i,p,first,final,record,stuck,replayOk};}
const results=[];for(let n=0;n<N;n++)results.push(run(OFFSET+n));
const summary={offset:OFFSET,attempted:N,currentWins:results.filter(x=>x.record?.won).length,stuck:results.filter(x=>x.stuck).length,replayFailures:results.filter(x=>!x.replayOk).length,rules:{}};
for(const name of Object.keys(RULES)){const wins=results.filter(x=>x.first[name]);const turns=wins.map(x=>x.first[name].turn);summary.rules[name]={wins:wins.length,rate:+(wins.length/N*100).toFixed(1),medianTurn:turns.length?turns.sort((a,b)=>a-b)[Math.floor(turns.length/2)]:null,minTurn:turns.length?Math.min(...turns):null,maxTurn:turns.length?Math.max(...turns):null};}
console.log('COMP13_EVAL '+JSON.stringify(summary));
for(const name of Object.keys(RULES)){const wins=results.filter(x=>x.first[name]).sort((a,b)=>a.first[name].turn-b.first[name].turn||Number(b.record?.score||0)-Number(a.record?.score||0)).slice(0,3);for(const x of wins)console.log('COMP13_WIN '+JSON.stringify({rule:name,i:x.i,trigger:x.first[name],finalScore:x.record?.score,finalGrade:x.record?.grade,finance:x.p.finance,doctrines:[x.p.proc,x.p.exec,x.p.auto]}));}
if(summary.stuck||summary.replayFailures)process.exitCode=2;
