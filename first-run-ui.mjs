const FIRST_RUN_UI=`
<style id="tr-first-run-style">
#tr-first-run-brief{display:none;margin:14px 0 16px;border:1px solid rgba(111,231,255,.28);border-radius:16px;background:linear-gradient(135deg,rgba(19,45,62,.72),rgba(9,18,27,.92));box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 12px 34px rgba(0,0,0,.18);padding:14px 15px;color:#eaf8ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#tr-first-run-brief[data-show="1"]{display:block}.tr-fr-kicker{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#6fe7ff;font-weight:900}.tr-fr-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.tr-fr-title{margin:5px 0 5px;font-size:18px;line-height:1.05;font-weight:950;letter-spacing:-.02em}.tr-fr-copy{font-size:11px;line-height:1.45;color:#9fb4c1;max-width:720px}.tr-fr-copy strong{color:#f3fbff}.tr-fr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:11px}.tr-fr-rule{border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(5,12,18,.58);padding:9px 10px}.tr-fr-rule b{display:block;font-size:10px;color:#eaf8ff;margin-bottom:3px}.tr-fr-rule span{display:block;font-size:9px;line-height:1.35;color:#7791a0}.tr-fr-close{border:0;background:transparent;color:#6e8796;font-size:18px;line-height:1;padding:2px 0 6px 8px;cursor:pointer}.tr-fr-note{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:#6f8794}.tr-fr-note strong{color:#9fd9e8}
#tr-first-action-tip{position:fixed;z-index:2147482999;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translate(-50%,130%);opacity:0;width:min(620px,calc(100vw - 24px));border:1px solid rgba(111,231,255,.25);border-radius:16px;background:rgba(6,14,21,.97);box-shadow:0 18px 60px rgba(0,0,0,.52);padding:13px 14px;color:#ecfaff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transition:transform .3s ease,opacity .3s ease}#tr-first-action-tip[data-show="1"]{transform:translate(-50%,0);opacity:1}.tr-fa-row{display:flex;gap:12px;align-items:flex-start}.tr-fa-num{flex:0 0 auto;width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:rgba(64,197,235,.13);border:1px solid rgba(100,220,255,.25);color:#8be7ff;font-size:11px;font-weight:950}.tr-fa-copy b{display:block;font-size:11px;margin-bottom:3px}.tr-fa-copy span{display:block;color:#8ca4b2;font-size:10px;line-height:1.35}.tr-fa-close{margin-left:auto;border:0;background:transparent;color:#69818f;cursor:pointer;font-size:17px}.tr-fa-progress{height:2px;background:rgba(255,255,255,.06);margin-top:10px;overflow:hidden;border-radius:999px}.tr-fa-progress i{display:block;height:100%;width:33%;background:#65dff6;transition:width .25s ease}
.launchMode031.primary.tutorialMode037{box-shadow:0 0 0 1px rgba(111,231,255,.18),0 12px 28px rgba(37,182,220,.08)!important;position:relative}.launchMode031.primary.tutorialMode037:before{content:'RECOMMENDED';position:absolute;top:8px;right:9px;font:900 7px/1 system-ui;letter-spacing:.14em;color:#7fe9ff;border:1px solid rgba(111,231,255,.32);border-radius:999px;padding:4px 6px;background:rgba(6,19,27,.72)}
@media(max-width:640px){.tr-fr-grid{grid-template-columns:1fr}.tr-fr-title{font-size:16px}#tr-first-run-brief{margin:11px 0 13px;padding:12px}.tr-fr-copy{font-size:10px}#tr-first-action-tip{bottom:max(60px,calc(env(safe-area-inset-bottom) + 48px))}}
</style>
<div id="tr-first-run-brief" aria-live="polite">
  <div class="tr-fr-head"><div><div class="tr-fr-kicker">Mission Control · first run · COMP-1.3</div><div class="tr-fr-title">Build a Mars settlement that can survive without Earth.</div><div class="tr-fr-copy">You are not choosing the single “correct” build. You are allocating capital under uncertainty while <strong>Helix</strong> races you. Win by making Mars self-sustaining before the clock runs out.</div></div><button class="tr-fr-close" id="tr-fr-close" aria-label="Dismiss first-run briefing">×</button></div>
  <div class="tr-fr-grid"><div class="tr-fr-rule"><b>WHAT COUNTS AS A WIN</b><span>Turn 18+. Permanent crew. ≥88% overall readiness, every core system ≥65% of target, reliability ≥68, Earth dependency ≤18%, and debt below $220B.</span></div><div class="tr-fr-rule"><b>WHAT YOU ACTUALLY DO</b><span>Queue up to three programmes, fund them, then manage each six-month cycle and its consequences.</span></div><div class="tr-fr-rule"><b>WHERE TO START</b><span>Use Guided Run once. It is the real simulation with explanations, not an easier fake tutorial.</span></div></div>
  <div class="tr-fr-note"><strong>No hidden finish gate.</strong> The live race panel shows every requirement. Different sequences, dependencies and capital choices can all work.</div>
</div>
<div id="tr-first-action-tip" role="status" aria-live="polite"><div class="tr-fa-row"><div class="tr-fa-num" id="tr-fa-num">1</div><div class="tr-fa-copy"><b id="tr-fa-title">Inspect the programmes</b><span id="tr-fa-text">Queue up to three projects that fit the systems you want to build. You can remove them before funding.</span></div><button class="tr-fa-close" id="tr-fa-close" aria-label="Dismiss guidance">×</button></div><div class="tr-fa-progress"><i id="tr-fa-progress"></i></div></div>
<script id="tr-first-run-script">
(()=>{
'use strict';
const SEEN='trillionaire_first_run_brief_seen_v096';
const ACTION='trillionaire_first_action_tip_seen_v096';
const brief=document.getElementById('tr-first-run-brief');
const tip=document.getElementById('tr-first-action-tip');
let tipStep=0,tipTimer=0;
function seen(k){try{return localStorage.getItem(k)==='1'}catch{return false}}
function mark(k){try{localStorage.setItem(k,'1')}catch{}}
function findModeRoot(){const guided=[...document.querySelectorAll('button')].find(b=>/GUIDED RUN/i.test(b.textContent||''));return guided?.parentElement||null}
function mountBrief(){if(seen(SEEN))return;const root=findModeRoot();if(!root||brief.dataset.mounted==='1')return;const container=root.parentElement||root;container.insertBefore(brief,container.firstChild);brief.dataset.mounted='1';brief.dataset.show='1'}
function hideBrief(){brief.dataset.show='0';mark(SEEN)}
function setTip(step){const data=[['1','Inspect the programmes','Queue up to three projects that fit the systems you want to build. You can remove them before funding.','33%'],['2','Fund the portfolio','When you are satisfied with the queue, fund it. That commits the capital and starts the build pipeline.','66%'],['3','Run the half-year','Resolve anything mandatory, then advance six months. The world, rival and operating burn will react.','100%']][step];if(!data)return;document.getElementById('tr-fa-num').textContent=data[0];document.getElementById('tr-fa-title').textContent=data[1];document.getElementById('tr-fa-text').textContent=data[2];document.getElementById('tr-fa-progress').style.width=data[3];tip.dataset.show='1';clearTimeout(tipTimer);tipTimer=setTimeout(()=>{tip.dataset.show='0'},12000)}
function isModeStart(target){const txt=(target?.textContent||'');return /GUIDED RUN|FRESH WORLD|SEEDED CHALLENGE/i.test(txt)&&target.closest('button')}
function maybeStartTip(e){const b=e.target.closest?.('button');if(!b||!isModeStart(b)||seen(ACTION))return;hideBrief();setTimeout(()=>setTip(0),450)}
function observeActions(){document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;maybeStartTip(e);if(tip.dataset.show!=='1'&&seen(ACTION))return;const txt=(b.textContent||'').replace(/\s+/g,' ').trim();if(/QUEUE PROJECT|ADD TO PORTFOLIO|QUEUE FROM MARS/i.test(txt)&&tipStep<1){tipStep=1;setTip(1)}else if(/FUND PORTFOLIO|FUND \d+|FUND \$/i.test(txt)&&tipStep<2){tipStep=2;setTip(2)}else if(/ADVANCE SIX MONTHS|CONTINUE TO /i.test(txt)&&tipStep>=2){tip.dataset.show='0';mark(ACTION)}})}
document.getElementById('tr-fr-close').addEventListener('click',hideBrief);document.getElementById('tr-fa-close').addEventListener('click',()=>{tip.dataset.show='0';mark(ACTION)});observeActions();
const mo=new MutationObserver(()=>mountBrief());mo.observe(document.documentElement,{childList:true,subtree:true});mountBrief();setTimeout(mountBrief,200);setTimeout(mountBrief,900);
})();
</script>
`;

export function enhanceFirstRunHtml(html){
  let out=String(html).replaceAll('COMP-1.2','COMP-1.3');
  if(out.includes('id="tr-first-run-script"'))return out;
  if(out.includes('</body>'))return out.replace('</body>',FIRST_RUN_UI+'\n</body>');
  return out+FIRST_RUN_UI;
}
