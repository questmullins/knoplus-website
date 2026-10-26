(() => {
  // Light or dark, shared with the rest of kno.plus: /scheme.js remembers the choice and handles the button.
  if(!window.knoScheme){const script=document.createElement('script');script.src='/scheme.js';document.head.append(script);}
  const back=document.querySelector('header a:not(.brand)');
  if(back){
    const nav=document.createElement('nav');
    back.replaceWith(nav);
    nav.innerHTML='<button type="button" class="scheme-toggle" data-scheme-toggle aria-label="Switch between light and dark mode" title="Light or dark"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor"/></svg></button>';
    nav.append(back);
  }
  const root=document.querySelector('#portal'), message=document.querySelector('#message');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let state, resetToken=new URLSearchParams(location.hash.slice(1)).get('reset');
  if(resetToken) history.replaceState(null,'',location.pathname+location.search);
  const say=text=>message.textContent=text;
  async function api(action,data) {
    const response=await fetch('/api/clients/'+action,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Please try again.');
    return result;
  }
  function options(){return state.projects.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');}
  function login() {
    root.innerHTML='<form class="login" data-action="login"><h2>Welcome back.</h2><p>Use the email and password shared with you.</p><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="username" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button>Sign in</button><button type="button" class="secondary" id="forgot">Request a password reset</button></form>';
    document.querySelector('#forgot').onclick=async()=>{try{const email=document.querySelector('#email'); if(!email.reportValidity())return;say((await api('reset-request',{email:email.value})).message);}catch(error){say(error.message);}};
  }
  async function load() {
    try{
      if(resetToken){root.innerHTML='<form class="login" data-action="reset"><h2>Choose a new password.</h2><label for="new-password">New password</label><input id="new-password" name="password" type="password" minlength="12" maxlength="256" autocomplete="new-password" required><small>At least 12 characters.</small><label for="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autocomplete="new-password" required><button>Save password</button></form>';return;}
      state=await api('me');
      if(!state.user){login();return;}
      const next=new URLSearchParams(location.search).get('next');
      if(state.user.role==='admin' && !(next && next.startsWith('/trials/'))){location.replace(next==='/annex/'?'/annex/':'/annex/#clients');return;}
      if(next && /^\/trials\/[a-z0-9-]+(?:\/|$)/.test(next)&&!next.includes('..')&&state.projects.some(p=>next.startsWith(p.trial_path)&&p.trial_path)){
        location.replace(next);return;
      }
      root.innerHTML='<div class="row"><p>Signed in as '+esc(state.user.email)+'</p><button class="secondary" data-action="logout">Sign out</button></div>'+state.projects.map(project=>'<section class="card"><p class="eyebrow">Your project</p><h2>'+esc(project.name)+'</h2>'+(project.trial_path?'<a class="button" href="'+esc(project.trial_path)+'">Open website trial ↗</a>':'')+(state.updates.filter(u=>u.project_id===project.id).map(u=>'<article><time>'+esc(new Date(u.created).toLocaleDateString())+'</time><h3>'+esc(u.title)+'</h3><p>'+esc(u.body)+'</p></article>').join('')||'<p class="muted">Updates will appear here as the project moves forward.</p>')+'</section>').join('')+(!state.projects.length?'<p>No projects have been assigned yet.</p>':'')+(state.user.role==='admin'?admin():'');
    }catch(error){say(error.message);root.innerHTML='<p>Please try again shortly, or <a href="mailto:info@kno.plus">contact us</a>.</p>';}
  }
  function admin(){
    return '<section><p class="eyebrow">Administrator</p><h2>Manage our work.</h2>'+
      '<details><summary>Post a project update</summary><form data-action="admin/update"><label>Project<select name="projectId">'+options()+'</select></label><label>Title<input name="title" maxlength="200" required></label><label>Update<textarea name="body" maxlength="8000" required></textarea></label><button>Post update</button></form></details>'+
      '<details><summary>Clients and password resets</summary>'+state.users.map(u=>'<div class="card account"><h3>'+esc(u.email)+'</h3><p>'+esc(u.role)+(u.disabled?' · Access disabled':'')+(u.requested?' · Password reset requested':'')+'</p><button data-reset="'+esc(u.id)+'">Create password-reset link</button>'+(u.role==='client'?'<button class="secondary" data-disable="'+esc(u.id)+'" data-disabled="'+Number(!u.disabled)+'">'+(u.disabled?'Enable':'Disable')+' access</button><form data-action="admin/access"><input type="hidden" name="userId" value="'+esc(u.id)+'"><p class="muted">Assigned: '+esc(state.grants.filter(g=>g.user_id===u.id).map(g=>state.projects.find(p=>p.id===g.project_id)?.name).join(', ')||'None')+'</p><label>Project<select name="projectId">'+options()+'</select></label><label>Access<select name="allow"><option value="yes">Allow</option><option value="no">Remove</option></select></label><button>Save access</button></form>':'')+'<div id="reset-'+esc(u.id)+'"></div></div>').join('')+'</details>'+
      '<details><summary>Add a client</summary><form data-action="admin/user"><label>Email<input name="email" type="email" required autocomplete="off"></label><label>Initial password<input name="password" type="password" minlength="12" maxlength="256" required autocomplete="new-password"></label><label>Project<select name="projectId">'+options()+'</select></label><button>Create client account</button></form></details>'+
      '<details><summary>Add or update a project</summary><form data-action="admin/project"><label>Project slug<input name="id" pattern="[a-z0-9-]{2,64}" placeholder="houseplant-nation" required></label><label>Project name<input name="name" required></label><label>Trial address (optional)<input name="trialPath" placeholder="/trials/houseplant-nation/"></label><p class="muted">Add website files in the repository’s trial-websites folder before linking a new trial.</p><button>Save project</button></form></details></section>';
  }
  root.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target;const data=Object.fromEntries(new FormData(form));const button=form.querySelector('button');button.disabled=true;say('');
    try{
      if(form.dataset.action==='reset'){if(data.password!==data.confirm)throw new Error('The passwords do not match.');data.token=resetToken;}
      if(form.dataset.action==='admin/access')data.allow=data.allow==='yes';
      await api(form.dataset.action,data);
      if(form.dataset.action==='reset'){resetToken=null;say('Password saved. Please sign in with your new password.');}
      else if(form.dataset.action.startsWith('admin/'))say('Saved.');
      await load();
    }catch(error){say(error.message);}finally{button.disabled=false;}
  });
  root.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button||(button.closest('form')&&button.type==='submit'))return;
    try{
      if(button.dataset.action==='logout'){await api('logout',{});await load();}
      if(button.dataset.reset){button.disabled=true;const result=await api('admin/reset',{userId:button.dataset.reset});document.getElementById('reset-'+button.dataset.reset).innerHTML='<label>One-time reset link · expires in one hour<input class="reset-link" readonly value="'+esc(result.link)+'"></label><small>Copy and share privately with this client. Their previous sessions have been signed out.</small>';say('Reset link created.');}
      if(button.dataset.disable){await api('admin/disable',{userId:button.dataset.disable,disabled:button.dataset.disabled==='1'});await load();}
    }catch(error){say(error.message);}finally{button.disabled=false;}
  });
  load();
})();
