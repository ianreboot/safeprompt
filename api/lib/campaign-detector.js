/**
 * Attack Campaign Detection
 *
 * Phase 6.4: Detect coordinated attacks across multiple IPs
 *
 * Detection Signals:
 * - Temporal clustering: >20 blocks in same 10-minute window
 * - Technique similarity: >10 requests with >80% similar prompts
 * - IP diversity: Multiple unique IPs using same attack pattern
 *
 * Safety Model:
 * - Alert-only by default (no auto-blocking)
 * - Human review required for response actions
 * - Full audit trail of campaign-related decisions
 *
 * Schedule: Hourly (runs after IP reputation update)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for campaign detection');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Campaign detection thresholds
const TEMPORAL_WINDOW_MINUTES = 10;
const TEMPORAL_THRESHOLD = 20; // blocks in window
const SIMILARITY_THRESHOLD = 0.8; // 80% similar
const SIMILARITY_MIN_REQUESTS = 10;

/**
 * Main campaign detection job
 * Runs hourly to detect coordinated attacks
 */
export async function runCampaignDetection() {
  const startTime = Date.now();
  console.log('[Campaign Detection] Starting analysis...');

  try {
    // 1. Load recent threat intelligence samples (last 24 hours)
    const samples = await loadRecentSamples(24);
    console.log(`[Campaign Detection] Loaded ${samples.length} samples from last 24 hours`);

    if (samples.length < TEMPORAL_THRESHOLD) {
      console.log('[Campaign Detection] Not enough samples for analysis');
      return {
        success: true,
        samplesAnalyzed: samples.length,
        campaignsDetected: 0,
        message: 'Insufficient samples for campaign detection'
      };
    }

    // 2. Temporal clustering - detect time-based campaigns
    const temporalCampaigns = await detectTemporalCampaigns(samples);
    console.log(`[Campaign Detection] Found ${temporalCampaigns.length} temporal campaigns`);

    // 3. Technique similarity - detect pattern-based campaigns
    const similarityCampaigns = await detectSimilarityCampaigns(samples);
    console.log(`[Campaign Detection] Found ${similarityCampaigns.length} similarity campaigns`);

    // 4. Merge and deduplicate campaigns
    const allCampaigns = [...temporalCampaigns, ...similarityCampaigns];
    const uniqueCampaigns = deduplicateCampaigns(allCampaigns);
    console.log(`[Campaign Detection] Total unique campaigns: ${uniqueCampaigns.length}`);

    // 5. Store new campaigns
    let storedCount = 0;
    for (const campaign of uniqueCampaigns) {
      const stored = await storeCampaign(campaign);
      if (stored) storedCount++;
    }

    const duration = Date.now() - startTime;
    console.log(`[Campaign Detection] Complete in ${duration}ms - Stored ${storedCount} campaigns`);

    return {
      success: true,
      samplesAnalyzed: samples.length,
      campaignsDetected: uniqueCampaigns.length,
      campaignsStored: storedCount,
      duration
    };

  } catch (error) {
    console.error('[Campaign Detection] Error:', error);
    throw error;
  }
}

/**
 * Load recent threat intelligence samples
 */
async function loadRecentSamples(hours) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('threat_intelligence_samples')
    .select('*')
    .gte('created_at', cutoffTime)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Campaign Detection] Failed to load samples:', error);
    throw error;
  }

  return data || [];
}

/**
 * Detect temporal campaigns (time-based clustering)
 *
 * Phase 6.4.2: Temporal Clustering
 *
 * Logic:
 * - Group samples into 10-minute windows
 * - Identify windows with >20 blocked requests
 * - Extract campaign metadata (IPs, patterns, user tiers)
 */
async function detectTemporalCampaigns(samples) {
  const campaigns = [];

  // Group samples by time windows
  const windows = groupByTimeWindows(samples, TEMPORAL_WINDOW_MINUTES);

  for (const [windowKey, windowSamples] of Object.entries(windows)) {
    // Only blocked requests count toward campaigns
    const blockedSamples = windowSamples.filter(s => s.blocked === true);

    if (blockedSamples.length >= TEMPORAL_THRESHOLD) {
      // Extract unique IPs
      const uniqueIPs = new Set(blockedSamples.map(s => s.ip_hash));

      // Extract pattern types (from block reasons)
      const patternTypes = extractPatternTypes(blockedSamples);

      // Parse window times
      const [windowStart, windowEnd] = parseWindowKey(windowKey);

      campaigns.push({
        type: 'temporal',
        windowStart,
        windowEnd,
        requestCount: blockedSamples.length,
        uniqueIPs: uniqueIPs.size,
        patternType: patternTypes.join(', '),
        samples: blockedSamples,
        metadata: {
          ipList: Array.from(uniqueIPs),
          patternBreakdown: getPatternBreakdown(blockedSamples)
        }
      });
    }
  }

  return campaigns;
}

