import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';
const engine=ReplayEngine.fromHtml(await loadGameHtml());
const c=engine.fresh();engine.startChallenge(c);
const out=vm.runInContext(`(()=>{
  const names=Object.getOwnPropertyNames(globalThis).filter(k=>/win|victor|depend|independ|ending|population|settle|crew|complete|goal|success/i.test(k)).sort();
  const vals={};
  for(const n of names){
    try{
      const v=globalThis[n];
      vals[n]=typeof v==='function'?{type:'function',src:String(v).slice(0,12000)}:{type:typeof v,value:v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
    }catch(e){vals[n]={error:e.message}}
  }
  const stateKeys=Object.keys(state).filter(k=>/win|victor|depend|independ|population|settle|crew|complete|goal|success/i.test(k));
  const stateVals={};for(const k of stateKeys)stateVals[k]=JSON.parse(JSON.stringify(state[k]));
  return {names,vals,stateVals};
})()`,c,{timeout:3000});
console.log(JSON.stringify(out,null,2));
