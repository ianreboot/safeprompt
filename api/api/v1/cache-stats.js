/**
 * SafePrompt Cache Statistics Endpoint
 * GET /api/v1/cache-stats
 *
 * Returns cache performance metrics
 * Phase 19: Provides visibility into optimization
 */

import { getCache } from '../../lib/cache-manager.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use GET to retrieve cache stats'
    });
  }

  try {
    // Get cache instance
    const cache = getCache();

    // Get current stats
    const stats = cache.getStats();

    // Add additional metrics
    const enhancedStats = {
      ...stats,
      timestamp: new Date().toISOString(),
      description: {
        hitRate: `${stats.hitRate} of requests served from cache`,
        size: `${stats.size} entries currently cached`,
        memoryUsage: `Approximately ${stats.memoryUsage} used`,
        evictions: `${stats.evictions} entries evicted due to size limits`
      }
    };

    return res.status(200).json(enhancedStats);

  } catch (error) {
    console.error('Cache stats error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : 'Failed to retrieve cache stats'
    });
  }
}

/**
 * Configuration for Vercel
 */
export const config = {
  api: {
    bodyParser: false
  }
};