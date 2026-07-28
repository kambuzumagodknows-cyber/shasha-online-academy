(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const sidebar = $('.sidebar');
  const backdrop = $('.drawer-backdrop');
  const menu = $('.mobile-menu');
  const title = $('.page-title');
  const subtitle = $('.page-subtitle');
  const toast = $('.portal-toast');
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  };

  const closeDrawer = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('open');
  };
  menu?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    backdrop?.classList.toggle('open');
  });
  backdrop?.addEventListener('click', closeDrawer);


  const openPage = (page) => {
    const button = $(`.sidebar-nav button[data-page="${page}"]`);
    const target = $(`.portal-page[data-page="${page}"]`);
    if (!button || !target) {
      showToast('That module is queued for the backend phase.');
      return;
    }
    $$('.sidebar-nav button').forEach((item) => item.classList.remove('active'));
    $$('.portal-page').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    target.classList.add('active');
    if (title) title.textContent = button.dataset.title || button.textContent.trim();
    if (subtitle) subtitle.textContent = button.dataset.subtitle || 'ShaSha Online Academy';
    closeDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  $$('.sidebar-nav button').forEach((button) => button.addEventListener('click', () => {
    const page = button.dataset.page;
    if (!$(`.portal-page[data-page="${page}"]`)) {
      showToast(`${button.textContent.trim()} is queued for the backend phase.`);
      return;
    }
    openPage(page);
  }));

  $$('[data-page-link]').forEach((button) => button.addEventListener('click', () => openPage(button.dataset.pageLink)));

  const dialog = $('.dialog');
  const dialogTitle = $('#dialog-title');
  const dialogText = $('#dialog-text');
  const dialogConfirm = $('#dialog-confirm');
  const setDialog = (open, data = {}) => {
    if (!dialog) return;
    if (open) {
      if (dialogTitle) dialogTitle.textContent = data.title || 'Action preview';
      if (dialogText) dialogText.textContent = data.text || 'This action will connect to the live backend in the next phase.';
      if (dialogConfirm) dialogConfirm.textContent = data.confirm || 'Continue demo';
    }
    dialog.classList.toggle('open', open);
    dialog.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  $$('[data-dialog]').forEach((button) => button.addEventListener('click', () => setDialog(true, {
    title: button.dataset.dialogTitle,
    text: button.dataset.dialogText,
    confirm: button.dataset.dialogConfirm
  })));
  $$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => setDialog(false)));
  dialogConfirm?.addEventListener('click', () => {
    setDialog(false);
    showToast('Demo action completed. Live data connection comes next.');
  });
  document.addEventListener('keydown', (event) => event.key === 'Escape' && setDialog(false));

  $$('[data-demo-action]').forEach((button) => button.addEventListener('click', () => {
    showToast(button.dataset.demoAction || 'Demo action completed.');
    if (button.dataset.completeTarget) {
      const target = document.getElementById(button.dataset.completeTarget);
      target?.classList.add('completed');
      const status = $('.status', target);
      if (status) {
        status.textContent = 'Completed';
        status.className = 'status green';
      }
    }
  }));

  const currentDate = $('#portal-date');
  if (currentDate) currentDate.textContent = new Intl.DateTimeFormat('en-ZW', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
})();
