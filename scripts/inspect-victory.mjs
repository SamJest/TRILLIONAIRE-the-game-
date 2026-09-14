import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';
const engine=ReplayEngine.fromHtml(await loadGameHtml());
const c=engine.fresh();engine.startChallenge(c);
const out=vm.runInContext(`(()=>{
  const funcs={};
  for(const n of Object.getOwnPropertyNames(globalThis)){
    try{
      const v=globalThis[n];
      if(typeof v!=='function')continue;
      const src=String(v);
      if(src.includes('state.won')||src.includes('TARGETS')||src.includes('earthDependency()'))funcs[n]=src.slice(0,30000);
    }catch{}
  }
  const extras={};
  try{extras.targets=JSON.parse(JSON.stringify(TARGETS))}catch{}
  try{extras.record=String(competitiveRunRecord086).slice(0,30000)}catch{}
  return {funcs,extras};
})()`,c,{timeout:3000});
console.log(JSON.stringify(out,null,2));
