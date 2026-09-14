import vm from 'node:vm';
import {ReplayEngine} from '../replay-engine.mjs';
import {loadGameHtml} from '../game-source.mjs';
const engine=ReplayEngine.fromHtml(await loadGameHtml());
const c=engine.fresh();engine.startChallenge(c);
const expr=`(()=>{const names=['PROJECTS','SPECIALS','DOCTRINES','CAPITAL_DEALS','DEALS','INCIDENTS'];const o={};for(const n of names){try{const v=eval(n);o[n]={kind:Array.isArray(v)?'array':typeof v,data:JSON.parse(JSON.stringify(v))}}catch(e){o[n]={error:e.message}}}o.state={phase:state.phase,turn:state.turn,cash:state.cash,debt:state.debt,selectedProjects:state.selectedProjects,pipeline:state.pipeline};return o})()`;
console.log(JSON.stringify(vm.runInContext(expr,c),null,2));
