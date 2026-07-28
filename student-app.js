(()=>{
  'use strict';
  const db=window.shashaDb,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const days=['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  let learner=null,classes=[];
  const show=(el,text,error=false)=>{el.textContent=text;el.classList.remove('hidden','error');if(error)el.classList.add('error')};
  const hide=el=>el.classList.add('hidden');
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  $$('[data-auth-tab]').forEach(b=>b.onclick=()=>{
    $$('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));
    $('#login-form').classList.toggle('hidden',b.dataset.authTab!=='login');
    $('#signup-form').classList.toggle('hidden',b.dataset.authTab!=='signup');
    hide($('#auth-message'));
  });

  $('#login-form').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const {error}=await db.auth.signInWithPassword({email:String(f.get('email')).trim(),password:f.get('password')});
    if(error)return show($('#auth-message'),error.message,true);
    boot();
  };

  $('#signup-form').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const {data,error}=await db.auth.signUp({email:String(f.get('email')).trim(),password:f.get('password'),options:{data:{full_name:String(f.get('fullName')).trim()}}});
    if(error)return show($('#auth-message'),error.message,true);
    show($('#auth-message'),data.session?'Account created. Link your approved learner record next.':'Account created. Confirm your email, then return and sign in.');
    if(data.session)boot();
  };

  $('#sign-out').onclick=async()=>{await db.auth.signOut();location.reload()};
  $('#refresh').onclick=loadPortal;
  $('#claim-account').onclick=async()=>{
    hide($('#claim-message'));
    const {error}=await db.rpc('claim_learner_account');
    if(error)return show($('#claim-message'),error.message,true);
    show($('#claim-message'),'Learner record linked successfully.');
    await loadPortal();
  };

  async function boot(){
    const {data:{session}}=await db.auth.getSession();
    if(!session){$('#auth-view').classList.remove('hidden');$('#portal-view').classList.add('hidden');return}
    $('#auth-view').classList.add('hidden');$('#portal-view').classList.remove('hidden');
    $('#identity').textContent=session.user.email;
    await loadPortal();
  }

  async function loadPortal(){
    const {data:{session}}=await db.auth.getSession();
    if(!session)return boot();
    const {data,error}=await db.from('learners').select('*').eq('profile_id',session.user.id).maybeSingle();
    if(error)return show($('#page-message'),error.message,true);
    learner=data;
    if(!learner){$('#claim-panel').classList.remove('hidden');$('#dashboard').classList.add('hidden');return}
    $('#claim-panel').classList.add('hidden');$('#dashboard').classList.remove('hidden');
    const result=await db.from('learner_classes').select('status,classes(*,teachers(full_name),subject_catalog(name))').eq('learner_id',learner.id).eq('status','active');
    if(result.error)return show($('#page-message'),result.error.message,true);
    classes=(result.data||[]).map(x=>x.classes).filter(Boolean).sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time));
    render();
  }

  function render(){
    $('#today').textContent=new Intl.DateTimeFormat('en-ZW',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    $('#learner-name').textContent=learner.full_name;
    $('#learner-summary').textContent=`${learner.academic_level} learner with ${(learner.subjects||[]).length} approved subject${(learner.subjects||[]).length===1?'':'s'}.`;
    $('#level').textContent=learner.academic_level;
    $('#subject-count').textContent=(learner.subjects||[]).length;
    $('#class-count').textContent=classes.length;
    $('#status').textContent=learner.status.replaceAll('_',' ');
    $('#subjects').innerHTML=(learner.subjects||[]).map(s=>`<span class="chip">${esc(s)}</span>`).join('')||'<span>No subjects assigned yet.</span>';
    $('#timetable').innerHTML=classes.length?classes.map(c=>`<article class="class-card"><small>${days[c.weekday]} · ${c.start_time.slice(0,5)}–${c.end_time.slice(0,5)}</small><h3>${esc(c.subject_catalog?.name||c.subject_code)}</h3><p>${esc(c.name)}</p><div class="class-meta"><span>Teacher: ${esc(c.teachers?.full_name||'To be assigned')}</span><span>Level: ${esc(c.academic_level)}</span></div>${c.meeting_url?`<a class="join" href="${esc(c.meeting_url)}" target="_blank" rel="noopener">Join class</a>`:'<span class="join disabled">Meeting link pending</span>'}</article>`).join(''):'<div class="notice">No classes have been assigned yet. Your approved subjects are ready for timetable placement.</div>';
  }

  db.auth.onAuthStateChange(()=>setTimeout(boot,0));
  boot();
})();