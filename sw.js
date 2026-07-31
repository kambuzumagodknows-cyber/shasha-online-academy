const CACHE = 'shasha-v40-parent-consent-safeguarding-20260731';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./config.js','./backend.js','./pdf-engine.js','./receipt-recovery.js',
  './join.html','./join.css','./join.js','./trial-enrollment.css','./trial-enrollment.js','./status.html','./status.css','./status.js','./diagnostic.html','./diagnostic.css','./diagnostic.js',
  './portal.css','./portal.js','./parent.html','./parent-app.js','./parent-pulse.css','./portal-extras.js',
  './student.html','./student-live.css','./student-app.js','./student-auth-fix.js','./student-success.css','./student-success.js',
  './teacher.html','./teacher-app.js','./teacher-marking.js','./teacher-command.css','./teacher-command.js','./payroll.html','./payroll.css','./payroll.js',
  './classroom.html','./classroom.css','./classroom.js','./passport.html','./passport.css','./passport.js','./readiness.html','./readiness.css','./readiness.js','./safeguarding.html','./safeguarding.css','./safeguarding.js',
  './notifications.html','./notifications.css','./notifications.js','./certificates.html','./certificates.css','./certificates.js','./renewals.html','./renewals.css','./renewals.js',
  './admin.html','./admin.css','./admin-app.js','./admin-nav.css','./admin-nav.js','./supabase-client.js','./class-autopilot.html','./class-autopilot.css','./class-autopilot.js',
  './intelligence.html','./intelligence.js','./admissions.html','./admissions.js','./onboarding.html','./onboarding.js','./enrollment-engine.html','./enrollment-engine.css','./enrollment-engine.js',
  './academic-settings.html','./academic-settings.css','./academic-settings.js',
  './scheduling.html','./scheduling.css','./scheduling.js','./availability.html','./availability.js','./class-launch.html','./class-launch.js',
  './operations.html','./operations.css','./operations.js','./operations-insights.js','./whatsapp-operations.js','./404.html',
  './assets/logo-mark.svg','./assets/favicon.svg','./assets/hero-learning.webp',
  './assets/student-dashboard.webp','./assets/teacher-dashboard.webp','./assets/social-preview.jpg'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});