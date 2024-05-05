const urlsToCache = [
  "./",
  "/styles/main.css",
  "./scripts/main.js",
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
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        clone.arrayBuffer().then((buffer) => {
          const dbRequest = indexedDB.open("eftelingEchoesAudio", 1);
          dbRequest.onupgradeneeded = () =>
            dbRequest.result.createObjectStore("audioFiles");
          dbRequest.onsuccess = () => {
            const tx = dbRequest.result.transaction("audioFiles", "readwrite");
            tx.objectStore("audioFiles").put(buffer, request.url);
          };
        });
        return response;
      })
      .catch(() => {
        const dbRequest = indexedDB.open("eftelingEchoesAudio", 1);
        dbRequest.onsuccess = () => {
          const tx = dbRequest.result.transaction("audioFiles");
          const request = tx.objectStore("audioFiles").get(request.url);
          request.onsuccess = () => {
            if (request.result) return new Response(request.result);
            else return fetch(event.request);
          };
        };
      });
  }
});
