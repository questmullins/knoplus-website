// Start Wrangler locally with a test administrator, then set the two environment variables below.
// Intentionally restricted to loopback: this suite creates test accounts/projects.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787';
const adminEmail=process.env.PORTAL_TEST_ADMIN_EMAIL;
const adminPassword=process.env.PORTAL_TEST_ADMIN_PASSWORD;
assert(adminEmail && adminPassword,'Set PORTAL_TEST_ADMIN_EMAIL and PORTAL_TEST_ADMIN_PASSWORD for the local test administrator.');
async function post(action,data,cookie='',origin=base){return fetch(base+'/api/clients/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(data),redirect:'manual'});}
const get=(path,cookie='')=>fetch(base+path,{headers:{Cookie:cookie},redirect:'manual'});
for(const path of ['/trials/houseplant-nation/','/trials/houseplant-nation/assets/shop.jpeg','/revamp/websites/houseplant-nation/index.html','/trials%2Fhouseplant-nation%2Fassets%2Fshop.jpeg']){
  assert.equal((await get(path)).status,303,path+' protected');
}
const adminLogin=await post('login',{email:adminEmail,password:adminPassword});
assert.equal(adminLogin.status,200);
const admin=adminLogin.headers.get('set-cookie').split(';')[0];
assert.match(adminLogin.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
const id='test-'+Date.now(), email=id+'@example.com';
await post('admin/user',{email,password:'test-password-long',projectId:'houseplant-nation'},admin);
assert.equal((await post('login',{email,password:'wrong'})).status,401);
const login=await post('login',{email,password:'test-password-long'});
assert.equal(login.status,200);
const client=login.headers.get('set-cookie').split(';')[0];
assert.equal((await get('/trials/houseplant-nation/',client)).status,200);
assert.equal((await get('/trials/houseplant-nation/assets/shop.jpeg',client)).headers.get('cache-control'),'private, no-store');
assert.equal((await get('/trials/other/',client)).status,403);
assert.equal((await post('admin/project',{id:'forbidden',name:'Forbidden'},client)).status,403);
assert.equal((await post('logout',{},client,'https://other.example')).status,403);
await post('admin/project',{id,name:'Test isolated project',trialPath:''},admin);
await post('admin/update',{projectId:id,title:'Private test',body:'Only assigned clients should see this.'},admin);
const clientMe=await (await get('/api/clients/me',client)).json();
assert(!clientMe.projects.some(p=>p.id===id));
assert(!clientMe.updates.some(u=>u.project_id===id));
const me=await (await get('/api/clients/me',admin)).json();
const user=me.users.find(u=>u.email===email);
await post('reset-request',{email});
const reset=await (await post('admin/reset',{userId:user.id},admin)).json();
assert.equal((await get('/trials/houseplant-nation/',client)).status,303);
const token=new URLSearchParams(new URL(reset.link).hash.slice(1)).get('reset');
assert.equal((await post('reset',{token,password:'replacement-password-long'})).status,200);
assert.equal((await post('reset',{token,password:'replacement-password-long'})).status,400);
assert.equal((await post('login',{email,password:'test-password-long'})).status,401);
const newLogin=await post('login',{email,password:'replacement-password-long'});
const newCookie=newLogin.headers.get('set-cookie').split(';')[0];
assert.equal(newLogin.status,200);
await post('admin/access',{userId:user.id,projectId:'houseplant-nation',allow:false},admin);
assert.equal((await get('/trials/houseplant-nation/',newCookie)).status,403);
await post('admin/disable',{userId:user.id,disabled:true},admin);
assert.equal((await (await get('/api/clients/me',newCookie)).json()).user,null);
await post('logout',{},admin);
assert.equal((await (await get('/api/clients/me',admin)).json()).user,null);
console.log('PASS: protected paths/assets, sessions, CSRF, account isolation, admin-only actions, reset/reuse, grant revocation, disabled users and logout.');
