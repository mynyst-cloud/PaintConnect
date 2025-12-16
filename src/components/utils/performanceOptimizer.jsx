

// ENHANCED cache with better memory management and performance metrics
class CacheManager {
  constructor(defaultTTL = 30000, maxItems = 200) {
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
      this.cleanup(true); // Force cleanup
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { 
      value, 
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0
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

    // Track access for LRU eviction
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

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    console.log('GlobalCache cleared - all cached data removed');
  }

  // Enhanced cleanup with LRU eviction
  cleanup(force = false) {
    const now = Date.now();
    
    // Only run cleanup every 5 minutes unless forced
    if (!force && now - this.lastCleanup < 300000) return;
    
    // Remove expired entries
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove least recently used items
    if (this.cache.size > this.maxItems * 0.8) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0));
      
      const toRemove = Math.floor(this.cache.size * 0.2);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.lastCleanup = now;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  // Prefetch commonly used data
  async prefetch(keys, fetchFunctions) {
    const prefetchPromises = keys.map(async (key, index) => {
      if (!this.has(key) && fetchFunctions[index]) {
        try {
          const data = await fetchFunctions[index]();
          this.set(key, data, 300000); // 5 minute TTL for prefetched data
        } catch (error) {
          console.warn(`Prefetch failed for ${key}:`, error.message);
        }
      }
    });

    await Promise.all(prefetchPromises);
  }
}

export const globalCache = new CacheManager(60000, 200); // 1 min TTL, max 200 items

// Auto cleanup every 5 minutes
setInterval(() => globalCache.cleanup(), 5 * 60 * 1000);

// NIEUW: Rate limit handler met exponential backoff
export class RateLimitHandler {
  constructor() {
    this.retryDelays = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  async executeWithRetry(fn, key = 'default') {
    let lastError;
    let currentPersistentRetryCount = this.retryDelays.get(key) || 0;

    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        const result = await fn();
        this.retryDelays.set(key, 0);
        return result;
      } catch (error) {
        lastError = error;
        
        // Treat network errors and rate limits (429) the same way
        const isRetryableError = error.response?.status === 429 || 
                                (typeof error.message === 'string' && error.message.includes('Network Error')) ||
                                error.code === 'ECONNABORTED';
        
        if (isRetryableError) {
          if (i < this.maxRetries) {
            const delay = this.baseDelay * Math.pow(2, i);
            console.log(`[RateLimitHandler] Retryable error for key '${key}' (attempt ${i + 1}/${this.maxRetries + 1}), retrying in ${delay}ms...`);
            
            this.retryDelays.set(key, currentPersistentRetryCount + 1);
            currentPersistentRetryCount++;
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.warn(`[RateLimitHandler] Max retries (${this.maxRetries + 1}) reached for key '${key}'. Giving up.`);
          }
        }
        
        break;
      }
    }
    
    throw lastError;
  }

  reset(key = 'default') {
    this.retryDelays.delete(key);
  }
}

export const rateLimitHandler = new RateLimitHandler();

// Performance monitoring
export const performanceMonitor = {
  startTime: Date.now(),
  pageLoadTimes: [],
  
  recordPageLoad(pageName, loadTime) {
    this.pageLoadTimes.push({ pageName, loadTime, timestamp: Date.now() });
    
    // Keep only last 50 records
    if (this.pageLoadTimes.length > 50) {
      this.pageLoadTimes = this.pageLoadTimes.slice(-50);
    }
  },

  getAverageLoadTime(pageName) {
    const pageLoads = this.pageLoadTimes.filter(p => p.pageName === pageName);
    if (pageLoads.length === 0) return 0;
    
    const sum = pageLoads.reduce((acc, p) => acc + p.loadTime, 0);
    return sum / pageLoads.length;
  },

  getStats() {
    return {
      uptime: Date.now() - this.startTime,
      cache: globalCache.getStats(),
      averagePageLoads: this.pageLoadTimes.reduce((acc, curr) => {
        acc[curr.pageName] = this.getAverageLoadTime(curr.pageName);
        return acc;
      }, {})
    };
  }
};

// Image optimization utilities
export const imageOptimizer = {
  // Generate responsive image URLs using Base44's image proxy or fallback
  getOptimizedImageUrl(originalUrl, options = {}) {
    if (!originalUrl) return originalUrl;
    
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'webp'
    } = options;

    // Check if it's already a Base44 URL and can be optimized
    if (originalUrl.includes('supabase.co/storage')) {
      // For Supabase URLs, we can add transformation parameters
      const url = new URL(originalUrl);
      const params = new URLSearchParams();
      
      if (width) params.append('width', width);
      if (height) params.append('height', height);
      params.append('quality', quality);
      params.append('format', format);
      
      // Return optimized URL if parameters were added
      if (params.toString()) {
        return `${originalUrl}?${params.toString()}`;
      }
    }
    
    return originalUrl; // Return original if no optimization possible
  },

  // Get appropriate image size based on screen size
  getResponsiveImageOptions() {
    if (typeof window === 'undefined') return { width: 800, height: 600 };
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Mobile
    if (screenWidth <= 768) {
      return {
        width: Math.round(screenWidth * devicePixelRatio),
        height: Math.round(400 * devicePixelRatio),
        quality: 70 // Lower quality for mobile to save bandwidth
      };
    }
    
    // Desktop
    return {
      width: Math.round(Math.min(screenWidth * 0.5, 1200) * devicePixelRatio),
      height: Math.round(Math.min(screenHeight * 0.6, 800) * devicePixelRatio),
      quality: 80
    };
  }
};

// Enhanced error handling with retry logic
export const apiRetryWrapper = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Don't retry on client errors (4xx), except for 429 (rate limit)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      if (i < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};
