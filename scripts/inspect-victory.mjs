import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';
const engine=ReplayEngine.fromHtml(await loadGameHtml());
const c=engine.fresh();engine.startChallenge(c);
const out=vm.runInContext(`(()=>{
  const names=Object.getOwnPropertyNames(globalThis).filter(k=>/win|victor|depend|independ|ending|population|settle|crew|complete|goal|success|score|grade|target|record/i.test(k)).sort();
  const vals={};
  for(const n of names){
    try{
      const v=globalThis[n];
      vals[n]=typeof v==='function'?{type:'function',src:String(v).slice(0,20000)}:{type:typeof v,value:v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
    }catch(e){vals[n]={error:e.message}}
  }
  const extras={};
  try{extras.oldEnding=String(oldEnding).slice(0,30000)}catch{}
  try{extras.record=String(competitiveRunRecord086).slice(0,30000)}catch{}
  try{extras.targets=JSON.parse(JSON.stringify(TARGETS))}catch{}
  return {names,vals,extras};
})()`,c,{timeout:3000});
console.log(JSON.stringify(out,null,2));
