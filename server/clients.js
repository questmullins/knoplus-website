import { cookie, digest, passwordHash, randomToken, rateLimit, sessionUser, verifyPassword } from './client-auth.js';
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const clean = (value,max=200) => typeof value === 'string' ? value.trim().slice(0,max) : '';
const emailOf = value => clean(value).toLowerCase();
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const safeTrial = path => /^\/trials\/[a-z0-9-]+\/$/.test(path);
export async function handleClients(request,env) {
  const url=new URL(request.url);
  try { url.pathname=decodeURIComponent(url.pathname).replace(/\/{2,}/g,'/'); } catch { return json({error:'Invalid path'},400); }
  const legacy=url.pathname.startsWith('/revamp/websites/houseplant-nation');
  const trial=url.pathname.startsWith('/trials/');
  if (!legacy && !trial && !url.pathname.startsWith('/api/clients/') && !/^\/clients(?:\/|$)/.test(url.pathname)) return null;
  if (/^\/clients(?:\/|$)/.test(url.pathname)) {
    return new Response(portalHtml,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}});
  }
  if (!env.CLIENT_DB) return json({error:'Client access is being configured. Please contact info@kno.plus.'},503);
  const db=env.CLIENT_DB;
  try {
    const user=await sessionUser(request,db);
    if (trial || legacy) {
      const path=legacy ? url.pathname.replace('/revamp/websites/houseplant-nation','/trials/houseplant-nation') : url.pathname;
      const slug=path.split('/')[2];
      if (!user) return Response.redirect(url.origin+'/clients/?next='+encodeURIComponent(path),303);
      const allowed=user.role==='admin' || await db.prepare('SELECT 1 FROM grants WHERE user_id=? AND project_id=?').bind(user.id,slug).first();
      if (!allowed) return new Response('This trial is not assigned to your account.',{status:403,headers:{'Cache-Control':'no-store'}});
      if (legacy) return Response.redirect(url.origin+path+url.search,302);
      const asset=await env.ASSETS.fetch(request);
      const headers=new Headers(asset.headers);
      headers.set('Cache-Control','private, no-store');
      headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
      return new Response(asset.body,{status:asset.status,headers});
    }
    const action=url.pathname.slice('/api/clients/'.length);
    if (request.method==='GET' && action==='me') {
      if (!user) return json({user:null});
      const projects=user.role==='admin' ? await db.prepare('SELECT * FROM projects ORDER BY name').all() : await db.prepare('SELECT p.* FROM projects p JOIN grants g ON g.project_id=p.id WHERE g.user_id=? ORDER BY p.name').bind(user.id).all();
      const updates=user.role==='admin' ? await db.prepare('SELECT * FROM updates ORDER BY created DESC LIMIT 200').all() : await db.prepare('SELECT u.* FROM updates u JOIN grants g ON g.project_id=u.project_id WHERE g.user_id=? ORDER BY created DESC LIMIT 200').bind(user.id).all();
      const users=user.role==='admin' ? await db.prepare('SELECT u.id,u.email,u.role,u.disabled,r.requested FROM users u LEFT JOIN reset_requests r ON r.user_id=u.id ORDER BY u.email').all() : {results:[]};
      const grants=user.role==='admin' ? await db.prepare('SELECT * FROM grants').all() : {results:[]};
      return json({user,projects:projects.results,updates:updates.results,users:users.results,grants:grants.results});
    }
    if (request.method!=='POST') return json({error:'Method not allowed'},405);
    if (request.headers.get('origin')!==url.origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Request not allowed'},403);
    if (Number(request.headers.get('content-length')||0)>16000) return json({error:'Request too large'},413);
    const raw=await request.text();
    if (raw.length>16000) return json({error:'Request too large'},413);
    let data; try { data=JSON.parse(raw); } catch { return json({error:'Invalid request'},400); }
    const ip=request.headers.get('CF-Connecting-IP')||'local';
    if (['login','reset-request','reset'].includes(action) && !await rateLimit(db,'ip:'+ip,40)) return json({error:'Too many attempts. Please try again in 15 minutes.'},429);
    if (action==='login') {
      const email=emailOf(data.email);
      if (!validEmail(email) || typeof data.password!=='string' || data.password.length>256) return json({error:'Check your email and password.'},401);
      if (!await rateLimit(db,'login:'+email,10)) return json({error:'Too many attempts. Please try again in 15 minutes.'},429);
      const account=await db.prepare('SELECT * FROM users WHERE email=? AND disabled=0').bind(email).first();
      const matches=await verifyPassword(data.password,account?.password || 'unregistered:'+ '0'.repeat(64));
      if (!account || !matches) return json({error:'Check your email and password.'},401);
      const token=randomToken();
      await db.batch([db.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),db.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').bind(await digest(token),account.id,Date.now()+43200000)]);
      return json({ok:true},200,{'Set-Cookie':cookie(token)});
    }
    if (action==='logout') {
      const token=request.headers.get('cookie')?.match(/__Host-kno_client=([a-f0-9]{64})/)?.[1];
      if(token) await db.prepare('DELETE FROM sessions WHERE token=?').bind(await digest(token)).run();
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if (action==='reset-request') {
      const account=await db.prepare('SELECT id FROM users WHERE email=? AND disabled=0').bind(emailOf(data.email)).first();
      if(account) await db.prepare('INSERT INTO reset_requests(user_id,requested) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET requested=excluded.requested').bind(account.id,Date.now()).run();
      return json({ok:true,message:'If the account exists, your project manager can now see your reset request. They will share a reset link with you.'});
    }
    if (action==='reset') {
      if(typeof data.password!=='string'||data.password.length<12||data.password.length>256||!/^[a-f0-9]{64}$/.test(data.token||'')) return json({error:'Use a valid reset link and a password of at least 12 characters.'},400);
      const tokenHash=await digest(data.token);
      const reset=await db.prepare('SELECT r.user_id FROM resets r JOIN users u ON u.id=r.user_id WHERE r.token=? AND r.expires>? AND u.disabled=0').bind(tokenHash,Date.now()).first();
      if(!reset) return json({error:'This reset link has expired or has already been used.'},400);
      const password=await passwordHash(data.password);
      // The conditional update and token removal share a transaction; concurrent reuse cannot change the password.
      const result=await db.batch([
        db.prepare('UPDATE users SET password=? WHERE id=? AND EXISTS(SELECT 1 FROM resets WHERE token=? AND expires>?)').bind(password,reset.user_id,tokenHash,Date.now()),
        db.prepare('DELETE FROM resets WHERE user_id=?').bind(reset.user_id),
        db.prepare('DELETE FROM sessions WHERE user_id=?').bind(reset.user_id),
        db.prepare('DELETE FROM reset_requests WHERE user_id=?').bind(reset.user_id)
      ]);
      return result[0].meta.changes ? json({ok:true}) : json({error:'This reset link has already been used.'},400);
    }
    if (!user) return json({error:'Please sign in.'},401);
    if (user.role!=='admin') return json({error:'Administrator access required.'},403);
    if(action==='admin/reset') {
      const account=await db.prepare('SELECT id FROM users WHERE id=? AND disabled=0').bind(clean(data.userId)).first();
      if(!account) return json({error:'Account not found'},404);
      const token=randomToken();
      await db.batch([db.prepare('DELETE FROM resets WHERE user_id=?').bind(account.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(account.id),db.prepare('INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)').bind(await digest(token),account.id,Date.now()+3600000),db.prepare('DELETE FROM reset_requests WHERE user_id=?').bind(account.id)]);
      return json({ok:true,link:url.origin+'/clients/#reset='+token});
    }
    if(action==='admin/user') {
      const email=emailOf(data.email), password=data.password;
      if(!validEmail(email)||typeof password!=='string'||password.length<12||password.length>256) return json({error:'Enter an email and a password of at least 12 characters.'},400);
      const project=await db.prepare('SELECT id FROM projects WHERE id=?').bind(clean(data.projectId)).first();
      if(!project) return json({error:'Choose a project'},400);
      if(await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first()) return json({error:'Account already exists. Use Manage access or Reset password.'},409);
      const id=crypto.randomUUID();
      await db.batch([db.prepare('INSERT INTO users(id,email,password,role) VALUES(?,?,?,?)').bind(id,email,await passwordHash(password),'client'),db.prepare('INSERT INTO grants(user_id,project_id) VALUES(?,?)').bind(id,project.id)]);
      return json({ok:true});
    }
    if(action==='admin/access') {
      const id=clean(data.userId), project=clean(data.projectId);
      const account=await db.prepare("SELECT id FROM users WHERE id=? AND role='client'").bind(id).first();
      if(!account||!await db.prepare('SELECT id FROM projects WHERE id=?').bind(project).first()) return json({error:'Choose an account and project.'},400);
      await db.prepare(data.allow ? 'INSERT OR IGNORE INTO grants(user_id,project_id) VALUES(?,?)' : 'DELETE FROM grants WHERE user_id=? AND project_id=?').bind(id,project).run();
      return json({ok:true});
    }
    if(action==='admin/disable') {
      if(data.userId===user.id) return json({error:'You cannot disable your own account.'},400);
      await db.batch([db.prepare("UPDATE users SET disabled=? WHERE id=? AND role='client'").bind(data.disabled?1:0,clean(data.userId)),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(clean(data.userId))]);
      return json({ok:true});
    }
    if(action==='admin/project') {
      const id=clean(data.id), name=clean(data.name), path=clean(data.trialPath);
      if(!/^[a-z0-9-]{2,64}$/.test(id)||!name||(path && (!safeTrial(path)||path!=='/trials/'+id+'/'))) return json({error:'Use a simple project slug and a matching /trials/slug/ path, or leave the path empty.'},400);
      await db.prepare('INSERT INTO projects(id,name,trial_path) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,trial_path=excluded.trial_path').bind(id,name,path).run();
      return json({ok:true});
    }
    if(action==='admin/update') {
      const title=clean(data.title), body=clean(data.body,8000), project=clean(data.projectId);
      if(!title||!body||!await db.prepare('SELECT id FROM projects WHERE id=?').bind(project).first()) return json({error:'Choose a project and add a title and update.'},400);
      await db.prepare('INSERT INTO updates(id,project_id,title,body,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),project,title,body,Date.now()).run();
      return json({ok:true});
    }
    return json({error:'Not found'},404);
  } catch(error) {
    console.error('client_portal_error',error instanceof Error ? error.message : 'unknown');
    return json({error:'Client access is temporarily unavailable. Please try again shortly.'},503);
  }
}
const portalHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Your project | Kno.plus</title><link rel="stylesheet" href="/clients.css"><script src="/clients.js" defer></script><script src="/navigation-transition.js" defer></script></head><body><header><a class="brand" href="/">KNOPLUS</a><a href="/">Back to the work ↗</a></header><main><p class="eyebrow">A space for our work together</p><h1>Your project.<br><em>Moving forward.</em></h1><p id="message" role="status" aria-live="polite"></p><div id="portal"><p>Loading your workspace…</p></div></main></body></html>`;
