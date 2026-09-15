import vm from 'node:vm';
import {loadGameHtml} from '../game-source.mjs';
import {ReplayEngine} from '../replay-engine.mjs';

const html=await loadGameHtml();
function excerpts(term){
  let p=0,n=0;
  while((p=html.indexOf(term,p))!==-1&&n<20){
    console.log(`HTML_MATCH ${JSON.stringify({term,n,pos:p,text:html.slice(Math.max(0,p-260),Math.min(html.length,p+520)).replace(/\s+/g,' ')})}`);
    p+=term.length;n++;
  }
}
for(const t of ['COMP-1.2','MARS-RACE-ALPHA-002','competitiveRunRecord086','state.won','earthDependency()','dependency<=18','220','reliability>=68'])excerpts(t);

const engine=ReplayEngine.fromHtml(html),c=engine.fresh();
const keys=vm.runInContext(`Object.getOwnPropertyNames(globalThis).filter(k=>typeof globalThis[k]==='function')`,c);
for(const k of keys){
  let src='';try{src=vm.runInContext(`${JSON.stringify(k)} in globalThis ? String(globalThis[${JSON.stringify(k)}]) : ''`,c)}catch{}
  if(/state\.won|earthDependency|COMP-1\.2|competitiveRunRecord086|dependency|victory|ending/i.test(src)){
    console.log('FN_MATCH '+JSON.stringify({name:k,src:src.slice(0,12000)}));
  }
}
for(const expr of [
  `typeof competitiveRunRecord086==='function'?String(competitiveRunRecord086):null`,
  `typeof earthDependency==='function'?String(earthDependency):null`,
  `typeof endGame==='function'?String(endGame):null`,
  `typeof renderEnding==='function'?String(renderEnding):null`
]){
  try{console.log('EXPR '+JSON.stringify({expr,value:vm.runInContext(expr,c)}))}catch(e){console.log('EXPR_ERR '+JSON.stringify({expr,error:e.message}))}
}