/**
 * Detect similarity campaigns (technique-based clustering)
 *
 * Phase 6.4.3: Technique Similarity Detection
 *
 * Logic:
 * - Compare prompts using Levenshtein distance
 * - Identify clusters of >10 requests with >80% similarity
 * - Track IP diversity in each cluster
 */
async function detectSimilarityCampaigns(samples) {
  const campaigns = [];

  // Only analyze samples with prompt text
  const samplesWithText = samples.filter(s => s.prompt_text && s.prompt_text.length > 0);

  if (samplesWithText.length < SIMILARITY_MIN_REQUESTS) {
    return campaigns;
  }

  // Group similar prompts using clustering
  const clusters = clusterSimilarPrompts(samplesWithText, SIMILARITY_THRESHOLD);

  for (const cluster of clusters) {
    if (cluster.length >= SIMILARITY_MIN_REQUESTS) {
      const uniqueIPs = new Set(cluster.map(s => s.ip_hash));

      // Calculate average similarity within cluster
      const avgSimilarity = calculateAverageSimilarity(cluster);

      // Get time range
      const timestamps = cluster.map(s => new Date(s.created_at).getTime());
      const windowStart = new Date(Math.min(...timestamps));
      const windowEnd = new Date(Math.max(...timestamps));

      campaigns.push({
        type: 'similarity',
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        requestCount: cluster.length,
        uniqueIPs: uniqueIPs.size,
        patternType: 'coordinated_similar_attacks',
        similarityScore: avgSimilarity,
        samples: cluster,
        metadata: {
          ipList: Array.from(uniqueIPs),
          examplePrompt: cluster[0].prompt_text?.substring(0, 200)
        }
      });
    }
  }

  return campaigns;
}

/**
 * Group samples into time windows
 */
function groupByTimeWindows(samples, windowMinutes) {
  const windows = {};

  for (const sample of samples) {
    const timestamp = new Date(sample.created_at).getTime();
    const windowStart = Math.floor(timestamp / (windowMinutes * 60 * 1000)) * (windowMinutes * 60 * 1000);
    const windowEnd = windowStart + (windowMinutes * 60 * 1000);

    const windowKey = `${new Date(windowStart).toISOString()}_${new Date(windowEnd).toISOString()}`;

    if (!windows[windowKey]) {
      windows[windowKey] = [];
    }

    windows[windowKey].push(sample);
  }

  return windows;
}

/**
 * Parse window key back to start/end times
 */
function parseWindowKey(windowKey) {
  const [start, end] = windowKey.split('_');
  return [start, end];
}

/**
 * Extract pattern types from block reasons
 */
function extractPatternTypes(samples) {
  const patterns = new Set();

  for (const sample of samples) {
    if (sample.block_reason) {
      // Extract pattern type from block reason
      // Examples: "Pattern: ignore instructions", "Pattern: system prompt"
      const match = sample.block_reason.match(/Pattern:\s*([^,]+)/);
      if (match) {
        patterns.add(match[1].trim());
      }
    }
  }

  return Array.from(patterns);
}

/**
 * Get detailed pattern breakdown
 */
function getPatternBreakdown(samples) {
  const breakdown = {};

  for (const sample of samples) {
    const patterns = extractPatternTypes([sample]);
    for (const pattern of patterns) {
      breakdown[pattern] = (breakdown[pattern] || 0) + 1;
    }
  }

  return breakdown;
}

/**
 * Cluster similar prompts using Levenshtein distance
 */
