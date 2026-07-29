const CACHE = 'shasha-v21-availability-conflict-details-20260729';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./config.js','./backend.js',
  './join.html','./join.css','./join.js',
  './portal.css','./portal.js','./parent.html','./parent-app.js','./portal-extras.js',
  './student.html','./student-live.css','./student-app.js',
  './teacher.html','./teacher-app.js','./teacher-marking.js',
  './admin.html','./admin.css','./admin-app.js','./admin-nav.css','./admin-nav.js','./supabase-client.js',
  './admissions.html','./admissions.js','./onboarding.html','./onboarding.js',
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