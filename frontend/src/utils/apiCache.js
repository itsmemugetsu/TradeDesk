export function createCache(defaultTtl = 5 * 60 * 1000) {
  const cache = new Map(); // Encapsulated in closure

  return {
    get(key) {
      const cached = cache.get(key);
      if (!cached) return null;

      if (Date.now() > cached.expiry) {
        cache.delete(key);
        return null;
      }
      return cached.data;
    },

    set(key, data, ttlMs = defaultTtl) {
      cache.set(key, {
        data,
        expiry: Date.now() + ttlMs,
      });
    },

    clear(key = null) {
      if (key) {
        cache.delete(key);
      } else {
        cache.clear();
      }
    }
  };
}

export const apiCache = createCache();