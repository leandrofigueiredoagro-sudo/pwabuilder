const CACHE_NAME = 'pesagem-v2'; // Nova versão do cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // URLs de bibliotecas e recursos
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://placehold.co/180x180/green/white?text=LF',
  'https://placehold.co/32x32/green/white?text=LF',
  'https://placehold.co/16x16/green/white?text=LF',
  'https://placehold.co/192x192/green/white?text=LF',
  'https://placehold.co/512x512/green/white?text=LF'
];

self.addEventListener('install', event => {
  // Aconselha o Service Worker a esperar a instalação
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto e populado');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força a ativação do novo Service Worker
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Ativado');
  // Remove caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim(); // Reivindica o controle imediato sobre os clientes
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o cache se ele for encontrado
        if (response) {
          console.log(`Service Worker: Servindo do cache: ${event.request.url}`);
          return response;
        }

        // Se não, busca na rede
        console.log(`Service Worker: Buscando na rede: ${event.request.url}`);
        return fetch(event.request).then(
          response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para que possamos colocá-la no cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(error => {
          // Captura erros de rede (offline)
          console.error('Service Worker: Falha ao buscar na rede. Não há cache para este arquivo.', error);
          // Opcionalmente, pode retornar uma página de fallback
        });
      })
  );
});