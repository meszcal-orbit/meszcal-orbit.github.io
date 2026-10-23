// Service Worker der iPhone-Version: App offline verfügbar machen, Dateien aus dem Gerät liefern.
const VERSION = '1.5.0-mvkk9187';
const APP_CACHE = `orbit-app-${VERSION}`;
const FILE_CACHE = 'orbit-files';
const EXT_CACHE = 'orbit-ext';
const PRECACHE = ["/","/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","/inter-cyrillic-wght-normal-DqGufNeO.woff2","/inter-greek-ext-wght-normal-DlzME5K_.woff2","/inter-greek-wght-normal-CkhJZR-_.woff2","/inter-vietnamese-wght-normal-CBcvBZtf.woff2","/inter-latin-ext-wght-normal-DO1Apj_S.woff2","/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2","/inter-latin-wght-normal-Dx4kXJAl.woff2","/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2","/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2","/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2","/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2","/index-DZ3FQiIO.css","/index-C1bBgzKt.js","/Home-B5CwyZj0.js","/Notes-CdntKAZJ.js","/Vault-pHbZTKlK.js","/useLocalStorage-BXtFavs2.js","/Watch-BZQsOprF.js","/tmdb-lK4xF0eb.js","/Fitness-C_V93uIi.js","/Fuel-CfEpiAzZ.js","/Costs-BIF5kBAy.js","/trending-up-CYo6GOq2.js","/TripDetail-_1arULQI.js","/arrow-left-BUpfS710.js","/settings-BLKL7Nu9.js","/Cloud-BXi-l1eU.js","/download-b6Rwjl1W.js","/file-text-ChudYZ3X.js","/Videos-Dw2PBatD.js","/WhatsNew-FZIlvbDT.js","/clapperboard-03YKrRDx.js","/scale-lkWpnbuZ.js","/wallet-8ogwn1Ls.js","/Trips-Dap_55bp.js","/TripForm-DTyq1B2-.js","/Calendar-CDFbex18.js","/useAppSetting-D8LInxnl.js","/addDays-DQnycxsC.js","/switch-Bdi6nfsF.js","/map-pin-Do3d247I.js","/lock-Bb07Vzuw.js","/Memories-wVPfyVna.js","/external-link-T2Qyvb5w.js","/images-D9tKlOKb.js","/UploadField-mvlKx6u2.js","/upload-5uQMQPCH.js","/chevron-left-CykUnSUf.js","/chevron-right-CzEuZyFo.js","/pencil-Cd5-MFGC.js","/trash-C2i0QN8b.js","/useForm-BiiVKqtC.js","/plus-y9LVtIXS.js","/useHighlight-BkkjWqXP.js","/index-CwsFdRz7.js","/jspdf.plugin.autotable-Bnoaet_d.js","/jspdf.es.min-cTrfXK95.js","/html2canvas.esm-QH1iLAAe.js","/purify.es-BwoZCkIS.js","/index.es-muyBE10p.js","/icon.svg","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/manifest.webmanifest"];

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
