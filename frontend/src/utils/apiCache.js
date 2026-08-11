class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if it exists and hasn't expired.
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  //get cached data
  set(key, data, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate a single key or clear the entire cache.
   */
  clear(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const apiCache = new ApiCache();