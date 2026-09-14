const ANALYTICS_UI=`
<script id="tr-analytics-script">
(()=>{
'use strict';
const endpoint='/api/v1/analytics/events';
const nativeFetch=window.fetch.bind(window);
const key='trillionaire_analytics_session';
let sessionId='';
try{
  sessionId=sessionStorage.getItem(key)||'';
  if(!sessionId){
    sessionId=(globalThis.crypto?.randomUUID?.()||('s-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));
    sessionStorage.setItem(key,sessionId);
  }
}catch{
  sessionId='s-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}

function send(event,meta={}){
  try{
    nativeFetch(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({sessionId,event,meta}),
      keepalive:true,
      cache:'no-store'
    }).catch(()=>{});
  }catch{}
}
window.TRILLIONAIRE_ANALYTICS=send;

function pageView(){
  let referrer='';
  try{referrer=document.referrer?new URL(document.referrer).hostname:''}catch{}
  const q=new URLSearchParams(location.search);
  send('page_view',{
    path:location.pathname,
    referrer,
    vw:Math.round(innerWidth||0),
    vh:Math.round(innerHeight||0),
    source:(q.get('utm_source')||'').slice(0,48),
    medium:(q.get('utm_medium')||'').slice(0,48),
    campaign:(q.get('utm_campaign')||'').slice(0,64)
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pageView,{once:true});else pageView();

setTimeout(()=>{if(!document.hidden)send('engaged_30s')},30000);
setTimeout(()=>{if(!document.hidden)send('engaged_120s')},120000);

let modeChosen=false;
let firstAction=false;
function modeFrom(text){
  const t=String(text||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(t.includes('seeded challenge'))return 'challenge';
  if(t.includes('guided run'))return 'guided';
  if(t.includes('fresh world'))return 'fresh';
  return '';
}

document.addEventListener('click',e=>{
  const el=e.target?.closest?.('button,a,[role="button"]');
  if(!el)return;
  if(el.id==='tr-race-launch'){send('leaderboard_open',{board:'canonical'});return;}
  if(el.classList?.contains('tr-race-tab')){send('leaderboard_tab',{board:String(el.dataset.board||'canonical').slice(0,24)});return;}
  if(el.id==='tr-toast-share'){send('share_click');return;}
  if(el.id==='tr-toast-again'){send('play_again');return;}
  if(el.id==='tr-fr-close'){send('first_run_briefing_dismissed');return;}
  const mode=modeFrom(el.textContent);
  if(mode){
    modeChosen=true;
    send('mode_selected',{mode});
    send('game_started',{mode});
    return;
  }
  if(modeChosen&&!firstAction&&!el.closest('#tr-race-modal,#tr-race-toast,#tr-first-run-brief')){
    firstAction=true;
    send('first_game_action');
  }
},true);

window.fetch=async function(input,init={}){
  const raw=typeof input==='string'?input:input?.url;
  let pathname='';
  try{pathname=new URL(raw,location.href).pathname}catch{}
  const method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
  const isRun=method==='POST'&&pathname==='/api/v1/runs';
  if(isRun)send('run_submit_attempt');
  const response=await nativeFetch(input,init);
  if(isRun){
    try{
      const data=await response.clone().json();
      if(response.ok&&data?.verified){
        send('run_verified',{
          rank:Number(data.rank||0),
          duplicate:!!data.duplicate,
          won:!!data.run?.won,
          turn:Number(data.run?.turn||0),
          score:Number(data.run?.score||0)
        });
      }else send('run_rejected',{status:Number(response.status||0)});
    }catch{send('run_rejected',{status:Number(response.status||0)})}
  }
  return response;
};
})();
</script>
`;

export function enhanceAnalyticsHtml(html){
  if(html.includes('id="tr-analytics-script"'))return html;
  if(html.includes('</body>'))return html.replace('</body>',ANALYTICS_UI+'\n</body>');
  return html+ANALYTICS_UI;
}
