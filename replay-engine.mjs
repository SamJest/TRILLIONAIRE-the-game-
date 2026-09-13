import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import crypto from 'node:crypto';

class ClassList {
  constructor(){this.s=new Set()}
  add(...x){x.forEach(v=>this.s.add(v))}
  remove(...x){x.forEach(v=>this.s.delete(v))}
  toggle(v,f){if(f===undefined){if(this.s.has(v)){this.s.delete(v);return false}this.s.add(v);return true}f?this.s.add(v):this.s.delete(v);return !!f}
  contains(v){return this.s.has(v)}
}
class StubNode {
  constructor(){this.style={};this.classList=new ClassList();this.dataset={};this.children=[];this.value='';this.disabled=false;this.parentNode=this;this.textContent='';this.innerHTML='';this.firstChild=null;}
  addEventListener(){} removeEventListener(){}
  appendChild(x){this.children.push(x);this.firstChild=this.children[0]||null;return x}
  prepend(x){this.children.unshift(x);this.firstChild=this.children[0]||null;return x}
  insertBefore(x){this.children.unshift(x);this.firstChild=this.children[0]||null;return x}
  remove(){} querySelector(){return null} querySelectorAll(){return []}
  setAttribute(k,v){this[k]=String(v)} getAttribute(k){return this[k]??null}
  insertAdjacentHTML(){} insertAdjacentElement(){} closest(){return null} scrollIntoView(){} replaceWith(){}
  getBoundingClientRect(){return {width:390,height:100,top:0,left:0,right:390,bottom:100}}
}
function makeContext(){
  const ids=new Map(),app=new StubNode();app.classList.add('app');
  const document={body:new StubNode(),head:new StubNode(),documentElement:new StubNode(),getElementById(id){if(!ids.has(id))ids.set(id,new StubNode());return ids.get(id)},querySelector(sel){if(sel==='.app')return app;return null},querySelectorAll(){return []},createElement(){return new StubNode()},addEventListener(){},removeEventListener(){}};
  const ls=new Map();const localStorage={getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k),clear:()=>ls.clear()};
  const ctx={console:{log(){},warn(){},error(){}},document,localStorage,navigator:{clipboard:null},location:{protocol:'http:',href:'http://replay.local/'},performance:{now:()=>Date.now()},crypto:crypto.webcrypto,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},alert(){},confirm:()=>true,prompt:()=>'',fetch:async()=>({ok:false,status:503,json:async()=>({online:false})}),structuredClone,URL,Math,Date,JSON,Number,String,Boolean,Array,Object,Map,Set,RegExp,Error,Promise,parseInt,parseFloat,isNaN,Infinity,NaN};
  ctx.window=ctx;ctx.globalThis=ctx;ctx.self=ctx;ctx.window.scrollTo=()=>{};ctx.window.addEventListener=()=>{};ctx.window.removeEventListener=()=>{};ctx.window.getComputedStyle=()=>({});ctx.window.innerWidth=390;ctx.window.innerHeight=844;
  return vm.createContext(ctx);
}
function js(v){return JSON.stringify(v)}
export class ReplayEngine {
  constructor(scripts){this.scripts=scripts.map((code,i)=>new vm.Script(code,{filename:`game-script-${i}.js`}))}
  static fromHtml(html){const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);return new ReplayEngine(scripts)}
  static async fromHtmlFile(file){return ReplayEngine.fromHtml(await readFile(file,'utf8'))}
  fresh(){const c=makeContext();for(const s of this.scripts)s.runInContext(c,{timeout:3000});return c}
  state(c){return vm.runInContext(`({phase:state.phase,turn:state.turn,mode:state.mode})`,c)}
  actions(c){return vm.runInContext(`state.competitive086?.actions ? JSON.parse(JSON.stringify(state.competitive086.actions)) : []`,c)}
  record(c){return vm.runInContext(`competitiveRunRecord086 ? JSON.parse(JSON.stringify(competitiveRunRecord086())) : null`,c)}
  startChallenge(c){vm.runInContext(`window.confirm=()=>true;window.alert=()=>{};startMode('challenge')`,c,{timeout:3000})}
  dispatch(c,a){
    const p=a.payload||{};
    switch(a.type){
      case 'toggleProject': return vm.runInContext(`toggleProject(${js(p.id)})`,c,{timeout:3000});
      case 'commitPortfolio': return vm.runInContext(`commitPortfolio()`,c,{timeout:3000});
      case 'commissionTarget': return vm.runInContext(`commissionTarget(${js(p.tag)})`,c,{timeout:3000});
      case 'chooseSpecial': return vm.runInContext(`chooseSpecial(${Number(p.idx)})`,c,{timeout:3000});
      case 'chooseIncident': return vm.runInContext(`chooseIncident(${Number(p.idx)})`,c,{timeout:3000});
      case 'continueAfterIncident': return vm.runInContext(`continueAfterIncident()`,c,{timeout:3000});
      case 'chooseDoctrine': return vm.runInContext(`chooseDoctrine(${js(p.group)},${js(p.key)})`,c,{timeout:3000});
      case 'applyCapitalDeal': return vm.runInContext(`applyCapitalDeal(${js(p.id)})`,c,{timeout:3000});
      case 'raiseDebt': return vm.runInContext(`raiseDebt()`,c,{timeout:3000});
      case 'sellHoldings': return vm.runInContext(`sellHoldings()`,c,{timeout:3000});
      case 'repayDebt': return vm.runInContext(`repayDebt()`,c,{timeout:3000});
      case 'repairDistrict034': return vm.runInContext(`repairDistrict034(${js(p.key)},${js(p.mode)})`,c,{timeout:3000});
      case 'holdCapital': return vm.runInContext(`holdCycle089()`,c,{timeout:3000});
      case 'advance': return vm.runInContext(`advance()`,c,{timeout:3000});
      default: throw new Error(`Unsupported replay action: ${a.type}`);
    }
  }
  replay(incoming){
    const c=this.fresh();this.startChallenge(c);
    let i=0;
    while(i<incoming.length){
      const before=this.actions(c).length;
      const a=incoming[i];this.dispatch(c,a);
      const afterActions=this.actions(c);const added=afterActions.slice(before);
      const expectedCount=a.type==='holdCapital'?2:1;
      if(added.length!==expectedCount)throw new Error(`Replay log divergence at action ${a.n}: expected ${expectedCount} generated action(s), got ${added.length}`);
      const expected=incoming.slice(i,i+expectedCount);
      if(JSON.stringify(added)!==JSON.stringify(expected))throw new Error(`Replay action mismatch at ${a.n}: generated ${JSON.stringify(added)} expected ${JSON.stringify(expected)}`);
      i+=expectedCount;
    }
    const generated=this.actions(c);
    if(JSON.stringify(generated)!==JSON.stringify(incoming))throw new Error('Replay action log did not reproduce exactly');
    return {state:this.state(c),record:this.record(c)};
  }
  generateHoldRun(){
    const c=this.fresh();this.startChallenge(c);let guard=0;
    while(this.state(c).phase!=='ending'&&guard++<150){
      const x=vm.runInContext(`({phase:state.phase,turn:state.turn,pending:!!state.pendingIncident,special:!!(SPECIALS[state.turn]&&!state.specialDone[state.turn])})`,c);
      if(x.pending){vm.runInContext('chooseIncident(1)',c);continue}
      if(x.phase==='incidentOutcome'){vm.runInContext('continueAfterIncident()',c);continue}
      if(x.special){vm.runInContext('chooseSpecial(1)',c);continue}
      if(x.phase==='outcome'){vm.runInContext('advance()',c);continue}
      if(x.phase==='event'){vm.runInContext('holdCycle089()',c);continue}
      throw new Error(`Unhandled QA phase ${JSON.stringify(x)}`);
    }
    return this.record(c);
  }
}
