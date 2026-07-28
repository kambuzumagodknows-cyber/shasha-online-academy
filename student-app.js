(()=>{
  'use strict';
  const db=window.shashaDb,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const days=['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  let learner=null,classes=[],assignments=[],attendance=[],results=[],announcements=[];
  const show=(el,text,error=false)=>{el.textContent=text;el.classList.remove('hidden','error');if(error)el.classList.add('error')};
  const hide=el=>el.classList.add('hidden');
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const when=v=>v?new Intl.DateTimeFormat('en-ZW',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'No deadline';

  $$('[data-auth-tab]').forEach(b=>b.onclick=()=>{
    $$('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));
    $('#login-form').classList.toggle('hidden',b.dataset.authTab!=='login');
    $('#signup-form').classList.toggle('hidden',b.dataset.authTab!=='signup');
    hide($('#auth-message'));
  });

  $('#login-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:String(f.get('email')).trim(),password:f.get('password')});if(error)return show($('#auth-message'),error.message,true);boot()};
  $('#signup-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {data,error}=await db.auth.signUp({email:String(f.get('email')).trim(),password:f.get('password'),options:{data:{full_name:String(f.get('fullName')).trim()}}});if(error)return show($('#auth-message'),error.message,true);show($('#auth-message'),data.session?'Account created. Link your approved learner record next.':'Account created. Confirm your email, then return and sign in.');if(data.session)boot()};
  $('#sign-out').onclick=async()=>{await db.auth.signOut();location.reload()};
  $('#refresh').onclick=loadPortal;
  $('#claim-account').onclick=async()=>{hide($('#claim-message'));const {error}=await db.rpc('claim_learner_account');if(error)return show($('#claim-message'),error.message,true);show($('#claim-message'),'Learner record linked successfully.');await loadPortal()};

  async function boot(){const {data:{session}}=await db.auth.getSession();if(!session){$('#auth-view').classList.remove('hidden');$('#portal-view').classList.add('hidden');return}$('#auth-view').classList.add('hidden');$('#portal-view').classList.remove('hidden');$('#identity').textContent=session.user.email;await loadPortal()}

  async function loadPortal(){
    const {data:{session}}=await db.auth.getSession();if(!session)return boot();
    const learnerResult=await db.from('learners').select('*').eq('profile_id',session.user.id).maybeSingle();
    if(learnerResult.error)return show($('#page-message'),learnerResult.error.message,true);
    learner=learnerResult.data;
    if(!learner){$('#claim-panel').classList.remove('hidden');$('#dashboard').classList.add('hidden');return}
    $('#claim-panel').classList.add('hidden');$('#dashboard').classList.remove('hidden');
    const [classResult,assignmentResult,attendanceResult,resultResult,announcementResult]=await Promise.all([
      db.from('learner_classes').select('status,classes(*,teachers(full_name),subject_catalog(name))').eq('learner_id',learner.id).eq('status','active'),
      db.from('assignments').select('*,classes(name,subject_code,subject_catalog(name)),assignment_submissions(status,score,feedback,submitted_at)').order('due_at',{ascending:true}),
      db.from('attendance_records').select('*').eq('learner_id',learner.id).order('lesson_date',{ascending:false}),
      db.from('assessment_results').select('*,assessments(title,assessment_type,max_score,assessment_date,classes(subject_code,subject_catalog(name)))').eq('learner_id',learner.id).eq('published',true).order('created_at',{ascending:false}),
      db.from('announcements').select('*').eq('published',true).order('published_at',{ascending:false}).limit(12)
    ]);
    const failed=[classResult,assignmentResult,attendanceResult,resultResult,announcementResult].find(x=>x.error);
    if(failed)return show($('#page-message'),failed.error.message,true);
    classes=(classResult.data||[]).map(x=>x.classes).filter(Boolean).sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time));
    assignments=assignmentResult.data||[];attendance=attendanceResult.data||[];results=resultResult.data||[];announcements=announcementResult.data||[];
    render();
  }

  function render(){
    $('#today').textContent=new Intl.DateTimeFormat('en-ZW',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    $('#learner-name').textContent=learner.full_name;
    $('#learner-summary').textContent=`${learner.academic_level} learner with ${(learner.subjects||[]).length} approved subject${(learner.subjects||[]).length===1?'':'s'}.`;
    $('#level').textContent=learner.academic_level;$('#subject-count').textContent=(learner.subjects||[]).length;$('#class-count').textContent=classes.length;
    const counted=attendance.filter(a=>['present','late','absent'].includes(a.status));const attended=counted.filter(a=>['present','late'].includes(a.status)).length;$('#attendance-rate').textContent=counted.length?`${Math.round(attended/counted.length*100)}%`:'—';
    $('#subjects').innerHTML=(learner.subjects||[]).map(s=>`<span class="chip">${esc(s)}</span>`).join('')||'<span>No subjects assigned yet.</span>';
    $('#timetable').innerHTML=classes.length?classes.map(c=>`<article class="class-card"><small>${days[c.weekday]} · ${c.start_time.slice(0,5)}–${c.end_time.slice(0,5)}</small><h3>${esc(c.subject_catalog?.name||c.subject_code)}</h3><p>${esc(c.name)}</p><div class="class-meta"><span>Teacher: ${esc(c.teachers?.full_name||'To be assigned')}</span><span>Level: ${esc(c.academic_level)}</span></div>${c.meeting_url?`<a class="join" href="${esc(c.meeting_url)}" target="_blank" rel="noopener">Join class</a>`:'<span class="join disabled">Meeting link pending</span>'}</article>`).join(''):'<div class="notice">No classes have been assigned yet.</div>';
    $('#assignments').innerHTML=assignments.length?assignments.map(a=>{const sub=(a.assignment_submissions||[])[0];return `<article class="class-card"><small>${esc(a.classes?.subject_catalog?.name||a.classes?.subject_code||'Subject')} · Due ${esc(when(a.due_at))}</small><h3>${esc(a.title)}</h3><p>${esc(a.instructions||'Instructions will be provided by your teacher.')}</p><div class="class-meta"><span>Maximum: ${Number(a.max_score)} marks</span><span>Status: ${esc(sub?.status||'not submitted')}</span></div>${a.attachment_url?`<a class="join" href="${esc(a.attachment_url)}" target="_blank" rel="noopener">Open assignment</a>`:''}</article>`}).join(''):'<div class="notice">No published assignments yet.</div>';
    $('#results').innerHTML=results.length?results.map(r=>{const a=r.assessments||{},pct=a.max_score?Math.round(Number(r.score)/Number(a.max_score)*100):0;return `<article class="class-card"><small>${esc(a.classes?.subject_catalog?.name||a.classes?.subject_code||'Subject')} · ${esc(a.assessment_type||'assessment')}</small><h3>${esc(a.title||'Assessment')}</h3><p><strong>${Number(r.score)} / ${Number(a.max_score||100)} (${pct}%)</strong></p><div class="class-meta"><span>${esc(r.feedback||'No teacher feedback yet.')}</span></div></article>`}).join(''):'<div class="notice">No published results yet.</div>';
    $('#announcements').innerHTML=announcements.length?announcements.map(a=>`<article class="class-card"><small>${esc(a.audience)} · ${esc(when(a.published_at||a.created_at))}</small><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></article>`).join(''):'<div class="notice">No announcements yet.</div>';
  }

  db.auth.onAuthStateChange(()=>setTimeout(boot,0));boot();
})();