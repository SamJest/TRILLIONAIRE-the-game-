import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';

const engine=ReplayEngine.fromHtml(await loadGameHtml());
const personas=[
  ['Balanced',{launch:1,energy:1,robotics:1,autonomy:1,habitat:1,life:1,industry:1,reliability:1.2},7,1,1,'none'],
  ['Reliability first',{reliability:3,energy:1.2,life:1.2,industry:1},16,2,2,'sovereign'],
  ['Launch rush',{launch:3,industry:1,reliability:.4,habitat:.8},2,0,0,'syndicate'],
  ['Robotics/autonomy',{robotics:2.7,autonomy:2.5,industry:1.3,energy:1},8,1,2,'supplier_equity'],
  ['Industry stack',{industry:3,robotics:1.6,energy:1.4,reliability:.8},8,1,1,'syndicate'],
  ['Habitat/life',{habitat:2.7,life:2.8,energy:1.2,reliability:1},9,1,1,'sovereign'],
  ['Low risk',{reliability:2,life:1.2,energy:1.2,industry:1},30,2,2,'none'],
  ['High risk growth',{launch:1.6,industry:1.6,robotics:1.6,habitat:1.4,life:1.2,reliability:.2},0,0,0,'syndicate'],
  ['Capital conservative',{reliability:1.5,industry:1.1,energy:1.1,life:1.1},14,2,1,'none'],
  ['Debt maximiser',{launch:1.7,industry:1.7,robotics:1.3,energy:1.2},5,0,0,'syndicate'],
  ['Open ecosystem',{industry:1.7,autonomy:1.5,reliability:1.4,life:1},10,2,2,'supplier_equity'],
  ['Vertical empire',{launch:1.7,industry:1.7,energy:1.5,reliability:.9},7,1,1,'public_bond'],
  ['Fast iteration',{launch:2,robotics:1.7,industry:1.6,reliability:.3},2,0,0,'public_bond'],
  ['Qualification first',{reliability:2.6,energy:1.4,life:1.3,habitat:1.2},20,2,2,'sovereign'],
  ['Mars independence',{industry:2.2,life:2,energy:1.8,robotics:1.7,autonomy:1.5,habitat:1.5,reliability:1.1},8,1,1,'supplier_equity'],
  ['Approval friendly',{life:1.6,habitat:1.5,reliability:1.4,energy:1.2},12,2,2,'public_bond'],
  ['Cheap projects',{reliability:1.3,industry:1.1,autonomy:1.1},18,1,1,'none'],
  ['Megaproject seeker',{industry:2,energy:1.8,launch:1.8,habitat:1.5,robotics:1.5,reliability:.8},4,0,1,'syndicate'],
  ['Distributed systems',{energy:2,reliability:2,autonomy:1.6,robotics:1.2},12,2,2,'supplier_equity'],
  ['Chaos mixed',{launch:1.3,energy:.7,robotics:1.8,autonomy:.8,habitat:1.4,life:.9,industry:2.1,reliability:.5},1,0,2,'public_bond']
];

