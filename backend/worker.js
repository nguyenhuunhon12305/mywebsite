/** NHN Analytics backend, deploy to Cloudflare Workers + D1.
 * No email, name or IP is persisted. A random browser ID is hashed server-side.
 * Google account counting (optional) verifies an ID token against Google's
 * official tokeninfo endpoint, then stores only a salted hash of the subject.
 */
const PAGES = new Set(['index.html','gioi-thieu.html','du-an.html','tai-lieu.html','lien-he.html','thong-ke.html']);
const DAY_MS=86400000, VIETNAM_OFFSET_MS=7*3600000;
const allowed=(origin,env)=>String(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(origin);
const dayAt=(timestamp)=>new Date(timestamp+VIETNAM_OFFSET_MS).toISOString().slice(0,10);
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store',...headers}});
const hash=async (value,salt)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+value));
  return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
};
async function readBody(request){
  if(Number(request.headers.get('content-length'))>12000)throw Error('body too large');
  return request.json();
}
function dayStart(now){return Math.floor((now+VIETNAM_OFFSET_MS)/DAY_MS)*DAY_MS-VIETNAM_OFFSET_MS;}
async function summary(env,days){
  const now=Date.now(), today=dayStart(now), start=today-(days-1)*DAY_MS, prev=start-days*DAY_MS;
  const values=await env.DB.prepare('SELECT COUNT(*) AS views, COUNT(DISTINCT browser_hash) AS browsers FROM pageviews WHERE ts >= ?').bind(start).first();
  const prevViews=await env.DB.prepare('SELECT COUNT(*) AS views FROM pageviews WHERE ts >= ? AND ts < ?').bind(prev,start).first();
  const rows=await env.DB.prepare('SELECT day, COUNT(*) AS views, COUNT(DISTINCT browser_hash) AS visitors FROM pageviews WHERE ts >= ? GROUP BY day ORDER BY day').bind(start).all();
  const pages=await env.DB.prepare('SELECT path, COUNT(*) AS views FROM pageviews WHERE ts >= ? GROUP BY path ORDER BY views DESC').bind(start).all();
  const accounts=env.GOOGLE_CLIENT_ID ? await env.DB.prepare('SELECT COUNT(DISTINCT account_hash) AS total FROM account_events WHERE ts >= ?').bind(start).first() : null;
  const dailyMap=new Map(rows.results.map(v=>[v.day,v]));
  const daily=Array.from({length:days},(_,i)=>{
    const day=dayAt(start+i*DAY_MS),row=dailyMap.get(day);
    return {day,views:Number(row?.views||0),visitors:Number(row?.visitors||0)};
  });
  const views=Number(values?.views||0),prior=Number(prevViews?.views||0);
  return {days,views,browsers:Number(values?.browsers||0),accounts:accounts?Number(accounts.total||0):null,growth:prior?((views-prior)/prior*100):null,daily,pages:pages.results.map(v=>({path:v.path,views:Number(v.views||0)}))};
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),origin=request.headers.get('Origin')||'';
    const isAllowed=allowed(origin,env);
    const cors=isAllowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{};
    if(request.method==='OPTIONS')return new Response(null,{status:isAllowed?204:403,headers:cors});
    if(!env.DB||!env.ANALYTICS_SALT)return json({error:'Worker is not configured'},503,cors);
    if(!isAllowed)return json({error:'Forbidden origin'},403,cors);
    try{
      if(url.pathname==='/api/hit'&&request.method==='POST'){
        const body=await readBody(request);
        if(!PAGES.has(body?.path)||!/^[-A-Za-z0-9]{16,80}$/.test(body?.visitorId||''))return json({error:'Invalid event'},400,cors);
        const visitorHash=await hash(body.visitorId,env.ANALYTICS_SALT);
        const ts=Date.now();
        await env.DB.prepare('INSERT INTO pageviews (ts, day, path, browser_hash) VALUES (?, ?, ?, ?)').bind(ts,dayAt(ts),body.path,visitorHash).run();
        return json({ok:true},200,cors);
      }
      if(url.pathname==='/api/summary'&&request.method==='GET'){
        const days=Number(url.searchParams.get('days'));
        if(![7,30].includes(days))return json({error:'Bad period'},400,cors);
        return json(await summary(env,days),200,cors);
      }
      if(url.pathname==='/api/signin'&&request.method==='POST'){
        if(!env.GOOGLE_CLIENT_ID)return json({error:'Google Sign-In disabled'},404,cors);
        const body=await readBody(request);
        if(!/^[\w.-]{100,5000}$/.test(body?.credential||''))return json({error:'Invalid credential'},400,cors);
        const r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(body.credential),{method:'GET'});
        if(!r.ok)return json({error:'Invalid Google identity'},401,cors);
        const google=await r.json();
        if(google.aud!==env.GOOGLE_CLIENT_ID||!['accounts.google.com','https://accounts.google.com'].includes(google.iss)||!(Number(google.exp)>Date.now()/1000)||!google.sub)return json({error:'Invalid Google audience'},401,cors);
        const accountHash=await hash('google:'+google.sub,env.ANALYTICS_SALT);
        const ts=Date.now();
        await env.DB.prepare('INSERT INTO account_events (ts, day, account_hash) VALUES (?, ?, ?)').bind(ts,dayAt(ts),accountHash).run();
        return json({ok:true},200,cors);
      }
      return json({error:'Not found'},404,cors);
    }catch(e){return json({error:'Request failed'},500,cors);}
  }
};
