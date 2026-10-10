const V = 'pdfreader-v5';
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', CDN + 'pdf.min.js', CDN + 'pdf.worker.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// cache dulu (instan/offline), lalu perbarui diam-diam di belakang
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !r.url.startsWith(CDN)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r.url.startsWith(CDN) ? r.url : r).then(res => { if (res.ok) c.put(r.url.startsWith(CDN) ? r.url : r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
