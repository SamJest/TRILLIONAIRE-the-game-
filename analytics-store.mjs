import crypto from 'node:crypto';

const EVENT_NAMES=new Set([
  'page_view','engaged_30s','engaged_120s','mode_selected','game_started','first_game_action',
  'first_run_briefing_dismissed','leaderboard_open','leaderboard_tab','run_submit_attempt',
  'run_verified','run_rejected','share_click','play_again'
]);

function cleanString(v,n=64){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,n)}
function cleanNumber(v,min=-1e9,max=1e9){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null}
function sanitizeMeta(event,meta){
  const m=meta&&typeof meta==='object'&&!Array.isArray(meta)?meta:{};
  if(event==='page_view')return {path:cleanString(m.path,80),referrer:cleanString(m.referrer,120),vw:cleanNumber(m.vw,0,10000),vh:cleanNumber(m.vh,0,10000),source:cleanString(m.source,48),medium:cleanString(m.medium,48),campaign:cleanString(m.campaign,64)};
  if(event==='mode_selected'||event==='game_started')return {mode:['fresh','guided','challenge'].includes(m.mode)?m.mode:'unknown'};
  if(event==='leaderboard_open'||event==='leaderboard_tab')return {board:['canonical','fastest','efficient'].includes(m.board)?m.board:'canonical'};
  if(event==='run_verified')return {rank:cleanNumber(m.rank,0,1000000),duplicate:!!m.duplicate,won:!!m.won,turn:cleanNumber(m.turn,0,100),score:cleanNumber(m.score,0,1000000)};
  if(event==='run_rejected')return {status:cleanNumber(m.status,0,999)};
  return {};
}

export function initAnalytics(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events(
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      event TEXT NOT NULL,
      meta_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events(event,created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_session_time ON analytics_events(session_id,created_at);
  `);
}

export function recordAnalytics(db,payload){
  const event=cleanString(payload?.event,48);
  if(!EVENT_NAMES.has(event))return {ok:false,error:'Unknown analytics event'};
  const sessionId=cleanString(payload?.sessionId,80);
  if(!/^[A-Za-z0-9._:-]{8,80}$/.test(sessionId))return {ok:false,error:'Session invalid'};
  const now=new Date().toISOString();
  const meta=sanitizeMeta(event,payload?.meta);
  db.prepare('INSERT INTO analytics_events(id,session_id,event,meta_json,created_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),sessionId,event,JSON.stringify(meta),now);
  return {ok:true};
}

export function analyticsSummary(db,days=7){
  const d=Math.max(1,Math.min(90,Number(days)||7));
  const since=new Date(Date.now()-d*86400000).toISOString();
  const events=db.prepare('SELECT event,COUNT(*) n,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? GROUP BY event ORDER BY n DESC').all(since);
  const totals=db.prepare('SELECT COUNT(*) events,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=?').get(since);
  const daily=db.prepare("SELECT substr(created_at,1,10) day,COUNT(DISTINCT session_id) sessions,COUNT(*) events FROM analytics_events WHERE created_at>=? GROUP BY substr(created_at,1,10) ORDER BY day").all(since);
  const sources=db.prepare("SELECT json_extract(meta_json,'$.source') source,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event='page_view' AND json_extract(meta_json,'$.source')<>'' GROUP BY source ORDER BY sessions DESC LIMIT 20").all(since);
  const modes=db.prepare("SELECT json_extract(meta_json,'$.mode') mode,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event='game_started' GROUP BY mode ORDER BY sessions DESC").all(since);
  const count=name=>Number(events.find(x=>x.event===name)?.sessions||0);
  const page=count('page_view'),started=count('game_started'),firstAction=count('first_game_action'),verified=count('run_verified'),shared=count('share_click');
  const pct=(n,dn)=>dn?Math.round((n/dn)*1000)/10:0;
  return {
    windowDays:d,since,totals,
    funnel:{visitors:page,gameStarted:started,firstAction,verifiedRun:verified,shareClicked:shared,startRate:pct(started,page),firstActionRate:pct(firstAction,started),verifiedRate:pct(verified,started),shareRate:pct(shared,verified)},
    events,daily,sources,modes
  };
}
