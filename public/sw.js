const CACHE_VERSION = 'v1';
const STATIC_CACHE = `devtask-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `devtask-media-${CACHE_VERSION}`;
const API_CACHE = `devtask-api-${CACHE_VERSION}`;
const VISITED_PAGES_CACHE = `devtask-pages-${CACHE_VERSION}`;

const MAX_MEDIA_ENTRIES = 40;
const MAX_API_ENTRIES = 50;
const API_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours offline retention

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Generate deterministic initial tasks for public API endpoint
function buildSeedTasks() {
  const categories = ['Frontend', 'Backend', 'DevOps', 'Database', 'Security', 'QA & Testing'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Testing', 'Completed'];
  const assignees = ['Medeu Seidali', 'Alexey Smirnov', 'Elena Rostova', 'Dmitry Kim', 'Anna Volkova'];
  const titles = [
    'Refactor OAuth2 authentication flow',
    'Optimize PostgreSQL indexing for user queries',
    'Implement dark mode toggle in navbar',
    'Fix memory leak in websocket listener',
    'Upgrade React to version 18.3',
    'Set up CI/CD pipeline in GitHub Actions',
    'Add rate limiting to public REST endpoints',
    'Design interactive dashboard charts',
    'Audit npm dependencies for security vulnerabilities',
    'Configure Redis caching layer for API'
  ];

  const tasks = [];
  for (let i = 1; i <= 100; i++) {
    tasks.push({
      id: `TASK-${1000 + i}`,
      title: `${titles[i % titles.length]} #${i}`,
      category: categories[i % categories.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      assignee: assignees[i % assignees.length],
      estimatedHours: (i % 8) + 2,
      createdAt: new Date(Date.now() - i * 3600000 * 12).toISOString().split('T')[0],
      description: `Detailed documentation for TASK-${1000 + i}: Ensure full test coverage, handle edge cases, and verify accessibility compliance. Needs review by ${assignees[i % assignees.length]}.`
    });
  }
  return tasks;
}

// Trim cache to prevent unlimited growth
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const excess = keys.length - maxEntries;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Check if request belongs to Auth / Private data (MUST NOT be cached)
function isAuthOrPrivateRequest(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.has('Authorization')) return true;

  const blockedHosts = [
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'accounts.google.com',
    'www.googleapis.com',
    'firebaseinstallations.googleapis.com'
  ];
  if (blockedHosts.some((host) => url.hostname.includes(host))) return true;
  if (url.pathname.startsWith('/profile') || url.pathname.startsWith('/api/auth')) return true;

  return false;
}

// INSTALL: Pre-cache app shell + built JS/CSS assets discovered from index.html
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);

      try {
        const htmlResponse = await fetch('/index.html', { cache: 'no-store' });
        if (htmlResponse.ok) {
          const htmlText = await htmlResponse.text();
          const assetMatches = htmlText.match(/\/assets\/[^"'\s)]+\.(js|css)/g) || [];
          const uniqueAssets = [...new Set(assetMatches)];
          if (uniqueAssets.length > 0) {
            await cache.addAll(uniqueAssets);
          }
        }
      } catch (err) {
        // Fallback if offline during install
      }

      const pagesCache = await caches.open(VISITED_PAGES_CACHE);
      await pagesCache.put(new Request('/'), new Response('visited'));
      await pagesCache.put(new Request('/tasks'), new Response('visited'));
      await pagesCache.put(new Request('/offline'), new Response('visited'));
    })()
  );
});

// ACTIVATE: Clean up outdated versioned caches and claim clients
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, MEDIA_CACHE, API_CACHE, VISITED_PAGES_CACHE];
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// MESSAGE: Handle update activation & API cache invalidation
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'INVALIDATE_API_CACHE') {
    caches.delete(API_CACHE);
  }
});

// STRATEGY 1: Cache-First (for static assets, JS/CSS bundles, images, icons, fonts)
async function cacheFirstStrategy(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
      await cache.put(request, networkResponse.clone());
      if (maxEntries) {
        await trimCache(cacheName, maxEntries);
      }
    }
    return networkResponse;
  } catch (err) {
    return new Response('', { status: 408, statusText: 'Offline asset unavailable' });
  }
}

// STRATEGY 2: Network-First for public API requests (/api/tasks & /api/tasks/:id)
async function networkFirstApiStrategy(request, url) {
  const cache = await caches.open(API_CACHE);

  try {
    const pingResponse = await fetch(`/manifest.json?sw_ping=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!pingResponse.ok) {
      throw new Error('Network unreachable');
    }

    const allTasks = buildSeedTasks();
    let payload;

    if (url.pathname === '/api/tasks') {
      payload = allTasks;
    } else {
      const taskId = decodeURIComponent(url.pathname.replace('/api/tasks/', ''));
      const found = allTasks.find((t) => t.id === taskId);
      if (!found) {
        return new Response(JSON.stringify({ error: `Task ${taskId} not found` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      payload = found;
    }

    const cachedHeaders = {
      'Content-Type': 'application/json',
      'X-Data-Source': 'cache',
      'X-Cached-At': Date.now().toString()
    };

    await cache.put(
      request,
      new Response(JSON.stringify(payload), { status: 200, headers: cachedHeaders })
    );
    await trimCache(API_CACHE, MAX_API_ENTRIES);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'network',
        'X-Cached-At': Date.now().toString()
      }
    });
  } catch (err) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cachedAt = Number(cachedResponse.headers.get('X-Cached-At') || 0);
      if (!cachedAt || Date.now() - cachedAt < API_MAX_AGE_MS) {
        return cachedResponse;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Offline: No cached data available for this request.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'offline-error' }
      }
    );
  }
}

// NAVIGATION: Serve visited pages offline, otherwise redirect to /offline
async function handleNavigationRequest(request, url) {
  const staticCache = await caches.open(STATIC_CACHE);
  const pagesCache = await caches.open(VISITED_PAGES_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await staticCache.put('/index.html', networkResponse.clone());
      await pagesCache.put(new Request(url.pathname), new Response('visited'));
      return networkResponse;
    }
    throw new Error('Navigation response not ok');
  } catch (err) {
    if (url.pathname === '/offline') {
      const offlineShell = await staticCache.match('/index.html');
      return offlineShell || new Response('Offline', { status: 503 });
    }

    const wasVisited = await pagesCache.match(new Request(url.pathname));
    if (wasVisited) {
      const cachedShell = await staticCache.match('/index.html');
      if (cachedShell) return cachedShell;
    }

    return Response.redirect('/offline', 302);
  }
}

// FETCH INTERCEPTOR
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isAuthOrPrivateRequest(request, url)) {
    return;
  }

  // 1. Public API requests -> Network-First strategy
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/tasks')) {
    event.respondWith(networkFirstApiStrategy(request, url));
    return;
  }

  // 2. Navigation requests -> App Shell with /offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request, url));
    return;
  }

  // 3. Built JS/CSS app shell assets -> Cache-First in STATIC_CACHE
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || PRECACHE_URLS.includes(url.pathname))
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // 4. Images, icons, and fonts -> Cache-First in MEDIA_CACHE with entry cap
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirstStrategy(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES));
    return;
  }
});
