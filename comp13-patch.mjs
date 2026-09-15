const CORE_KEYS=['launch','energy','robotics','habitat','life','industry','autonomy'];

function replaceExact(src,from,to,label,count=1){
  const found=src.split(from).length-1;
  if(found!==count)throw new Error(`COMP-1.3 patch ${label}: expected ${count} match(es), found ${found}`);
  return src.split(from).join(to);
}

function replaceRegex(src,re,to,label){
  const matches=[...src.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(matches.length!==1)throw new Error(`COMP-1.3 patch ${label}: expected 1 match, found ${matches.length}`);
  return src.replace(re,to);
}

export function applyComp13Candidate(input){
  let html=String(input);

  const oldCompletion=`function completion(){return Object.entries(TARGETS).every(([k,v])=>state.systems[k]>=v) && state.flags.crew && state.systems.reliability>=TARGETS.reliability && earthDependency()<=18 && (state.debt||0)<220}`;
  const newCompletion=`function completion(){const keys=['launch','energy','robotics','habitat','life','industry','autonomy'];const ratios=keys.map(k=>Math.min(1,(state.systems[k]||0)/TARGETS[k]));const avg=ratios.reduce((a,b)=>a+b,0)/ratios.length;const floor=Math.min(...ratios);return state.turn>=16&&state.flags.crew&&state.systems.reliability>=TARGETS.reliability&&earthDependency()<=18&&(state.debt||0)<220&&avg>=.92&&floor>=.75}`;
  html=replaceExact(html,oldCompletion,newCompletion,'completion predicate');

  html=replaceExact(html,"const RULESET093='COMP-1.2';","const RULESET093='COMP-1.3';",'online ruleset constant');
  html=replaceExact(html,"const BUILD093='v0.095';","const BUILD093='v0.096';",'online build constant');

  const oldObjective='All critical systems · permanent crew · ≤18% Earth dependency · debt under $220B';
  const newObjective='92% readiness · 75% system floor · permanent crew · reliability ≥68 · ≤18% Earth dependency · debt under $220B · turn 16+';
  html=replaceExact(html,oldObjective,newObjective,'visible win condition',2);

  html=replaceRegex(
    html,
    /function finishGate036\(\)\{[\s\S]*?\} function flowNote036\(\)/,
    `function finishGate036(){const keys=['launch','energy','robotics','habitat','life','industry','autonomy'];const ratios=keys.map(k=>Math.min(1,(state.systems[k]||0)/TARGETS[k]));const avg=Math.round(ratios.reduce((a,b)=>a+b,0)/ratios.length*100),floor=Math.round(Math.min(...ratios)*100),crew=!!state.flags?.crew,dep=Math.round(earthDependency()),debt=Math.round(state.debt||0),rel=Math.round(state.systems?.reliability||0),turn=state.turn||0;return \`<div class="finishGate036"><span class="\${avg>=92?'ok':'warn'}">readiness \${avg}% / ≥92</span><span class="\${floor>=75?'ok':'warn'}">system floor \${floor}% / ≥75</span><span class="\${crew?'ok':'warn'}">crew \${crew?'✓':'needed'}</span><span class="\${rel>=68?'ok':'warn'}">reliability \${rel} / ≥68</span><span class="\${dep<=18?'ok':'warn'}">dependency \${dep}% / ≤18</span><span class="\${debt<220?'ok':'warn'}">debt $\${debt}B / &lt;220</span><span class="\${turn>=16?'ok':'warn'}">timeline turn \${turn} / ≥16</span></div>\`} function flowNote036()`,
    'finish-gate UI'
  );

  const comp12Count=html.split('COMP-1.2').length-1;
  if(comp12Count!==2)throw new Error(`COMP-1.3 patch visible ruleset: expected 2 remaining COMP-1.2 strings, found ${comp12Count}`);
  html=html.replaceAll('COMP-1.2','COMP-1.3');

  const v095Count=html.split('v0.095').length-1;
  if(v095Count<1)throw new Error('COMP-1.3 patch visible build: v0.095 footer marker not found');
  html=html.replaceAll('v0.095','v0.096');

  if(html.includes('COMP-1.2'))throw new Error('COMP-1.3 patch left stale ruleset text');
  if(!html.includes("const RULESET093='COMP-1.3';")||!html.includes("const BUILD093='v0.096';"))throw new Error('COMP-1.3 identity patch failed');
  if(!html.includes('avg>=.92&&floor>=.75'))throw new Error('COMP-1.3 completion patch failed');
  return html;
}

export const COMP13_CORE_KEYS=Object.freeze(CORE_KEYS.slice());
