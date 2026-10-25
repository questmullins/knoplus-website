import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {analyticsPath,recordAnalytics} from '../server/analytics.js';
const base='http://127.0.0.1:8791';
const db=sql=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','knoplus-clients','--local','--command',sql],{stdio:'pipe'});
const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex'),id='analytics-test-'+Date.now();
const get=(path,cookie='')=>fetch(base+path,{headers:{cookie}});
assert.equal(analyticsPath(new Request('https://kno.plus/revamp?private=value')),'/revamp');
for(const url of ['https://manage.kno.plus/','https://kno.plus/clients/','https://kno.plus/trials/foo/','https://kno.plus/api/clients/me'])assert.equal(analyticsPath(new Request(url)),null);
assert.equal((await get('/api/manage/analytics')).status,401);
db(`INSERT INTO users(id,email,password,role,disabled) VALUES('${id}','${id}@example.test','unused','admin',0); INSERT INTO sessions(token,user_id,expires) VALUES('${hash}','${id}',${Date.now()+600000});`);
const cookie='__Host-kno_client='+token;
try{
 let response=await get('/api/manage/analytics?days=7',cookie);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');let data=await response.json();assert.equal(data.series.length,7);assert.equal(data.site,'kno.plus');
 assert.equal((await get('/api/manage/analytics?days=999',cookie)).status,400);
 const day=new Date().toISOString().slice(0,10);db(`INSERT INTO site_analytics_daily(day,path,source,kind,total) VALUES('${day}','/${id}','Search','page',3);`);
 data=await (await get('/api/manage/analytics?days=7',cookie)).json();assert.equal(data.pages.find(p=>p.name==='/'+id).count,3);assert(data.pageRequests>=3);assert(data.sources.find(s=>s.name==='Search').count>=3);
 db(`UPDATE users SET role='client' WHERE id='${id}';`);assert.equal((await get('/api/manage/analytics',cookie)).status,403);
 db(`UPDATE users SET role='admin',disabled=1 WHERE id='${id}';`);assert.equal((await get('/api/manage/analytics',cookie)).status,401);
 // Verify actual collector accepts HTML and excludes assets and bots, without retaining identifying fields.
 const writes=[];const fake={batch:async()=>[],prepare(sql){return {bind(...args){this.args=args;return this},async run(){writes.push({sql,args:this.args})}}}};
 const env={CLIENT_DB:fake};
 await recordAnalytics(new Request('https://kno.plus/gallery?email=private',{headers:{referer:'https://www.google.com/search?q=private','user-agent':'Mozilla/5.0'}}),env,new Response('html',{headers:{'content-type':'text/html'}}));
 assert.equal(writes.length,1);assert.deepEqual(writes[0].args.slice(1),['/gallery','Search','page']);
 await recordAnalytics(new Request('https://kno.plus/image.jpg'),env,new Response('',{headers:{'content-type':'image/jpeg'}}));
 await recordAnalytics(new Request('https://kno.plus/',{headers:{'user-agent':'Googlebot'}}),env,new Response('',{headers:{'content-type':'text/html'}}));assert.equal(writes.length,1);
 console.log('PASS: anonymous/client/disabled access denied; admin reports, range validation, aggregates, private-route exclusions, HTML-only collection, bot filtering, and query privacy.');
}finally{db(`DELETE FROM sessions WHERE user_id='${id}'; DELETE FROM users WHERE id='${id}'; DELETE FROM site_analytics_daily WHERE path='/${id}';`);}
