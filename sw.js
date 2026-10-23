// Service Worker der iPhone-Version: App offline verfügbar machen, Dateien aus dem Gerät liefern.
const VERSION = '1.5.1-mvlbw1b5';
const APP_CACHE = `orbit-app-${VERSION}`;
const FILE_CACHE = 'orbit-files';
const EXT_CACHE = 'orbit-ext';
const PRECACHE = ["/","/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","/inter-greek-ext-wght-normal-DlzME5K_.woff2","/inter-greek-wght-normal-CkhJZR-_.woff2","/inter-vietnamese-wght-normal-CBcvBZtf.woff2","/inter-cyrillic-wght-normal-DqGufNeO.woff2","/inter-latin-ext-wght-normal-DO1Apj_S.woff2","/inter-latin-wght-normal-Dx4kXJAl.woff2","/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2","/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2","/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2","/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2","/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2","/index-C6V_nUJ3.css","/index-B8JPb8N-.js","/Home-B2Ls5n8r.js","/Notes-BmEAaGkR.js","/Vault-CvKPJA6D.js","/useLocalStorage-CGbs32LU.js","/Watch-MFFwtXtK.js","/tmdb-lK4xF0eb.js","/Fitness-BoAn7zJq.js","/Fuel-XEHZDgF-.js","/Costs-BW6HXYme.js","/trending-up-D1xj1pWY.js","/TripDetail-CnZG5n06.js","/arrow-left-D-X1VIVo.js","/settings-DZ9UCt5D.js","/Cloud-CRmZkqFh.js","/download-B0aQiSI-.js","/file-text-DfuTxZ4F.js","/Videos-_Sh0A1ms.js","/WhatsNew-K6C3w_9T.js","/clapperboard-CoijeoDG.js","/scale-B9vNQ4HM.js","/wallet-TRRK0vLZ.js","/Trips-CyyNrL9f.js","/TripForm-BzvjFLrC.js","/Calendar-CECmX3de.js","/useAppSetting-BX7KNCWA.js","/addDays-Cia3DZdY.js","/map-pin-DO_8cxSP.js","/lock-CKiX047g.js","/Memories-D0dF3nUu.js","/external-link-D2FIPwdo.js","/images-BeizuTIf.js","/UploadField-DSXyWq2z.js","/upload-BVbzow2E.js","/chevron-left-CrpXpRWy.js","/chevron-right-ChmZXAbf.js","/pencil-C7lbr-3c.js","/trash-I69gOTKe.js","/useForm-DMM3D1fm.js","/plus-D5GQk-_U.js","/useHighlight-BbNKMOHa.js","/index-CEK0yPDb.js","/jspdf.plugin.autotable-DXDSoqSE.js","/jspdf.es.min-DugJrkng.js","/html2canvas.esm-QH1iLAAe.js","/purify.es-BwoZCkIS.js","/index.es-B9NeLWb1.js","/icon.svg","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/manifest.webmanifest"];

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
