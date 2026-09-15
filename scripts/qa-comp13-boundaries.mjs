import vm from 'node:vm';
import {loadGameHtml} from '../game-source.mjs';
import {ReplayEngine} from '../replay-engine.mjs';

const html=await loadGameHtml();
const engine=ReplayEngine.fromHtml(html);
const c=engine.fresh();
const ev=s=>vm.runInContext(s,c,{timeout:3000});
const TARGETS={launch:66,energy:70,robotics:58,habitat:64,life:68,industry:64,autonomy:56,reliability:68};

function fail(msg){throw new Error(msg)}
function assert(cond,msg){if(!cond)fail(msg)}
function setState({ratio=.88,turn=18,crew=true,reliability=68,debt=0,launchRatio=null}={}){
  const systems={};
  for(const [k,v] of Object.entries(TARGETS))systems[k]=k==='reliability'?reliability:v*ratio;
  if(launchRatio!==null)systems.launch=TARGETS.launch*launchRatio;
  ev(`state.turn=${turn};state.flags.crew=${crew?'true':'false'};state.debt=${debt};state.systems=${JSON.stringify(systems)};state.built=[];state.pipeline=[];`);
}
function completion(){return !!ev('completion()')}
function dep(){return Number(ev('earthDependency()'))}

assert(ev('COMPETITIVE_RULESET086')==='COMP-1.3','window competitive ruleset is not COMP-1.3');
assert(ev('TRILLIONAIRE_BUILD093')==='v0.096','window build is not v0.096');
assert(!html.includes('COMP-1.2'),'stale COMP-1.2 remains in patched raw game HTML');
assert(html.includes('88% readiness · 65% system floor'),'visible COMP-1.3 objective missing');
assert(html.includes('timeline turn '),'finish gate does not expose timeline requirement');

setState();
assert(dep()<=18,`positive fixture dependency unexpectedly ${dep()}`);
assert(completion(),'valid COMP-1.3 boundary fixture did not win');

setState({turn:17});
assert(!completion(),'turn 17 incorrectly wins');
setState({crew:false});
assert(!completion(),'missing crew incorrectly wins');
setState({ratio:.87});
assert(!completion(),'87% average readiness incorrectly wins');
setState({ratio:1,launchRatio:.64});
assert(!completion(),'64% system floor incorrectly wins');
setState({reliability:67});
assert(!completion(),'reliability 67 incorrectly wins');
setState({debt:220});
assert(!completion(),'debt 220 incorrectly wins');

setState({ratio:.88});
ev('earthDependency=()=>18.01');
assert(!completion(),'dependency above 18 incorrectly wins');
ev('earthDependency=()=>18');
assert(completion(),'dependency exactly 18 should win with other gates met');

ev('earthDependency=()=>0');
setState({ratio:1,launchRatio:.65});
assert(completion(),'system floor exactly 65% should win with other gates met');

console.log('COMP13_BOUNDARY_QA '+JSON.stringify({ok:true,ruleset:'COMP-1.3',build:'v0.096',checks:10,readiness:88,floor:65,minTurn:18}));
