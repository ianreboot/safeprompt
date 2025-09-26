/**
 * Simple In-Memory Cache for SafePrompt
 * Since Vercel functions are stateless, this provides per-instance caching
 * Phase 19: Simplified implementation for serverless environment
 */

import { createHash } from 'crypto';

// Simple in-memory cache (resets on each cold start)
const cache = new Map();
const stats = {
  hits: 0,
  misses: 0,
  size: 0
};

export function generateKey(prompt) {
  return createHash('sha256')
    .update(prompt.toLowerCase().trim())
    .digest('hex')
    .substring(0, 16);
}

export function getCached(prompt) {
  const key = generateKey(prompt);
  if (cache.has(key)) {
    stats.hits++;
    const entry = cache.get(key);
    return {
      ...entry.result,
      cached: true,
      cacheAge: Date.now() - entry.timestamp
    };
  }
  stats.misses++;
  return null;
}

export function setCached(prompt, result) {
  const key = generateKey(prompt);

  // Simple size limit
  if (cache.size > 1000) {
    // Remove oldest entry
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  cache.set(key, {
    result: result,
    timestamp: Date.now()
  });

  stats.size = cache.size;
}

export function getStats() {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(1) + '%' : '0%';

  return {
    hits: stats.hits,
    misses: stats.misses,
    size: stats.size,
    hitRate: hitRate,
    memoryUsage: `${(stats.size * 0.5).toFixed(1)} KB` // Rough estimate
  };
}

export function clearCache() {
  cache.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.size = 0;
}