// Service Worker der iPhone-Version: App offline verfügbar machen, Dateien aus dem Gerät liefern.
const VERSION = '1.5.0-mvkgeprl';
const APP_CACHE = `orbit-app-${VERSION}`;
const FILE_CACHE = 'orbit-files';
const EXT_CACHE = 'orbit-ext';
const PRECACHE = ["/","/assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","/assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","/assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","/assets/inter-greek-wght-normal-CkhJZR-_.woff2","/assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2","/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","/assets/inter-latin-wght-normal-Dx4kXJAl.woff2","/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2","/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2","/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2","/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2","/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2","/assets/index-Bn8f_qEx.css","/assets/index-CaE79RxK.js","/assets/Home-CWVp-klO.js","/assets/Notes-CWPWddXS.js","/assets/Vault-NnQGp55S.js","/assets/useLocalStorage-BwBvLRxw.js","/assets/Watch-C2RCG1EH.js","/assets/tmdb-lK4xF0eb.js","/assets/Fitness-B--VI55-.js","/assets/Fuel-DCwVk5Bo.js","/assets/Costs-B_Bi05dr.js","/assets/trending-up-oWPBE1Hd.js","/assets/TripDetail-C9DuKnlH.js","/assets/arrow-left-BcRvpf0U.js","/assets/settings-Ba8nZuHg.js","/assets/Cloud-DjCl3U_5.js","/assets/download-BPLAEwz4.js","/assets/file-text-CZmasfpv.js","/assets/Videos-0PclSStu.js","/assets/WhatsNew-esBK6DjL.js","/assets/clapperboard-DMuIifxW.js","/assets/scale-B4BGurwk.js","/assets/wallet-B85KVcmP.js","/assets/Trips-DImAEgNh.js","/assets/TripForm-7RObRMzo.js","/assets/Calendar-BcNij5tE.js","/assets/useAppSetting-BBwECrv2.js","/assets/addDays-BM9pKlq2.js","/assets/switch-B5FAcsEc.js","/assets/map-pin-DCHTwYMe.js","/assets/lock-CoIEx07x.js","/assets/Memories-DAIsnquf.js","/assets/external-link-CxbNw5Ne.js","/assets/images-XmAM5Va4.js","/assets/UploadField-B7n0_8y_.js","/assets/upload-CY0L03ZP.js","/assets/chevron-left-Dvf-WC4I.js","/assets/chevron-right-o2f0D069.js","/assets/pencil-C6LS5gSv.js","/assets/trash-CIxcxxlF.js","/assets/useForm-BOqrZnTi.js","/assets/plus-Cl4cNdPP.js","/assets/useHighlight-DamCD6HF.js","/assets/index-CqcK8rAo.js","/assets/jspdf.plugin.autotable-zPnIe173.js","/assets/jspdf.es.min-D67iVlHq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/purify.es-BwoZCkIS.js","/assets/index.es-C4a0M49H.js","/icon.svg","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('orbit-app-') && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Eigene Dateien (Uploads, importierte Bilder) liegen nur im Gerät
    if (url.pathname.startsWith('/files/')) {
      event.respondWith(caches.open(FILE_CACHE).then((c) => c.match(url.pathname)).then((r) => r || new Response('Datei nicht im Gerät', { status: 404 })));
      return;
    }
    // Seitenaufrufe immer mit der App beantworten (Single-Page-App)
    if (req.mode === 'navigate') {
      event.respondWith(caches.match('/', { cacheName: APP_CACHE }).then((r) => r || fetch(req)));
      return;
    }
    event.respondWith(caches.match(req, { cacheName: APP_CACHE }).then((r) => r || fetch(req)));
    return;
  }

  // Fremde Bilder (Poster, Vorschaubilder): einmal geladen, danach auch offline
  if (req.destination === 'image') {
    event.respondWith(
      caches.open(EXT_CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
  }
});
