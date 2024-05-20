const urlsToCache = [
  "./",
  "./styles/main.css",
  "./scripts/main.js",
  "./scripts/audioManagement.js",
  "./scripts/locationManagement.js",
  "./images/logos/logo.png",
  "./images/logos/bigLogo.png",
  "./images/logos/smallLogo.png",
  "./images/icons/undefined.png",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("eftelingEchoesStatic")
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (
    request.url.endsWith(".html") ||
    request.url.endsWith(".css") ||
    request.url.endsWith(".js") ||
    request.url.endsWith("ogo.png")
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else if (request.url.endsWith("rideslist.json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If the response is valid, cache it for future use
          const responseClone = response.clone();
          caches.open("eftelingEchoesRidesData").then((cache) => {
            // Delete old cache before saving the new one
            cache.delete(request);
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch((error) => {
          // Attempt to fetch from cache if network is down
          return caches.match(request).then((response) => {
            return response || fetch(event.request);
          });
        })
    );
  } else if (
    request.url.endsWith(".png") &&
    !request.url.endsWith("undefined.png")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If the response is valid, cache it for future use
          const responseClone = response.clone();
          caches.open("eftelingEchoesStoredFiles").then((cache) => {
            // Delete old cache before saving the new one
            cache.delete(request);
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch((error) => {
          // Attempt to fetch from cache if network is down
          return caches.match(request).then((response) => {
            return response || fetch(event.request);
          });
        })
    );
  } else if (request.url.endsWith(".wav")) {
    event.respondWith(
      (async function () {
        const db = await new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open("eftelingEchoesAudio", 1);
          dbRequest.onupgradeneeded = () =>
            dbRequest.result.createObjectStore("audioFiles", {
              keyPath: "url",
            });
          dbRequest.onsuccess = () => resolve(dbRequest.result);
          dbRequest.onerror = () => reject(dbRequest.error);
        });

        const tx = db.transaction("audioFiles", "readwrite");
        const store = tx.objectStore("audioFiles");
        let audioBuffer = await store.get(request.url);

        if (!audioBuffer) {
          const response = await fetch(request);
          audioBuffer = await response.arrayBuffer();
          await store.put({ url: request.url, data: audioBuffer });
        }

        return new Response(audioBuffer, {
          headers: { "Content-Type": "audio/wav" },
        });
      })()
    );
  }
});
