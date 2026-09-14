import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';

const engine=ReplayEngine.fromHtml(await loadGameHtml());
const clone=x=>JSON.parse(JSON.stringify(x));
const profiles=[
  ['Safe crew',{launch:2.2,energy:1.8,habitat:2.3,life:2.5,reliability:3,industry:1.1,robotics:.9,autonomy:.7},22,'sovereign',0],
  ['Overbuilt crew',{launch:2,energy:2,habitat:2.5,life:2.7,reliability:3.2,industry:1.4,robotics:1.1,autonomy:.8},25,'supplier_equity',0],
  ['Launch and safety',{launch:3,energy:1.7,habitat:2,life:2,reliability:2.7,industry:1,robotics:.8,autonomy:.7},18,'sovereign',0],
  ['Habitat life crew',{launch:1.8,energy:1.8,habitat:3,life:3,reliability:2.5,industry:1,robotics:.8,autonomy:.6},20,'sovereign',0],
  ['Power resilience crew',{launch:1.9,energy:2.8,habitat:2.1,life:2.2,reliability:3.2,industry:1.1,robotics:.8,autonomy:.7},22,'supplier_equity',0],
  ['Balanced crew',{launch:2,energy:2,habitat:2,life:2,reliability:2.5,industry:1.3,robotics:1.2,autonomy:1},18,'public_bond',0],
  ['No finance crew',{launch:2.1,energy:1.9,habitat:2.2,life:2.4,reliability:3,industry:1,robotics:.8,autonomy:.7},22,'none',0],
  ['Open safe crew',{launch:1.9,energy:1.9,habitat:2.2,life:2.3,reliability:2.8,industry:1.5,robotics:1,autonomy:1.2},20,'supplier_equity',0],
  ['Delay then crew project',{launch:2,energy:2,habitat:2.5,life:2.7,reliability:3,industry:1.4,robotics:1,autonomy:.8},24,'sovereign',1],
  ['Robots then crew project',{launch:2,energy:2,habitat:2.4,life:2.5,reliability:3,industry:1.5,robotics:1.4,autonomy:1.2},23,'supplier_equity',2]
];
function ev(c,s){return vm.runInContext(s,c,{timeout:3000})}
function ac(c){return engine.actions(c).length}
function call(c,s){const b=ac(c);try{ev(c,s)}catch{}return ac(c)>b}
function snap(c){return ev(c,`(()=>({
  phase:state.phase,turn:state.turn,pending:!!state.pendingIncident,
  special:!!(SPECIALS[state.turn]&&!state.specialDone[state.turn]),
  cash:state.cash,debt:state.debt,approval:state.approval,
  systems:JSON.parse(JSON.stringify(state.systems||{})),
  built:JSON.parse(JSON.stringify(state.built||[])),
  pipeline:JSON.parse(JSON.stringify(state.pipeline||[])),
  selected:JSON.parse(JSON.stringify(state.selectedProjects||[])),
  stats:JSON.parse(JSON.stringify(state.stats||{})),
  flags:JSON.parse(JSON.stringify(state.flags||{})),
  localMars034:JSON.parse(JSON.stringify(state.localMars034||{})),
  localMars035:JSON.parse(JSON.stringify(state.localMars035||{})),
  recent:JSON.parse(JSON.stringify(state.recent||[]))
}))()`)}
function builtIds(s){return new Set(Array.isArray(s.built)?s.built.map(x=>typeof x==='string'?x:x?.id):Object.keys(s.built||{}).filter(k=>s.built[k]))}
function choose(c,p){
  const data=JSON.stringify(p);
  const ranked=ev(c,`(()=>{
    const p=${data};const builtIds=new Set(Array.isArray(state.built)?state.built.map(x=>typeof x==='string'?x:x?.id):Object.keys(state.built||{}).filter(k=>state.built[k]));
    const pipeIds=new Set((state.pipeline||[]).map(x=>typeof x==='string'?x:x?.id));const sys=state.systems||{};
    const ok=x=>!builtIds.has(x.id)&&!pipeIds.has(x.id)&&!(x.excludes||[]).some(id=>builtIds.has(id))&&(!x.chainAll||x.chainAll.every(id=>builtIds.has(id)))&&(!x.chainAny||x.chainAny.some(id=>builtIds.has(id)))&&(!x.req||Object.entries(x.req).every(([k,v])=>Number(sys[k]||0)>=Number(v)));
    const score=x=>Object.entries(x.effects||{}).reduce((a,[k,v])=>a+(p.weights[k]||.2)*Number(v||0),0)-Number(x.risk||0)*p.riskPenalty*8 + (x.id==='crew_later'&&state.turn>12?120:0);
    return PROJECTS.filter(ok).sort((a,b)=>score(b)-score(a)||a.cost-b.cost).slice(0,10).map(x=>x.id);
  })()`);
  let n=0;for(const id of ranked){if(n>=3)break;call(c,`toggleProject(${JSON.stringify(id)})`);n=snap(c).selected.length}
  if(snap(c).selected.length&&call(c,'commitPortfolio()'))return;
  call(c,'holdCycle089()');
}
function run(tuple){
  const [name,weights,riskPenalty,finance,crewChoice]=tuple;const p={name,weights,riskPenalty,finance,crewChoice};
  const c=engine.fresh();engine.startChallenge(c);let guard=0,stuck=null;const crewTrace=[];
  while(snap(c).phase!=='ending'&&guard++<260){
    const s=snap(c);const before=ac(c);
    try{
      if(s.pending)ev(c,'chooseIncident(2)');
      else if(s.phase==='incidentOutcome')ev(c,'continueAfterIncident()');
      else if(s.special){
        const pre=snap(c);const recPre=engine.record(c);
        ev(c,`chooseSpecial(${p.crewChoice})`);
        const post=snap(c);const recPost=engine.record(c);
        crewTrace.push({turn:s.turn,choice:p.crewChoice,pre,post,recordPre:recPre,recordPost:recPost});
      }
      else if(s.phase==='outcome')ev(c,'advance()');
      else if(s.phase==='event'){
        if(s.turn===0){call(c,"chooseDoctrine('procurement','open')");if(p.finance!=='none')call(c,`applyCapitalDeal('${p.finance}')`)}
        if(s.turn===1)call(c,"chooseDoctrine('execution','qualify')");
        if(s.turn===2)call(c,"chooseDoctrine('autonomy','review')");
        choose(c,p);
      } else {stuck='phase '+s.phase;break}
    }catch(e){stuck=e.message;break}
    if(ac(c)===before&&snap(c).phase===s.phase&&snap(c).turn===s.turn){stuck='no progress';break}
  }
  const record=engine.record(c),actions=engine.actions(c);let replayOk=false,replayError='';
  try{const r=engine.replay(actions);replayOk=JSON.stringify(r.record)===JSON.stringify(record)}catch(e){replayError=e.message}
  return {name,crewChoice,record,crewTrace,stuck,replayOk,replayError,actions:actions.length};
}
const results=profiles.map(run);
console.log('CREW_PATH_SUMMARY '+JSON.stringify({runs:results.length,wins:results.filter(x=>x.record?.won).length,stuck:results.filter(x=>x.stuck).length,replayFailures:results.filter(x=>!x.replayOk).length}));
for(const r of results){
  const x=r.record||{};const t=r.crewTrace.find(x=>x.turn===12)||r.crewTrace[0];
  console.log('CREW_PATH_RUN '+JSON.stringify({name:r.name,choice:r.crewChoice,won:!!x.won,score:x.score,grade:x.grade,completion:x.completion,dependency:x.dependency,reliability:x.reliability,population:x.population,failures:x.failures,turn:x.turn,architecture:x.architecture,replayOk:r.replayOk,stuck:r.stuck,preCrew:t?{systems:t.pre.systems,stats:t.pre.stats,flags:t.pre.flags,local034:t.pre.localMars034,local035:t.pre.localMars035}:null,postCrew:t?{phase:t.post.phase,systems:t.post.systems,stats:t.post.stats,flags:t.post.flags,local034:t.post.localMars034,local035:t.post.localMars035}:null}));
}
if(results.some(x=>x.stuck||!x.replayOk))process.exitCode=2;
