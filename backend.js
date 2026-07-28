(() => {
  'use strict';
  const form = document.getElementById('enrol-form');
  if (!form || !window.shashaDb) return;
  const stepOne = form.querySelector('.form-step[data-step="1"]');
  const phone = form.querySelector('input[name="phone"]');
  if (stepOne && phone && !form.querySelector('[name="guardianEmail"]')) {
    const label = document.createElement('label');
    label.innerHTML = 'Parent or guardian email<input name="guardianEmail" type="email" autocomplete="email" required placeholder="e.g. parent@email.com">';
    phone.closest('label').after(label);
  }
  const notes = form.querySelector('textarea[name="notes"]');
  if (notes && !form.querySelector('[name="learnerEmail"]')) {
    const label = document.createElement('label');
    label.innerHTML = 'Learner email <span style="font-weight:400;opacity:.7">(optional)</span><input name="learnerEmail" type="email" autocomplete="email" placeholder="e.g. learner@email.com">';
    notes.closest('label').before(label);
  }

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3800);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = form.querySelector('button[type="submit"]');
    const original = button?.innerHTML;
    if (button) { button.disabled = true; button.textContent = 'Submitting securely…'; }
    try {
      const fd = new FormData(form);
      const subjects = fd.getAll('subjects');
      if (!subjects.length) throw new Error('Choose at least one subject.');
      const payload = {
        guardian_name: String(fd.get('guardianName') || '').trim(),
        guardian_email: String(fd.get('guardianEmail') || '').trim().toLowerCase(),
        learner_name: String(fd.get('learnerName') || '').trim(),
        learner_email: String(fd.get('learnerEmail') || '').trim().toLowerCase() || null,
        phone: String(fd.get('phone') || '').trim(),
        academic_level: String(fd.get('level') || '').trim(),
        subjects,
        learning_device: String(fd.get('device') || '').trim(),
        notes: String(fd.get('notes') || '').trim() || null,
        consent: fd.get('consent') === 'on',
        source: 'github-pages'
      };
      if (!payload.guardian_name || !payload.guardian_email || !payload.learner_name || !payload.phone || !payload.academic_level || !payload.learning_device || !payload.consent) {
        throw new Error('Complete all required fields before submitting.');
      }
      const { data: saved, error } = await window.shashaDb.from('applications').insert(payload).select('id').single();
      if (error) throw error;
      const message = [
        'Hello ShaSha Online Academy,', '',
        'I have submitted a free trial application.', '',
        `Parent/Guardian: ${payload.guardian_name}`,
        `Learner: ${payload.learner_name}`,
        `WhatsApp: ${payload.phone}`,
        `Level: ${payload.academic_level}`,
        `Subjects: ${subjects.join(', ')}`,
        `Application reference: ${saved.id.slice(0, 8).toUpperCase()}`,
        '', 'Please confirm available timetable slots and next steps.'
      ].join('\n');
      form.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
      form.querySelector('.form-progress')?.setAttribute('hidden', '');
      const success = document.getElementById('form-success');
      success?.classList.add('active');
      const summary = document.getElementById('enrol-summary');
      if (summary) summary.textContent = message;
      const numbers = window.SHASHA_CONFIG.whatsappNumbers || [];
      document.querySelectorAll('[data-whatsapp-link]').forEach((link, index) => {
        const number = String(numbers[index]?.number || numbers[0]?.number || '').replace(/\D/g, '');
        link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      });
      showToast('Application saved securely. The academy can now review it.');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Application could not be submitted.');
    } finally {
      if (button) { button.disabled = false; button.innerHTML = original; }
    }
  }, true);
})();
