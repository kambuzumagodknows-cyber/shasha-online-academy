(()=>{
  'use strict';
  const db=window.shashaDb,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let role='parent',curricula=[],levels=[],subjects=[],mappings=[],plans=[],submitting=false;
  const form=$('#join-form'),button=$('#submit-button');
  const show=(text,error=false)=>{const el=$('#form-message');el.textContent=text;el.classList.remove('hidden','error');if(error)el.classList.add('error');el.scrollIntoView({behavior:'smooth',block:'nearest'})};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const newId=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-4${Math.random().toString(16).slice(2,5)}-8${Math.random().toString(16).slice(2,5)}-${Math.random().toString(16).slice(2,14)}`;
  const reference=id=>id.replaceAll('-','').slice(0,8).toUpperCase();
  const normalisePhone=value=>String(value||'').trim().replace(/\s+/g,' ');

  async function load(){
    const [c,l,s,m,p]=await Promise.all([
      db.from('curricula').select('*').eq('active',true).order('sort_order'),
      db.from('academic_levels').select('*').eq('active',true).order('sort_order'),
      db.from('academic_subjects').select('*').eq('active',true).order('name'),
      db.from('curriculum_subjects').select('*').eq('active',true),
      db.from('pricing_plans').select('*').eq('active',true).order('name')
    ]);
    const bad=[c,l,s,m,p].find(x=>x.error);
    if(bad)return show('Could not load ShaSha programmes. Please refresh or WhatsApp 0719883520.',true);
    curricula=c.data||[];levels=l.data||[];subjects=s.data||[];mappings=m.data||[];plans=p.data||[];
    hydrateTeacher();hydrateCurricula();
  }

  function hydrateTeacher(){
    $('#teacher-subjects').innerHTML=subjects.map(s=>`<label><input type="checkbox" name="teachingSubjects" value="${s.id}"> ${esc(s.name)}</label>`).join('');
    $('#teacher-levels').innerHTML=levels.map(l=>`<label><input type="checkbox" name="teachingLevels" value="${l.id}"> ${esc(l.name)}</label>`).join('');
  }

  function hydrateCurricula(){
    $('#curriculum').innerHTML='<option value="">Choose curriculum</option>'+curricula.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('#academic-level').innerHTML='<option value="">Choose curriculum first</option>';
    $('#pricing-plan').innerHTML='<option value="">Let ShaSha recommend a package</option>'+plans.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.currency)} ${Number(p.amount).toFixed(2)}</option>`).join('');
    $('#learner-subjects').innerHTML='<span>Choose a curriculum and level first.</span>';
  }

  function updateAcademic(){
    const cid=$('#curriculum').value,available=levels.filter(l=>l.curriculum_id===cid);
    $('#academic-level').innerHTML='<option value="">Choose academic level</option>'+available.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('');
    $('#learner-subjects').innerHTML='<span>Choose an academic level.</span>';
  }
  $('#curriculum').onchange=updateAcademic;
  $('#academic-level').onchange=()=>{
    const cid=$('#curriculum').value,lid=$('#academic-level').value;
    const ids=new Set(mappings.filter(m=>m.curriculum_id===cid&&(!m.academic_level_id||m.academic_level_id===lid)).map(m=>m.subject_id));
    const rows=subjects.filter(s=>ids.has(s.id));
    $('#learner-subjects').innerHTML=rows.map(s=>`<label><input type="checkbox" name="subjects" value="${s.id}"> ${esc(s.name)}</label>`).join('')||'<span>No subjects mapped to this level yet. ShaSha will assist.</span>';
  };

  const journey={
    parent:{title:'Parent application',copy:'Tell us about you and the learner. We will review the application, recommend the right package and set up learner, parent and WhatsApp classroom access.',button:'Submit parent application'},
    student:{title:'Student application',copy:'Apply for yourself. Younger learners should include a parent or guardian contact so ShaSha can complete onboarding safely.',button:'Submit student application'},
    teacher:{title:'Teacher application',copy:'Show us what you can teach, your experience and availability. Approved teachers receive a teacher account and assigned WhatsApp classes.',button:'Submit teacher application'}
  };

  function setRole(next){
    role=next;
    $$('.journey').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
    form.applicantType.value=role;
    $('#parent-fields').classList.toggle('hidden',role!=='parent');
    $('#student-fields').classList.toggle('hidden',role!=='student');
    $('#teacher-fields').classList.toggle('hidden',role!=='teacher');
    $('#learner-academic').classList.toggle('hidden',role==='teacher');
    $('#journey-title').textContent=journey[role].title;
    $('#journey-copy').textContent=journey[role].copy;
    button.textContent=journey[role].button;
    $('#form-message').classList.add('hidden');
    delete form.dataset.submissionId;
  }
  $$('.journey').forEach(b=>b.onclick=()=>{if(!submitting)setRole(b.dataset.role)});

  form.onsubmit=async e=>{
    e.preventDefault();
    if(submitting)return;
    const f=new FormData(form);
    let payload={applicant_type:role,motivation:String(f.get('motivation')||'').trim()||null,whatsapp_number:null};

    if(role==='parent')payload={...payload,full_name:String(f.get('guardianName')).trim(),email:String(f.get('guardianEmail')).trim(),phone:normalisePhone(f.get('guardianPhone')),guardian_name:String(f.get('guardianName')).trim(),guardian_email:String(f.get('guardianEmail')).trim(),guardian_phone:normalisePhone(f.get('guardianPhone')),learner_name:String(f.get('learnerName')).trim(),learner_email:String(f.get('learnerEmail')).trim()||null,date_of_birth:f.get('dateOfBirth')||null,whatsapp_number:normalisePhone(f.get('guardianPhone'))};
    if(role==='student')payload={...payload,full_name:String(f.get('studentName')).trim(),email:String(f.get('studentEmail')).trim(),phone:normalisePhone(f.get('studentPhone')),learner_name:String(f.get('studentName')).trim(),learner_email:String(f.get('studentEmail')).trim(),guardian_name:String(f.get('studentGuardianName')).trim()||null,guardian_phone:normalisePhone(f.get('studentGuardianPhone'))||null,date_of_birth:f.get('studentDob')||null,whatsapp_number:normalisePhone(f.get('studentPhone'))};
    if(role==='teacher')payload={...payload,full_name:String(f.get('teacherName')).trim(),email:String(f.get('teacherEmail')).trim(),phone:normalisePhone(f.get('teacherPhone')),whatsapp_number:normalisePhone(f.get('teacherPhone')),experience_years:f.get('experienceYears')?Number(f.get('experienceYears')):null,qualifications:String(f.get('qualifications')).trim()||null,availability_notes:String(f.get('availabilityNotes')).trim()||null,teaching_subject_ids:f.getAll('teachingSubjects'),teaching_level_ids:f.getAll('teachingLevels')};
    if(role!=='teacher')payload={...payload,curriculum_id:f.get('curriculumId')||null,academic_level_id:f.get('academicLevelId')||null,subject_ids:f.getAll('subjects'),pricing_plan_id:f.get('pricingPlanId')||null};

    if(!payload.full_name||!payload.email||!payload.phone){show('Please complete your name, email and WhatsApp number.',true);return}
    if(role!=='teacher'&&(!payload.curriculum_id||!payload.academic_level_id)){show('Please choose a curriculum and academic level.',true);return}
    if(role!=='teacher'&&!payload.subject_ids.length){show('Please choose at least one subject.',true);return}
    if(role==='teacher'&&(!payload.teaching_subject_ids.length||!payload.teaching_level_ids.length)){show('Please choose at least one teaching subject and academic level.',true);return}

    const submissionId=form.dataset.submissionId||newId();
    form.dataset.submissionId=submissionId;
    payload.id=submissionId;
    submitting=true;button.disabled=true;button.textContent='Submitting application…';show('Securely sending your application. Please do not click again.');

    try{
      const {error}=await db.from('join_applications').insert(payload);
      if(error&&error.code!=='23505')throw error;
      const ref=reference(submissionId);
      localStorage.setItem('shasha-last-application',JSON.stringify({id:submissionId,reference:ref,role,email:payload.email,submittedAt:new Date().toISOString()}));
      form.reset();delete form.dataset.submissionId;setRole(role);
      show(`Application received successfully. Reference: ${ref}. ShaSha will contact you on WhatsApp from 0719883520.`);
    }catch(error){
      const friendly=error?.code==='42501'?'The application could not be submitted because the admissions permission is still updating. Please refresh once and try again.':(error?.message||'The application could not be submitted. Please check your connection and try again.');
      show(friendly,true);
    }finally{
      submitting=false;button.disabled=false;button.textContent=journey[role].button;
    }
  };

  load();
})();