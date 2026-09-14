import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {enhanceAnalyticsHtml} from './analytics-ui.mjs';
import {initAnalytics,recordAnalytics,analyticsSummary} from './analytics-store.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_PORT=Number(process.env.PORT||8787);
const PUBLIC_HOST=process.env.HOST||'0.0.0.0';
const INTERNAL_PORT=PUBLIC_PORT===8788?18788:8788;
const DATA_DIR=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(__dirname,'data');
const DB_FILE=path.join(DATA_DIR,'trillionaire.sqlite');
const ADMIN_TOKEN=String(process.env.TRILLIONAIRE_ADMIN_TOKEN||'');
const MAX_ANALYTICS_BODY=16_384;
const analyticsBuckets=new Map();

await mkdir(DATA_DIR,{recursive:true});
const analyticsDb=new DatabaseSync(DB_FILE);
analyticsDb.exec('PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;');
initAnalytics(analyticsDb);

const assetPaths={
  '/favicon.ico':{path:path.join(__dirname,'public','assets','favicon.png'),type:'image/png'},
  '/apple-touch-icon.png':{path:path.join(__dirname,'public','assets','apple-touch-icon.png'),type:'image/png'},
  '/assets/favicon.png':{path:path.join(__dirname,'public','assets','favicon.png'),type:'image/png'},
  '/assets/apple-touch-icon.png':{path:path.join(__dirname,'public','assets','apple-touch-icon.png'),type:'image/png'},
  '/assets/trillionaire-social-card.png':{path:path.join(__dirname,'public','assets','trillionaire-social-card.png'),type:'image/png'}
};

function json(res,status,obj){
  const b=Buffer.from(JSON.stringify(obj));
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(b);
}
function ip(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
function analyticsAllowed(req){
  const k=ip(req),now=Date.now();
  let b=analyticsBuckets.get(k);
  if(!b||now-b.start>60000)b={start:now,count:0};
  b.count++;
  analyticsBuckets.set(k,b);
  return b.count<=120;
}
function adminAuthorized(req){
  if(!ADMIN_TOKEN)return false;
  const h=String(req.headers.authorization||'');
  if(!h.startsWith('Bearer '))return false;
  const a=Buffer.from(h.slice(7)),b=Buffer.from(ADMIN_TOKEN);
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
async function smallJsonBody(req){
  return await new Promise((resolve,reject)=>{
    let size=0,chunks=[];
    req.on('data',c=>{size+=c.length;if(size>MAX_ANALYTICS_BODY){reject(new Error('Payload too large'));req.destroy();return}chunks.push(c)});
    req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'))}catch{reject(new Error('Invalid JSON'))}});
    req.on('error',reject);
  });
}
async function serveAsset(res,def){
  try{
    const b=await readFile(def.path);
    res.writeHead(200,{'Content-Type':def.type,'Content-Length':b.length,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});
    res.end(b);
  }catch{return json(res,404,{error:'Not found'})}
}
function proxy(req,res){
  const options={hostname:'127.0.0.1',port:INTERNAL_PORT,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${INTERNAL_PORT}`}};
  const p=http.request(options,up=>{
    const type=String(up.headers['content-type']||'');
    if(!type.includes('text/html')){
      res.writeHead(up.statusCode||502,up.headers);
      up.pipe(res);
      return;
    }
    const chunks=[];
    up.on('data',c=>chunks.push(c));
    up.on('end',()=>{
      try{
        const html=enhanceAnalyticsHtml(Buffer.concat(chunks).toString('utf8'));
        const body=Buffer.from(html);
        const headers={...up.headers,'content-length':String(body.length),'cache-control':'no-cache'};
        delete headers['content-encoding'];
        res.writeHead(up.statusCode||200,headers);
        res.end(body);
      }catch(e){json(res,500,{error:'HTML gateway error'})}
    });
  });
  p.on('error',e=>json(res,502,{error:'Upstream unavailable'}));
  req.pipe(p);
}

const gateway=http.createServer(async(req,res)=>{
  try{
    const host=String(req.headers.host||'').split(':')[0].toLowerCase();
    if(host==='www.trillionairethegame.com'){
      res.writeHead(308,{Location:'https://trillionairethegame.com'+req.url,'Cache-Control':'public, max-age=3600'});
      return res.end();
    }
    const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);

    if(req.method==='GET'&&assetPaths[u.pathname])return await serveAsset(res,assetPaths[u.pathname]);
    if(req.method==='GET'&&u.pathname==='/robots.txt'){
      const body=Buffer.from('User-agent: *\nAllow: /\nSitemap: https://trillionairethegame.com/sitemap.xml\n');
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Content-Length':body.length,'Cache-Control':'public, max-age=3600'});return res.end(body);
    }
    if(req.method==='GET'&&u.pathname==='/sitemap.xml'){
      const body=Buffer.from('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://trillionairethegame.com/</loc></url><url><loc>https://trillionairethegame.com/leaderboard</loc></url></urlset>');
      res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Content-Length':body.length,'Cache-Control':'public, max-age=3600'});return res.end(body);
    }
    if(req.method==='POST'&&u.pathname==='/api/v1/analytics/events'){
      if(!analyticsAllowed(req))return json(res,429,{error:'Too many analytics events'});
      const payload=await smallJsonBody(req);
      const result=recordAnalytics(analyticsDb,payload);
      return json(res,result.ok?202:400,result.ok?{ok:true}:{error:result.error});
    }
    if(req.method==='GET'&&u.pathname==='/api/v1/admin/analytics'){
      if(!ADMIN_TOKEN)return json(res,404,{error:'Not found'});
      if(!adminAuthorized(req))return json(res,401,{error:'Authentication required'});
      return json(res,200,analyticsSummary(analyticsDb,u.searchParams.get('days')));
    }
    return proxy(req,res);
  }catch(e){console.error('launch gateway',e);return json(res,500,{error:e?.message||'Gateway error'})}
});

gateway.listen(PUBLIC_PORT,PUBLIC_HOST,async()=>{
  process.env.PORT=String(INTERNAL_PORT);
  process.env.HOST='127.0.0.1';
  await import('./server.mjs');
  console.log(`TRILLIONAIRE launch gateway on http://${PUBLIC_HOST}:${PUBLIC_PORT} -> ${INTERNAL_PORT}`);
});