function clusterSimilarPrompts(samples, threshold) {
  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < samples.length; i++) {
    if (processed.has(i)) continue;

    const cluster = [samples[i]];
    processed.add(i);

    for (let j = i + 1; j < samples.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(
        samples[i].prompt_text,
        samples[j].prompt_text
      );

      if (similarity >= threshold) {
        cluster.push(samples[j]);
        processed.add(j);
      }
    }

    if (cluster.length >= 2) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate average similarity within a cluster
 */
function calculateAverageSimilarity(cluster) {
  if (cluster.length < 2) return 1.0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < cluster.length - 1; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      totalSimilarity += calculateSimilarity(
        cluster[i].prompt_text,
        cluster[j].prompt_text
      );
      comparisons++;
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

/**
 * Deduplicate campaigns (merge overlapping detections)
 */
function deduplicateCampaigns(campaigns) {
  if (campaigns.length === 0) return [];

  const unique = [];
  const processed = new Set();

  for (let i = 0; i < campaigns.length; i++) {
    if (processed.has(i)) continue;

    let merged = campaigns[i];
    processed.add(i);

    // Check for overlapping campaigns
    for (let j = i + 1; j < campaigns.length; j++) {
      if (processed.has(j)) continue;

      if (campaignsOverlap(merged, campaigns[j])) {
        // Merge campaigns
        merged = mergeCampaigns(merged, campaigns[j]);
        processed.add(j);
      }
    }

    unique.push(merged);
  }

  return unique;
}

/**
 * Check if two campaigns overlap
 */
function campaignsOverlap(c1, c2) {
  const start1 = new Date(c1.windowStart).getTime();
  const end1 = new Date(c1.windowEnd).getTime();
  const start2 = new Date(c2.windowStart).getTime();
  const end2 = new Date(c2.windowEnd).getTime();

  // Check time overlap
  const timeOverlap = (start1 <= end2 && start2 <= end1);

  // Check IP overlap (>50% shared IPs)
  const ips1 = new Set(c1.metadata.ipList);
  const ips2 = new Set(c2.metadata.ipList);
  const sharedIPs = [...ips1].filter(ip => ips2.has(ip));
  const ipOverlapRatio = sharedIPs.length / Math.min(ips1.size, ips2.size);

  return timeOverlap && ipOverlapRatio > 0.5;
}

/**
 * Merge two overlapping campaigns
 */
function mergeCampaigns(c1, c2) {
  const start1 = new Date(c1.windowStart).getTime();
  const start2 = new Date(c2.windowStart).getTime();
  const end1 = new Date(c1.windowEnd).getTime();
  const end2 = new Date(c2.windowEnd).getTime();

  const allIPs = new Set([...c1.metadata.ipList, ...c2.metadata.ipList]);

  return {
    type: 'merged',
    windowStart: new Date(Math.min(start1, start2)).toISOString(),
    windowEnd: new Date(Math.max(end1, end2)).toISOString(),
    requestCount: c1.requestCount + c2.requestCount,
    uniqueIPs: allIPs.size,
    patternType: `${c1.patternType}, ${c2.patternType}`,
    similarityScore: (c1.similarityScore || 0 + c2.similarityScore || 0) / 2,
    samples: [...c1.samples, ...c2.samples],
    metadata: {
      ipList: Array.from(allIPs),
      mergedFrom: [c1.type, c2.type]
    }
  };
}

/**
 * Store campaign in database
 */
async function storeCampaign(campaign) {
  // Check if campaign already exists (prevent duplicates)
  const { data: existing } = await supabase
    .from('attack_campaigns')
    .select('id')
    .eq('window_start', campaign.windowStart)
    .eq('window_end', campaign.windowEnd)
    .single();

  if (existing) {
    console.log('[Campaign Detection] Campaign already exists, skipping');
    return false;
  }

  // Insert new campaign
  const { error } = await supabase
    .from('attack_campaigns')
    .insert({
      detected_at: new Date().toISOString(),
      window_start: campaign.windowStart,
      window_end: campaign.windowEnd,
      request_count: campaign.requestCount,
      unique_ips: campaign.uniqueIPs,
      pattern_type: campaign.patternType,
      similarity_score: campaign.similarityScore || null,
      status: 'active',
      notes: `Auto-detected ${campaign.type} campaign`
    });

  if (error) {
    console.error('[Campaign Detection] Failed to store campaign:', error);
    return false;
  }

  console.log(`[Campaign Detection] Stored ${campaign.type} campaign: ${campaign.requestCount} requests, ${campaign.uniqueIPs} IPs`);
  return true;
}

export default {
  runCampaignDetection
};
