const CACHE_NAME = 'ironforge-designer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/metadata.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/types.ts',
  '/src/constants.ts',
  '/src/components/ConfiguratorPanel.tsx',
  '/src/components/PreviewPanel.tsx',
  '/src/components/QuotePanel.tsx',
  '/src/components/Icons.tsx',
  '/src/components/SearchableSelect.tsx',
  '/src/utils/calculator.ts',
  '/src/services/geminiService.ts',
  '/src/services/pdfService.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;500;700&display=swap',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/',
  'https://aistudiocdn.com/react@^19.1.1/',
  'https://aistudiocdn.com/@google/genai@^1.21.0',
  'https://aistudiocdn.com/jspdf@^3.0.3',
  'https://aistudiocdn.com/html2canvas@^1.4.1',
  'https://aistudiocdn.com/jspdf-autotable@^5.0.2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        
        const localUrls = urlsToCache.filter(url => !url.startsWith('http'));
        const remoteUrls = urlsToCache.filter(url => url.startsWith('http'));

        const cachePromises = [
            cache.addAll(localUrls).catch(err => {
                console.warn('Failed to cache local URLs:', err);
            })
        ];

        remoteUrls.forEach(url => {
            const request = new Request(url, { mode: 'no-cors' });
            cachePromises.push(
                fetch(request).then(response => {
                    if (response.status === 200 || response.type === 'opaque') {
                        return cache.put(url, response);
                    }
                    console.warn(`Failed to cache remote URL (status ${response.status}): ${url}`);
                    return Promise.resolve();
                }).catch(err => {
                    console.warn(`Failed to fetch and cache remote URL: ${url}`, err);
                })
            );
        });
        
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            if (!response || (response.status !== 200 && response.type !== 'opaque')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});