(() => {
  'use strict';
  const db=window.shashaDb,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let profile=null,apps=[],selected=null;
  const auth=$('#auth-view'),admin=$('#admin-view'),authMsg=$('#auth-message');
  const message=(el,text,error=false)=>{el.textContent=text;el.classList.remove('hidden','error');if(error)el.classList.add('error')};
  const clear=el=>el.classList.add('hidden');
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const date=v=>new Intl.DateTimeFormat('en-ZW',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));

  $$('[data-auth-tab]').forEach(b=>b.onclick=()=>{$$('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));$('#login-form').classList.toggle('hidden',b.dataset.authTab!=='login');$('#signup-form').classList.toggle('hidden',b.dataset.authTab!=='signup');clear(authMsg)});
  $('#login-form').onsubmit=async e=>{e.preventDefault();clear(authMsg);const f=new FormData(e.currentTarget),{error}=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)return message(authMsg,error.message,true);boot()};
  $('#signup-form').onsubmit=async e=>{e.preventDefault();clear(authMsg);const f=new FormData(e.currentTarget),{data,error}=await db.auth.signUp({email:f.get('email'),password:f.get('password'),options:{data:{full_name:f.get('fullName')}}});if(error)return message(authMsg,error.message,true);message(authMsg,data.session?'Account created. Continue with owner setup.':'Account created. Check your email, confirm it, then sign in.');if(data.session)boot()};
  $('#sign-out').onclick=async()=>{await db.auth.signOut();location.reload()};
  $('#refresh-apps').onclick=load;$('#search-apps').oninput=render;$('#status-filter').onchange=render;

  async function boot(){
    const {data:{session}}=await db.auth.getSession();
    if(!session){auth.classList.remove('hidden');admin.classList.add('hidden');return}
    const {data,error}=await db.from('profiles').select('*').eq('id',session.user.id).single();
    if(error)return message(authMsg,error.message,true);
    profile=data;auth.classList.add('hidden');admin.classList.remove('hidden');$('#admin-identity').textContent=`${profile.full_name||session.user.email} · ${profile.role}`;
    $('#claim-panel').classList.toggle('hidden',profile.role!=='pending');
    if(['admin','super_admin','finance'].includes(profile.role))load();else $('#apps-loading').textContent='This account has no staff access yet.';
  }
  $('#claim-form').onsubmit=async e=>{e.preventDefault();const code=new FormData(e.currentTarget).get('code'),{error}=await db.rpc('claim_first_super_admin',{bootstrap_code:code});if(error)return message($('#claim-message'),error.message,true);message($('#claim-message'),'Super-admin access granted.');boot()};

  async function load(){
    $('#apps-loading').classList.remove('hidden');$('#apps-table').classList.add('hidden');
    const {data,error}=await db.from('applications').select('*').order('created_at',{ascending:false});
    if(error){$('#apps-loading').textContent=error.message;return}
    apps=data||[];$('#apps-loading').classList.add('hidden');$('#apps-table').classList.remove('hidden');render();
  }
  function render(){
    const q=$('#search-apps').value.trim().toLowerCase(),status=$('#status-filter').value;
    const rows=apps.filter(a=>(!status||a.status===status)&&(!q||[a.guardian_name,a.learner_name,a.guardian_email,a.phone,a.academic_level,...(a.subjects||[])].join(' ').toLowerCase().includes(q)));
    $('#stat-all').textContent=apps.length;$('#stat-new').textContent=apps.filter(a=>a.status==='new').length;$('#stat-review').textContent=apps.filter(a=>a.status==='under_review').length;$('#stat-approved').textContent=apps.filter(a=>['approved','timetable_pending','active'].includes(a.status)).length;
    $('#apps-body').innerHTML=rows.length?rows.map(a=>`<tr><td class="person"><strong>${esc(a.learner_name)}</strong><small>Guardian: ${esc(a.guardian_name)}</small></td><td>${esc(a.guardian_email)}<br><small>${esc(a.phone)}</small></td><td>${esc(a.academic_level)}<br><small>${esc((a.subjects||[]).join(', '))}</small></td><td><span class="badge ${esc(a.status)}">${esc(a.status.replaceAll('_',' '))}</span></td><td>${date(a.created_at)}</td><td><button class="secondary" data-review="${a.id}">Review</button></td></tr>`).join(''):'<tr><td colspan="6" class="loading">No matching applications.</td></tr>';
    $$('[data-review]').forEach(b=>b.onclick=()=>openReview(b.dataset.review));
  }
  function openReview(id){
    selected=apps.find(a=>a.id===id);if(!selected)return;
    $('#review-name').textContent=selected.learner_name;$('#review-reference').textContent=`Reference ${selected.id.slice(0,8).toUpperCase()}`;
    $('#review-details').innerHTML=[['Guardian',selected.guardian_name],['Guardian email',selected.guardian_email],['Phone',selected.phone],['Academic level',selected.academic_level],['Subjects',(selected.subjects||[]).join(', ')],['Device',selected.learning_device],['Learner email',selected.learner_email||'Not provided'],['Notes',selected.notes||'None']].map(([k,v])=>`<div class="detail"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('');
    const f=$('#review-form');f.status.value=selected.status;f.note.value=selected.admin_notes||'';clear($('#review-message'));$('#review-drawer').classList.add('open');
  }
  $$('[data-close-review]').forEach(b=>b.onclick=()=>$('#review-drawer').classList.remove('open'));
  $('#review-form').onsubmit=async e=>{e.preventDefault();if(!selected)return;const f=new FormData(e.currentTarget),{data,error}=await db.rpc('review_application',{application_id:selected.id,next_status:f.get('status'),note:f.get('note')||null});if(error)return message($('#review-message'),error.message,true);message($('#review-message'),'Decision saved successfully.');selected=data;await load();setTimeout(()=>$('#review-drawer').classList.remove('open'),700)};
  db.auth.onAuthStateChange(()=>setTimeout(boot,0));boot();
})();
