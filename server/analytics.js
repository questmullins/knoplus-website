import { sessionUser } from './client-auth.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const ready=new WeakMap();
export function ensureAnalytics(db){
 if(!ready.has(db))ready.set(db,db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS site_analytics_daily (day TEXT NOT NULL,path TEXT NOT NULL,source TEXT NOT NULL,kind TEXT NOT NULL,total INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,path,source,kind))'),
  db.prepare('CREATE TABLE IF NOT EXISTS site_analytics_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL)'),
  db.prepare("INSERT OR IGNORE INTO site_analytics_meta(key,value) VALUES('started',?)").bind(new Date().toISOString())
 ]).catch(error=>{ready.delete(db);throw error;}));
 return ready.get(db);
}
export function analyticsPath(request){
 const u=new URL(request.url);
 if(u.hostname!=='kno.plus'||request.method!=='GET'||/^\/(api|clients|trials|manage|update-config)(\/|$)/.test(u.pathname))return null;
 // Only public, static routes. Never store query strings, visitor IDs, or addresses.
 if(!/^\/[a-zA-Z0-9_./-]*$/.test(u.pathname)||u.pathname.length>200)return null;
 return u.pathname.replace(/\/index\.html$/,'/').replace(/\/$/,'')||'/';
}
function sourceOf(request){try{const h=new URL(request.headers.get('referer')).hostname;if(h==='kno.plus'||h.endsWith('.kno.plus'))return 'Internal';if(/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com|search.yahoo.com)$/.test(h))return 'Search';if(/(^|\.)(pinterest.com|instagram.com|facebook.com|t.co|linkedin.com)$/.test(h))return 'Social';return 'Referral';}catch{return 'Direct / unknown';}}
export async function recordAnalytics(request,env,response,kind='page'){
 const path=kind==='contact'?'/api/contact':analyticsPath(request);
 if(!env.CLIENT_DB||new URL(request.url).hostname!=='kno.plus'||path===null||response.status<200||response.status>=300)return;
 if(kind==='page'&&!response.headers.get('content-type')?.includes('text/html'))return;
 if(/bot|crawler|spider|preview|headless/i.test(request.headers.get('user-agent')||''))return;
 await ensureAnalytics(env.CLIENT_DB);
 await env.CLIENT_DB.prepare('INSERT INTO site_analytics_daily(day,path,source,kind,total) VALUES(?,?,?,?,1) ON CONFLICT(day,path,source,kind) DO UPDATE SET total=total+1').bind(new Date().toISOString().slice(0,10),path,sourceOf(request),kind).run();
}
export async function handleAnalytics(request,env){
 if(new URL(request.url).pathname!=='/api/manage/analytics')return null;
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if(!env.CLIENT_DB)return json({error:'Analytics storage unavailable'},503);
 try{
  const user=await sessionUser(request,env.CLIENT_DB);
  if(!user)return json({error:'Sign in with your administrator account to view kno.plus analytics.'},401);
  if(user.role!=='admin')return json({error:'Site-wide analytics are restricted to the site administrator.'},403);
  await ensureAnalytics(env.CLIENT_DB);
  const days=Number(new URL(request.url).searchParams.get('days')||28);
  if(![7,28,90].includes(days))return json({error:'Choose 7, 28, or 90 days.'},400);
  const end=new Date(),start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate())-(days-1)*86400000),since=start.toISOString().slice(0,10);
  const rows=await env.CLIENT_DB.prepare('SELECT day,path,source,kind,total FROM site_analytics_daily WHERE day>=? ORDER BY day').bind(since).all();
  const meta=await env.CLIENT_DB.prepare("SELECT value FROM site_analytics_meta WHERE key='started'").first();
  const byDay={},pages={},sources={};let pageRequests=0,contacts=0;
  for(const r of rows.results){if(r.kind==='contact'){contacts+=r.total;continue;}pageRequests+=r.total;byDay[r.day]=(byDay[r.day]||0)+r.total;pages[r.path]=(pages[r.path]||0)+r.total;sources[r.source]=(sources[r.source]||0)+r.total;}
  const series=Array.from({length:days},(_,i)=>{const day=new Date(start.getTime()+i*86400000).toISOString().slice(0,10);return {day,count:day<meta.value.slice(0,10)?null:(byDay[day]||0)};});
  const ranked=obj=>Object.entries(obj).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  return json({site:'kno.plus',days,started:meta.value,updated:new Date().toISOString(),pageRequests,contacts,series,pages:ranked(pages).slice(0,10),sources:ranked(sources),searchConnected:false});
 }catch{return json({error:'Analytics could not load. Please try again.'},503);}
}