const clone=x=>JSON.parse(JSON.stringify(x));
function evalIn(c,src){return vm.runInContext(src,c,{timeout:3000})}
function actionCount(c){return engine.actions(c).length}
function tryCall(c,src){const before=actionCount(c);try{evalIn(c,src)}catch{}return actionCount(c)>before}
function snapshot(c){return evalIn(c,`(()=>({phase:state.phase,turn:state.turn,pending:!!state.pendingIncident,special:!!(SPECIALS[state.turn]&&!state.specialDone[state.turn]),cash:state.cash,debt:state.debt,approval:state.approval,investor:state.investor,government:state.government,influence:state.influence,systems:JSON.parse(JSON.stringify(state.systems)),built:JSON.parse(JSON.stringify(state.built)),pipeline:JSON.parse(JSON.stringify(state.pipeline)),selected:JSON.parse(JSON.stringify(state.selectedProjects)),doctrines:JSON.parse(JSON.stringify(state.doctrines||{})),activeDeals:JSON.parse(JSON.stringify(state.activeDeals||[]))}))()`) }
function chooseProjects(c,weights,riskPenalty,name){
  const spec=JSON.stringify({weights,riskPenalty,name});
  return evalIn(c,`(()=>{
    const spec=${spec};
    const builtIds=new Set(Array.isArray(state.built)?state.built.map(x=>typeof x==='string'?x:x?.id):Object.keys(state.built||{}).filter(k=>state.built[k]));
    const pipeIds=new Set((state.pipeline||[]).map(x=>typeof x==='string'?x:x?.id));
    const sys=state.systems||{};
    const eligible=p=>{
      if(builtIds.has(p.id)||pipeIds.has(p.id))return false;
      if(p.excludes?.some(x=>builtIds.has(x)))return false;
      if(p.chainAll&&!p.chainAll.every(x=>builtIds.has(x)))return false;
      if(p.chainAny&&!p.chainAny.some(x=>builtIds.has(x)))return false;
      if(p.req&&!Object.entries(p.req).every(([k,v])=>Number(sys[k]||0)>=Number(v)))return false;
      return true;
    };
    const score=p=>{
      let s=0;
      for(const [k,v] of Object.entries(p.effects||{}))s+=(spec.weights[k]||0.25)*Number(v||0);
      s-=Number(p.risk||0)*100*spec.riskPenalty/10;
      if(spec.name==='Cheap projects')s-=Number(p.cost||0)*1.5;
      if(spec.name==='Megaproject seeker'&&(p.cat||'').includes('MEGAPROJECT'))s+=40;
      if(spec.name==='Distributed systems'&&p.id==='distributed_power_mesh')s+=50;
      if(spec.name==='Mars independence'&&['industrial_stack','settlement_package','closed_ecology','machine_ecosystem','independence_sprint'].includes(p.id))s+=30;
      return s;
    };
    return PROJECTS.filter(eligible).sort((a,b)=>score(b)-score(a)||a.cost-b.cost).slice(0,12).map(p=>({id:p.id,name:p.name,cost:p.cost,risk:p.risk,score:score(p)}));
  })()`);
}
function choosePortfolio(c,p){
  const ranked=chooseProjects(c,p.weights,p.riskPenalty,p.name);
  const max=p.name==='Capital conservative'||p.name==='Low risk'?1:3;
  let selected=0;
  for(const proj of ranked){
    if(selected>=max)break;
    const ok=tryCall(c,`toggleProject(${JSON.stringify(proj.id)})`);
    const now=snapshot(c).selected;
    if(ok||now.includes?.(proj.id)||now.some?.(x=>x?.id===proj.id))selected=now.length;
  }
  if(snapshot(c).selected.length){
    if(tryCall(c,'commitPortfolio()'))return 'portfolio';
  }
  if(tryCall(c,'holdCycle089()'))return 'hold';
  return 'stuck';
}
function maybeDoctrine(c,p){
  const t=snapshot(c).turn;
  if(t===0){
    const key=p.name==='Open ecosystem'?'open':'vertical';
    tryCall(c,`chooseDoctrine('procurement','${key}')`);
  }
  if(t===1){
    const key=['Fast iteration','Launch rush','High risk growth','Chaos mixed'].includes(p.name)?'iterate':'qualify';
    tryCall(c,`chooseDoctrine('execution','${key}')`);
  }
  if(t===2){
    const key=['Robotics/autonomy','Mars independence','Distributed systems'].includes(p.name)?'delegated':'review';
    tryCall(c,`chooseDoctrine('autonomy','${key}')`);
  }
}
function maybeFinance(c,p){
  const s=snapshot(c);
  if(p.finance!=='none'&&s.turn===0)tryCall(c,`applyCapitalDeal('${p.finance}')`);
  if(p.name==='Debt maximiser'&&[3,7,11].includes(s.turn))tryCall(c,'raiseDebt()');
  if(p.name==='Capital conservative'&&s.debt>80)tryCall(c,'repayDebt()');
}
function runPersona(tuple){
  const [name,weights,riskPenalty,incidentChoice,specialChoice,finance]=tuple;
  const p={name,weights,riskPenalty,incidentChoice,specialChoice,finance};
  const c=engine.fresh();engine.startChallenge(c);
  const trace=[];let guard=0,stuck=null;
  while(snapshot(c).phase!=='ending'&&guard++<240){
    const s=snapshot(c);const before=actionCount(c);
    try{
      if(s.pending){evalIn(c,`chooseIncident(${p.incidentChoice})`)}
      else if(s.phase==='incidentOutcome'){evalIn(c,'continueAfterIncident()')}
      else if(s.special){evalIn(c,`chooseSpecial(${p.specialChoice})`)}
      else if(s.phase==='outcome'){evalIn(c,'advance()')}
      else if(s.phase==='event'){
        maybeDoctrine(c,p);maybeFinance(c,p);
        choosePortfolio(c,p);
      }else{
        stuck='unhandled phase '+s.phase;break;
      }
    }catch(e){stuck=e.message;break}
    const after=actionCount(c);
    trace.push({turn:s.turn,phase:s.phase,actionsAdded:after-before,cash:s.cash,debt:s.debt});
    if(after===before&&snapshot(c).phase===s.phase&&snapshot(c).turn===s.turn){stuck='no state/action progress';break}
  }
  const record=engine.record(c);const actions=engine.actions(c);
  let replayOk=false,replayError='';
  try{const rr=engine.replay(actions);replayOk=JSON.stringify(rr.record)===JSON.stringify(record)}catch(e){replayError=e.message}
  return {name,guard,stuck,replayOk,replayError,actions:actions.length,record,traceTail:trace.slice(-6)};
}

const results=personas.map(runPersona);
const wins=results.filter(r=>r.record?.won).length;
const stuck=results.filter(r=>r.stuck).length;
const replayFailures=results.filter(r=>!r.replayOk).length;
console.log('BETA20_SUMMARY '+JSON.stringify({runs:results.length,wins,losses:results.length-wins,stuck,replayFailures}));
for(const r of results){
  const x=r.record||{};
  console.log('BETA20_RUN '+JSON.stringify({name:r.name,won:!!x.won,score:x.score,grade:x.grade,turn:x.turn,completion:x.completion,dependency:x.dependency,reliability:x.reliability,capital:x.capital,debt:x.debt,failures:x.failures,slips:x.slips,population:x.population,architecture:x.architecture,fingerprint:x.fingerprint,rival:x.rival,actions:r.actions,replayOk:r.replayOk,stuck:r.stuck,replayError:r.replayError}));
}
const scores=results.map(r=>Number(r.record?.score||0));
const deps=results.map(r=>Number(r.record?.dependency||0));
const reli=results.map(r=>Number(r.record?.reliability||0));
const avg=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
console.log('BETA20_AGG '+JSON.stringify({avgScore:Math.round(avg(scores)),minScore:Math.min(...scores),maxScore:Math.max(...scores),avgDependency:+avg(deps).toFixed(1),avgReliability:+avg(reli).toFixed(1),uniqueArchitectures:[...new Set(results.map(r=>r.record?.architecture).filter(Boolean))],uniqueFingerprints:[...new Set(results.map(r=>r.record?.fingerprint).filter(Boolean))].length}));
if(stuck||replayFailures)process.exitCode=2;
