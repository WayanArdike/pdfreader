const V = 'pdfreader-v8';
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const INDEX = new URL('./index.html', self.location).href;
const CORE = [INDEX, new URL('./manifest.webmanifest', self.location).href, new URL('./icon-192.png', self.location).href, new URL('./icon-512.png', self.location).href, CDN + 'pdf.min.js', CDN + 'pdf.worker.min.js'];

// respons hasil redirect tidak boleh dipakai untuk navigasi -> bersihkan dulu
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener('install', e => {
  // satu file gagal (mis. CDN) tidak membatalkan instalasi
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.allSettled(CORE.map(async u => { const r = await fetch(u); if (r.ok) await c.put(u, await clean(r)); }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// cache dulu (instan/offline), perbarui diam-diam di belakang; tidak pernah mengembalikan undefined
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url), cdn = r.url.startsWith(CDN);
  if (u.origin !== self.location.origin && !cdn) return;
  const nav = r.mode === 'navigate';
  const key = nav ? INDEX : r.url;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(key, { ignoreSearch: true });
    const upd = fetch(nav ? r : r.url).then(async res => { if (res.ok) await c.put(key, await clean(res.clone())); return res; }).catch(() => null);
    if (hit) { e.waitUntil(upd); return hit; }
    return (await upd) || Response.error();
  })());
});
