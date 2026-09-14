import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';

const engine=ReplayEngine.fromHtml(await loadGameHtml());
const c=engine.fresh();
engine.startChallenge(c);
const out=vm.runInContext(`(()=>{
  const clean=v=>JSON.parse(JSON.stringify(v));
  const globals=Object.getOwnPropertyNames(globalThis).filter(k=>/PROJECT|SPECIAL|DOCTR|DEAL|CAPITAL|PORTFOLIO|INCIDENT|DISTRICT|state/i.test(k)).sort();
  const stateKeys=Object.keys(state).sort();
  const summary={phase:state.phase,turn:state.turn,mode:state.mode,stateKeys,globals};
  for(const name of globals){
    try{
      const v=globalThis[name];
      if(Array.isArray(v))summary[name]={type:'array',length:v.length,sample:clean(v.slice(0,5))};
      else if(v&&typeof v==='object')summary[name]={type:'object',keys:Object.keys(v).slice(0,40),sample:clean(Object.fromEntries(Object.entries(v).slice(0,5)))};
      else if(typeof v!=='function')summary[name]={type:typeof v,value:v};
    }catch{}
  }
  return summary;
})()`,c);
console.log(JSON.stringify(out,null,2));
