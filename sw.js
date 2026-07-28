const CACHE = 'shasha-v7-live-student-20260728';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./config.js','./backend.js',
  './portal.css','./portal.js','./teacher.html','./parent.html',
  './student.html','./student-live.css','./student-app.js',
  './admin.html','./admin.css','./admin-app.js','./supabase-client.js',
  './academic-settings.html','./academic-settings.css','./academic-settings.js',
  './scheduling.html','./scheduling.css','./scheduling.js','./404.html',
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