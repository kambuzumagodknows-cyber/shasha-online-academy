(()=>{
  'use strict';
  const db=window.shashaDb,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let profile=null,teachers=[],availability=[],classes=[],learners=[],subjects=[],levels=[],selectedTeacher=null,selectedLearner=null;
  const days=['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const msg=(t,e=false)=>{const x=$('#page-message');x.textContent=t;x.classList.remove('hidden','error');if(e)x.classList.add('error');setTimeout(()=>x.classList.add('hidden'),4200)};
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const levelLabel=l=>`${l.curricula?.name||'Curriculum'} — ${l.name}`;

  $$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===b.dataset.tab))});
  $('#sign-out').onclick=async()=>{await db.auth.signOut();location.href='admin.html'};
  $('#refresh-all').onclick=async()=>{await loadAll();msg('Subjects, levels, teachers and classes refreshed from the database.')};

  async function boot(){
    const {data:{session}}=await db.auth.getSession();
    if(!session){location.href='admin.html';return}
    const {data,error}=await db.from('profiles').select('*').eq('id',session.user.id).single();
    if(error||!['admin','super_admin'].includes(data?.role)){location.href='admin.html';return}
    profile=data;$('#admin-identity').textContent=`${profile.full_name||session.user.email} · ${profile.role}`;
    await loadAll();
  }

  async function loadAll(){
    const [s,lv,t,a,c,l]=await Promise.all([
      db.from('academic_subjects').select('*').eq('active',true).order('name'),
      db.from('academic_levels').select('*,curricula(name,code)').eq('active',true).order('sort_order'),
      db.from('teachers').select('*').order('full_name'),
      db.from('teacher_availability').select('*').order('weekday').order('start_time'),
      db.from('classes').select('*,teachers(full_name),subject_catalog(name)').order('weekday').order('start_time'),
      db.from('learners').select('*').order('full_name')
    ]);
    const err=[s,lv,t,a,c,l].find(x=>x.error)?.error;
    if(err)return msg(err.message,true);
    subjects=s.data||[];levels=lv.data||[];teachers=t.data||[];availability=a.data||[];classes=c.data||[];learners=l.data||[];
    hydrate();renderAll();
  }

  function hydrate(){
    $('#teacher-subjects').innerHTML=subjects.map(s=>`<label><input type="checkbox" name="subjects" value="${esc(s.code)}"><span>${esc(s.name)}</span></label>`).join('')||'<span class="empty">No active subjects. Add them in Academic Setup.</span>';
    $('#teacher-levels').innerHTML=levels.map(l=>`<label><input type="checkbox" name="levels" value="${esc(l.name)}"><span>${esc(levelLabel(l))}</span></label>`).join('')||'<span class="empty">No active levels. Add them in Academic Setup.</span>';
    $('#class-subject').innerHTML='<option value="">Select subject</option>'+subjects.map(s=>`<option value="${esc(s.code)}">${esc(s.name)}</option>`).join('');
    $('#class-level').innerHTML='<option value="">Select level</option>'+levels.map(l=>`<option value="${esc(l.name)}">${esc(levelLabel(l))}</option>`).join('');
    $('#class-teacher').innerHTML='<option value="">Select teacher</option>'+teachers.filter(t=>t.status==='approved').map(t=>`<option value="${t.id}">${esc(t.full_name)}</option>`).join('');
  }

  function renderAll(){renderTeachers();renderClasses();renderLearners();if(selectedTeacher)renderAvailability();if(selectedLearner)renderPlacement()}
  function renderTeachers(){
    $('#teacher-count').textContent=teachers.length;
    $('#teacher-list').innerHTML=teachers.length?teachers.map(t=>`<article class="item"><div><strong>${esc(t.full_name)}</strong><small>${esc(t.email||t.phone||'No contact')} · ${(t.subjects||[]).map(code=>subjects.find(s=>s.code===code)?.name||code).join(', ')||'No subjects'}</small><small>${esc((t.academic_levels||[]).join(', ')||'No levels')}</small></div><div class="item-actions"><span class="pill ${esc(t.status)}">${esc(t.status)}</span><button class="secondary" data-availability="${t.id}">Availability</button></div></article>`).join(''):'<div class="empty">No teachers yet.</div>';
    $$('[data-availability]').forEach(b=>b.onclick=()=>{selectedTeacher=teachers.find(t=>t.id===b.dataset.availability);$('#availability-card').classList.remove('hidden');renderAvailability();$('#availability-card').scrollIntoView({behavior:'smooth'})});
  }
  function renderAvailability(){
    if(!selectedTeacher)return;
    $('#availability-title').textContent=`${selectedTeacher.full_name} availability`;
    const rows=availability.filter(a=>a.teacher_id===selectedTeacher.id);
    $('#availability-list').innerHTML=rows.length?rows.map(a=>`<span class="slot">${days[a.weekday]} ${a.start_time.slice(0,5)}–${a.end_time.slice(0,5)} <button class="danger" data-delete-slot="${a.id}">×</button></span>`).join(''):'<span class="empty">No availability added.</span>';
    $$('[data-delete-slot]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('teacher_availability').delete().eq('id',b.dataset.deleteSlot);if(error)return msg(error.message,true);msg('Availability removed.');await loadAll()});
  }
  $('#close-availability').onclick=()=>{$('#availability-card').classList.add('hidden');selectedTeacher=null};
  $('#teacher-form').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),payload={full_name:f.get('fullName').trim(),email:f.get('email').trim()||null,phone:f.get('phone').trim()||null,subjects:f.getAll('subjects'),academic_levels:f.getAll('levels'),status:f.get('status')};
    if(!payload.subjects.length||!payload.academic_levels.length)return msg('Choose at least one subject and academic level.',true);
    const {error}=await db.from('teachers').insert(payload);if(error)return msg(error.message,true);
    e.currentTarget.reset();msg('Teacher saved. Add availability next.');await loadAll();
  };
  $('#availability-form').onsubmit=async e=>{e.preventDefault();if(!selectedTeacher)return;const f=new FormData(e.currentTarget),payload={teacher_id:selectedTeacher.id,weekday:Number(f.get('weekday')),start_time:f.get('startTime'),end_time:f.get('endTime')};const {error}=await db.from('teacher_availability').insert(payload);if(error)return msg(error.message,true);msg('Availability added.');e.currentTarget.reset();await loadAll()};

  function renderClasses(){
    $('#class-count').textContent=classes.length;
    $('#class-list').innerHTML=classes.length?classes.map(c=>`<article class="item"><div><strong>${esc(c.name)}</strong><small>${days[c.weekday]} ${c.start_time.slice(0,5)}–${c.end_time.slice(0,5)} · ${esc(c.subject_catalog?.name||c.subject_code)} · ${esc(c.academic_level)}</small><small>Teacher: ${esc(c.teachers?.full_name||'Unassigned')} · Capacity ${c.capacity}</small></div><div class="item-actions"><span class="pill ${c.published?'active':'pending'}">${c.published?'Published':'Draft'}</span></div></article>`).join(''):'<div class="empty">No class sessions yet.</div>';
  }
  $('#class-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),args={p_name:f.get('name').trim(),p_subject_code:f.get('subject'),p_academic_level:f.get('level'),p_teacher_id:f.get('teacher'),p_weekday:Number(f.get('weekday')),p_start_time:f.get('startTime'),p_end_time:f.get('endTime'),p_capacity:Number(f.get('capacity')),p_meeting_url:f.get('meetingUrl').trim()||null,p_session_group:f.get('sessionGroup').trim()||null};const {error}=await db.rpc('create_class_session',args);if(error)return msg(error.message,true);msg('Class session created without conflicts.');e.currentTarget.reset();await loadAll()};

  function renderLearners(){
    const q=($('#learner-search').value||'').toLowerCase();
    const rows=learners.filter(l=>!q||`${l.full_name} ${l.academic_level} ${(l.subjects||[]).join(' ')}`.toLowerCase().includes(q));
    $('#learner-list').innerHTML=rows.length?rows.map(l=>`<article class="item ${selectedLearner?.id===l.id?'selected-item':''}"><div><strong>${esc(l.full_name)}</strong><small>${esc(l.academic_level)} · ${esc((l.subjects||[]).join(', '))}</small><small>Status: ${esc(l.status)}</small></div><button class="secondary" data-select-learner="${l.id}">Select</button></article>`).join(''):'<div class="empty">No approved learners found.</div>';
    $$('[data-select-learner]').forEach(b=>b.onclick=()=>{selectedLearner=learners.find(l=>l.id===b.dataset.selectLearner);renderLearners();renderPlacement()});
  }
  $('#learner-search').oninput=renderLearners;
  function renderPlacement(){
    if(!selectedLearner)return;
    $('#placement-help').textContent=`Classes matching ${selectedLearner.full_name}'s level and subjects.`;
    const subjectCodes=subjects.filter(s=>(selectedLearner.subjects||[]).includes(s.name)).map(s=>s.code);
    const rows=classes.filter(c=>c.active&&c.academic_level===selectedLearner.academic_level&&subjectCodes.includes(c.subject_code));
    $('#placement-classes').innerHTML=rows.length?rows.map(c=>`<article class="item"><div><strong>${esc(c.name)}</strong><small>${days[c.weekday]} ${c.start_time.slice(0,5)}–${c.end_time.slice(0,5)} · ${esc(c.subject_catalog?.name||c.subject_code)}</small><small>Teacher: ${esc(c.teachers?.full_name||'Unassigned')}</small></div><button class="primary" data-assign-class="${c.id}">Assign</button></article>`).join(''):'<div class="empty">No matching classes. Create sessions for this level and subject first.</div>';
    $$('[data-assign-class]').forEach(b=>b.onclick=async()=>{const {error}=await db.rpc('assign_learner_to_class',{p_learner_id:selectedLearner.id,p_class_id:b.dataset.assignClass});if(error)return msg(error.message,true);msg(`${selectedLearner.full_name} assigned successfully.`)});
  }
  boot();
})();