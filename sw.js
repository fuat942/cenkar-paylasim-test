self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    event.request.method === 'POST' &&
    url.pathname.endsWith('/share-target')
  ) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('file');

          if (file && file.type.startsWith('image/')) {
            const db = await new Promise((resolve, reject) => {
              const request = indexedDB.open('cenkar_share_test', 1);

              request.onupgradeneeded = () => {
                request.result.createObjectStore('files', {
                  keyPath: 'id'
                });
              };

              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });

            await new Promise((resolve, reject) => {
              const transaction = db.transaction(
                'files',
                'readwrite'
              );

              transaction
                .objectStore('files')
                .put({
                  id: 'latest',
                  name: file.name || 'teslim-formu.jpg',
                  blob: file
                });

              transaction.oncomplete = resolve;
              transaction.onerror = () => reject(transaction.error);
            });
          }

          return Response.redirect('./', 303);

        } catch (error) {
          return new Response(
            'Fotoğraf alınamadı: ' + error,
            {
              status: 500,
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              }
            }
          );
        }
      })()
    );
  }
});
