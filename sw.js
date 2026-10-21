const CACHE='lumi-v35';
const FILES=['./','./index.html','./styles.css','./app.js','./flappy.html','./space-runner.html','./merge9.html','./fruit-ninja.html','./silly-cat.html','./gold-miner.html','./manifest.webmanifest','./icon.svg','./assets-mascots-user.png','./assets-logo.png','./assets-home-mascot.png','./assets-gift-cards.png','./assets-game-flappy.png','./assets-game-space.png','./assets-game-fruit.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request))));
