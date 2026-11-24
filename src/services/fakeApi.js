import { API_CONFIG } from './settings.js';
import { generateInitialTasks } from './initial-data-sample.js';

const memoryCache = {
  list: null,
  listSource: 'network',
  listTimestamp: 0,
  details: new Map(),
};

function getMutations() {
  try {
    const raw = localStorage.getItem(API_CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : { created: [], updated: {}, deleted: [] };
  } catch {
    return { created: [], updated: {}, deleted: [] };
  }
}

function saveMutations(mutations) {
  localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(mutations));
  invalidateAllCaches();
}

function invalidateAllCaches() {
  memoryCache.list = null;
  memoryCache.listTimestamp = 0;
  memoryCache.details.clear();

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'INVALIDATE_API_CACHE' });
  }
}

function applyMutations(baseTasks) {
  const { created, updated, deleted } = getMutations();
  const deletedSet = new Set(deleted);

  const merged = baseTasks
    .filter((t) => !deletedSet.has(t.id))
    .map((t) => (updated[t.id] ? { ...t, ...updated[t.id] } : t));

  const createdFiltered = created.filter((t) => !deletedSet.has(t.id));
  return [...createdFiltered, ...merged];
}

export const fakeApi = {
  async getAll() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      const source = response.headers.get('X-Data-Source') === 'cache' ? 'cache' : 'network';
      const rawTasks = await response.json();
      const finalItems = applyMutations(rawTasks);

      memoryCache.list = finalItems;
      memoryCache.listSource = source;
      memoryCache.listTimestamp = Date.now();

      return { items: finalItems, source };
    } catch (err) {
      if (navigator.onLine) {
        const fallbackItems = applyMutations(generateInitialTasks());
        memoryCache.list = fallbackItems;
        memoryCache.listTimestamp = Date.now();
        return { items: fallbackItems, source: 'network' };
      }

      if (memoryCache.list) {
        return { items: [...memoryCache.list], source: 'cache' };
      }

      throw new Error('Нет подключения к интернету и кэш списка пуст.');
    }
  },

  async getById(id) {
    const mutations = getMutations();
    if (mutations.deleted.includes(id)) {
      throw new Error(`Задача "${id}" была удалена.`);
    }

    const customCreated = mutations.created.find((t) => t.id === id);
    if (customCreated) {
      return { item: { ...customCreated }, source: 'cache' };
    }

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Задача "${id}" не найдена.`);
        }
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Не удалось загрузить задачу офлайн.');
      }

      const source = response.headers.get('X-Data-Source') === 'cache' ? 'cache' : 'network';
      const rawTask = await response.json();
      const mergedItem = mutations.updated[id] ? { ...rawTask, ...mutations.updated[id] } : rawTask;

      memoryCache.details.set(id, { item: mergedItem, timestamp: Date.now() });
      return { item: mergedItem, source };
    } catch (err) {
      if (navigator.onLine && !err.message.includes('не найдена')) {
        const fallback = generateInitialTasks().find((t) => t.id === id);
        if (!fallback) throw new Error(`Задача "${id}" не найдена.`);
        const mergedItem = mutations.updated[id] ? { ...fallback, ...mutations.updated[id] } : fallback;
        return { item: mergedItem, source: 'network' };
      }

      const cached = memoryCache.details.get(id);
      if (cached) {
        return { item: cached.item, source: 'cache' };
      }

      throw err;
    }
  },

  async create(newItem) {
    const created = {
      ...newItem,
      id: `TASK-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const mutations = getMutations();
    mutations.created = [created, ...mutations.created];
    saveMutations(mutations);
    return created;
  },

  async update(id, partialData) {
    const mutations = getMutations();
    const createdIdx = mutations.created.findIndex((t) => t.id === id);

    let updatedItem;
    if (createdIdx !== -1) {
      mutations.created[createdIdx] = { ...mutations.created[createdIdx], ...partialData };
      updatedItem = mutations.created[createdIdx];
    } else {
      mutations.updated[id] = { ...(mutations.updated[id] || {}), ...partialData };
      const base = generateInitialTasks().find((t) => t.id === id) || { id };
      updatedItem = { ...base, ...mutations.updated[id] };
    }

    saveMutations(mutations);
    return updatedItem;
  },

  async remove(id) {
    const mutations = getMutations();
    mutations.created = mutations.created.filter((t) => t.id !== id);
    if (!mutations.deleted.includes(id)) {
      mutations.deleted.push(id);
    }
    saveMutations(mutations);
    return { id };
  },

  async resetData() {
    localStorage.removeItem(API_CONFIG.STORAGE_KEY);
    invalidateAllCaches();
    const { items } = await this.getAll();
    return items;
  },
};
