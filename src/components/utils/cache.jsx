class CacheManager {
  constructor(defaultTTL = 60000, maxItems = 200) { // Default TTL: 1 minute, Max items: 200
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxItems = maxItems;
    this.hitCount = 0;
    this.missCount = 0;
    this.lastCleanup = Date.now();
  }

  set(key, value, ttl = this.defaultTTL) {
    // Clean old entries if cache is getting too big
    if (this.cache.size >= this.maxItems) {
      this.cleanup(true); // Force eviction if size exceeds maxItems
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { 
      value, 
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    item.accessCount++;
    item.lastAccessed = Date.now();
    this.hitCount++;
    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    return Date.now() <= item.expiresAt;
  }

  delete(key) {
    this.cache.delete(key);
  }

  // NEW: Delete by pattern
  deleteByPattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    console.log('GlobalCache cleared - all cached data removed');
  }

  // Cleanup method
  cleanup(forceEviction = false) {
    const now = Date.now();
    let cleanedCount = 0;
    const expiredKeys = [];

    // First pass: remove all expired items
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }
    for (const key of expiredKeys) {
      this.cache.delete(key);
      cleanedCount++;
    }

    // If cache is still too large, evict least recently accessed items (LRU)
    if (forceEviction && this.cache.size >= this.maxItems) {
      const itemsToEvictCount = this.cache.size - this.maxItems + 1;
      
      const sortedByAccess = [...this.cache.entries()].sort((a, b) => {
        const itemA = a[1];
        const itemB = b[1];
        return (itemA.lastAccessed || itemA.createdAt) - (itemB.lastAccessed || itemB.createdAt);
      });

      for (let i = 0; i < itemsToEvictCount && i < sortedByAccess.length; i++) {
        this.cache.delete(sortedByAccess[i][0]);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup removed ${cleanedCount} items. Current size: ${this.cache.size}`);
    }
    this.lastCleanup = now;
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRatio = totalRequests === 0 ? 0 : (this.hitCount / totalRequests) * 100;
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests: totalRequests,
      hitRatio: hitRatio.toFixed(2) + '%'
    };
  }
}

export const globalCache = new CacheManager(60000, 200);