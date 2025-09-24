/**
 * Cache Manager for SafePrompt
 * Implements LRU cache for prompt validation results
 * Reduces API calls and improves response times
 */

import crypto from 'crypto';

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 10000; // Max cached entries
    this.ttl = options.ttl || 3600000; // 1 hour TTL default
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Generate cache key from prompt text
   */
  generateKey(prompt) {
    return crypto
      .createHash('sha256')
      .update(prompt.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter keys
  }

  /**
   * Get cached result
   */
  get(prompt) {
    const key = this.generateKey(prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.misses++;
      return null;
    }

    // Update access order (move to end)
    this.updateAccessOrder(key);
    this.stats.hits++;

    return {
      ...entry.result,
      cached: true,
      cacheAge: Date.now() - entry.timestamp
    };
  }

  /**
   * Set cache entry
   */
  set(prompt, result) {
    const key = this.generateKey(prompt);

    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      result: result,
      timestamp: Date.now(),
      prompt: prompt.substring(0, 100) // Store truncated prompt for debugging
    });

    this.updateAccessOrder(key);
  }

  /**
   * Update access order for LRU
   */
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict oldest entry
   */
  evictOldest() {
    if (this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    // Rough estimate: ~500 bytes per entry
    const bytesPerEntry = 500;
    const totalBytes = this.cache.size * bytesPerEntry;

    if (totalBytes < 1024) {
      return `${totalBytes} bytes`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Check if prompt is in cache (without updating access)
   */
  has(prompt) {
    const key = this.generateKey(prompt);
    const entry = this.cache.get(key);

    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      return false;
    }

    return true;
  }

  /**
   * Batch check for multiple prompts
   */
  batchCheck(prompts) {
    const results = {
      cached: [],
      uncached: []
    };

    for (const prompt of prompts) {
      if (this.has(prompt)) {
        results.cached.push(prompt);
      } else {
        results.uncached.push(prompt);
      }
    }

    return results;
  }

  /**
   * Preload cache with known patterns
   */
  preload(patterns) {
    const preloaded = [];

    // Common safe patterns
    const safePatterns = [
      { pattern: /^(what|how|why|when|where|who)\s+/i, safe: true, confidence: 0.95 },
      { pattern: /^(explain|describe|define|teach)\s+/i, safe: true, confidence: 0.95 },
      { pattern: /^(help|assist|guide|show)\s+/i, safe: true, confidence: 0.90 },
      { pattern: /^(create|write|draft|compose)\s+/i, safe: true, confidence: 0.90 }
    ];

    // Known malicious patterns
    const unsafePatterns = [
      { pattern: /ignore\s+(all\s+)?previous/i, safe: false, confidence: 1.0 },
      { pattern: /\bsystem\s*:/i, safe: false, confidence: 0.95 },
      { pattern: /reveal\s+(your\s+)?system\s+prompt/i, safe: false, confidence: 1.0 },
      { pattern: /<script|<iframe|javascript:/i, safe: false, confidence: 1.0 },
      { pattern: /\bDAN\s+mode\b/i, safe: false, confidence: 1.0 }
    ];

    for (const { pattern, safe, confidence } of [...safePatterns, ...unsafePatterns]) {
      const result = {
        safe,
        confidence,
        threats: safe ? [] : ['pattern_match'],
        validationType: 'cache_preload',
        processingTime: 0
      };

      // Create synthetic prompts for pattern
      const syntheticPrompt = pattern.source;
      this.set(syntheticPrompt, result);
      preloaded.push(syntheticPrompt);
    }

    return preloaded.length;
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get or create cache instance
 */
export function getCache(options) {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(options);
    // Preload common patterns
    cacheInstance.preload();
  }
  return cacheInstance;
}

/**
 * Reset cache instance (for testing)
 */
export function resetCache() {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
}

export default CacheManager;