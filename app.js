(() => {
  'use strict';

  const config = window.SHASHA_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const toast = $('#toast');
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  const menuButton = $('.menu-toggle');
  const navMenu = $('#nav-menu');
  menuButton?.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  $$('#nav-menu a').forEach((link) => link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const modal = $('#role-modal');
  const setModal = (open) => {
    if (!modal) return;
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('.modal-close', modal)?.focus();
  };
  $$('[data-role-modal]').forEach((button) => button.addEventListener('click', () => setModal(true)));
  $$('[data-close-modal]').forEach((button) => button.addEventListener('click', () => setModal(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setModal(false);
  });

  const portalData = {
    student: {
      index: '01 / STUDENT',
      url: 'student.shashaacademy.com',
      image: 'assets/student-dashboard.webp',
      alt: 'ShaSha student portal dashboard preview',
      title: 'Everything a learner needs—without the clutter.',
      description: 'Students see their timetable, live lessons, assignments, subjects, progress, results and teacher messages in one focused dashboard.',
      items: ['Join live classes in one click', 'Track assignments and deadlines', 'See results and subject progress', 'Ask teachers for support'],
      href: 'student.html',
      label: 'Open student portal demo'
    },
    teacher: {
      index: '02 / TEACHER',
      url: 'teacher.shashaacademy.com',
      image: 'assets/teacher-dashboard.webp',
      alt: 'ShaSha teacher portal dashboard preview',
      title: 'Teach, organise and measure real impact.',
      description: 'Teachers manage classes, attendance, assignments, results, resources and communication from a single structured workspace.',
      items: ['See the full teaching timetable', 'Launch live classes and resources', 'Review assignments and capture results', 'Track student and class performance'],
      href: 'teacher.html',
      label: 'Open teacher portal demo'
    },
    parent: {
      index: '03 / PARENT',
      url: 'parent.shashaacademy.com',
      image: 'assets/student-dashboard.webp',
      alt: 'ShaSha parent portal experience preview',
      title: 'Visibility without micromanaging the learner.',
      description: 'Parents get a clear summary of attendance, progress, results, notices, payments and teacher communication.',
      items: ['Monitor attendance and study consistency', 'View results and subject trends', 'Receive notices and payment updates', 'Communicate with the academy'],
      href: 'parent.html',
      label: 'Open parent portal demo'
    },
    admin: {
      index: '04 / ADMIN',
      url: 'admin.shashaacademy.com',
      image: 'assets/teacher-dashboard.webp',
      alt: 'ShaSha administration portal preview',
      title: 'Run the academy from one control centre.',
      description: 'Administrators control user approvals, classes, master timetables, teacher allocation, payments and operational reporting.',
      items: ['Approve teachers and learners', 'Build conflict-free master timetables', 'Manage subjects, classes and payments', 'Review academy-wide performance'],
      href: 'admin.html',
      label: 'Open admin portal demo'
    }
  };

  const portalImage = $('#portal-image');
  const portalUrl = $('#portal-url');
  const portalCopy = $('#portal-copy');
  $$('.portal-tab').forEach((tab) => tab.addEventListener('click', () => {
    const key = tab.dataset.portal;
    const data = portalData[key];
    if (!data || !portalCopy || !portalImage) return;

    $$('.portal-tab').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    portalImage.classList.add('switching');
    setTimeout(() => {
      portalImage.src = data.image;
      portalImage.alt = data.alt;
      if (portalUrl) portalUrl.textContent = data.url;
      portalCopy.innerHTML = `
        <span class="portal-index">${data.index}</span>
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <ul>${data.items.map((item) => `<li>${item}</li>`).join('')}</ul>
        <a class="button button-primary" href="${data.href}">${data.label} <span>↗</span></a>`;
      portalImage.classList.remove('switching');
    }, 130);
  }));

  const form = $('#enrol-form');
  const progressBars = $$('.form-progress span', form || document);
  const formSteps = $$('.form-step', form || document);
  const successPanel = $('#form-success');
  let currentStep = 1;

  const setStep = (step) => {
    currentStep = Math.max(1, Math.min(3, step));
    formSteps.forEach((item) => item.classList.toggle('active', Number(item.dataset.step) === currentStep));
    progressBars.forEach((bar, index) => bar.classList.toggle('active', index < currentStep));
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validateStep = (step) => {
    const panel = $(`.form-step[data-step="${step}"]`, form);
    if (!panel) return true;
    const required = $$('[required]', panel);
    let valid = true;
    required.forEach((field) => {
      field.classList.remove('invalid');
      if ((field.type === 'checkbox' && !field.checked) || (field.type !== 'checkbox' && !String(field.value).trim())) {
        field.classList.add('invalid');
        valid = false;
      }
    });
    if (step === 2 && !$$('input[name="subjects"]:checked', panel).length) {
      showToast('Choose at least one subject.');
      return false;
    }
    if (!valid) showToast('Complete the highlighted fields before continuing.');
    return valid;
  };

  $$('[data-next-step]', form || document).forEach((button) => button.addEventListener('click', () => {
    if (validateStep(currentStep)) setStep(currentStep + 1);
  }));
  $$('[data-prev-step]', form || document).forEach((button) => button.addEventListener('click', () => setStep(currentStep - 1)));
  $$('input, select, textarea', form || document).forEach((field) => field.addEventListener('input', () => field.classList.remove('invalid')));

  const buildMessage = (data, subjects) => [
    `Hello ${config.academyName || 'ShaSha Online Academy'},`,
    '',
    'I would like to reserve a free trial place.',
    '',
    `Parent/Guardian: ${data.guardianName}`,
    `Learner: ${data.learnerName}`,
    `WhatsApp: ${data.phone}`,
    `Level: ${data.level}`,
    `Subjects: ${subjects.join(', ')}`,
    `Learning device: ${data.device}`,
    `Notes: ${data.notes || 'None'}`,
    '',
    'Please confirm available timetable slots and the next steps.'
  ].join('\n');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const subjects = formData.getAll('subjects');
    if (!subjects.length) {
      setStep(2);
      showToast('Choose at least one subject.');
      return;
    }

    const message = buildMessage(data, subjects);
    const record = { ...data, subjects, message, submittedAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('shasha-enrolments') || '[]');
    existing.push(record);
    localStorage.setItem('shasha-enrolments', JSON.stringify(existing.slice(-20)));

    formSteps.forEach((step) => step.classList.remove('active'));
    $('.form-progress', form)?.setAttribute('hidden', '');
    successPanel?.classList.add('active');
    const summary = $('#enrol-summary');
    if (summary) summary.textContent = message;

    const configuredNumbers = Array.isArray(config.whatsappNumbers) && config.whatsappNumbers.length
      ? config.whatsappNumbers.map((item) => String(item.number || '').replace(/\D/g, '')).filter(Boolean)
      : [String(config.whatsappNumber || '').replace(/\D/g, '')].filter(Boolean);

    $$('[data-whatsapp-link]').forEach((link, index) => {
      const number = configuredNumbers[index] || configuredNumbers[0] || '';
      const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
      link.href = `${base}?text=${encodeURIComponent(message)}`;
    });
    showToast('Enrolment summary created successfully. Choose either WhatsApp number.');
  });

  $('#reset-form')?.addEventListener('click', () => {
    form.reset();
    successPanel?.classList.remove('active');
    $('.form-progress', form)?.removeAttribute('hidden');
    setStep(1);
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((element) => observer.observe(element));
  } else {
    $$('.reveal').forEach((element) => element.classList.add('visible'));
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
