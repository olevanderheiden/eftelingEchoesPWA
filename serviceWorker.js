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
        const cache = await caches.open("eftelingEchoesAudio");
        let response = await cache.match(request);

        if (!response) {
          response = await fetch(request);
          cache.put(request, response.clone());
        }

        if (request.headers.has("range")) {
          const range = request.headers
            .get("range")
            .replace(/bytes=/, "")
            .split("-");
          const start = range[0] ? parseInt(range[0], 10) : 0;
          const end = range[1] ? parseInt(range[1], 10) : response.size - 1;

          if (start >= response.size) {
            return new Response("", {
              status: 416,
              headers: { "Content-Range": `bytes */${response.size}` },
            });
          }

          const contentLength = end - start + 1;
          return new Response(response.slice(start, end + 1), {
            status: 206,
            headers: {
              "Content-Range": `bytes ${start}-${end}/${response.size}`,
              "Content-Length": contentLength,
              "Content-Type": "audio/wav",
            },
          });
        }

        return response;
      })()
    );
  }
});
