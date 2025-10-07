/**
 * AI Pattern Analyzer
 *
 * Uses Gemini 2.0 Flash to analyze discovered patterns and propose
 * regex patterns with explanations.
 *
 * Phase 6.2.4: AI-Powered Pattern Proposals
 */

import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Gemini 2.0 Flash via OpenRouter
const MODEL = 'google/gemini-2.0-flash-exp:free';

/**
 * Analyze discovered substrings and propose regex patterns
 *
 * @param {Array} substrings - Array of {substring, count, percentage} objects
 * @param {Array} encodings - Array of {encodingType, matchCount} objects
 * @returns {Array} AI-generated pattern proposals
 */
export async function analyzeAndProposePatterns(substrings, encodings) {
  const startTime = Date.now();
  console.log('[AI Pattern Analyzer] Starting analysis...');

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not found in environment');
  }

  const proposals = [];

  // Analyze substrings (in batches of 5 to avoid token limits)
  if (substrings && substrings.length > 0) {
    const substringBatches = chunkArray(substrings, 5);

    for (let i = 0; i < substringBatches.length; i++) {
      console.log(`[AI Pattern Analyzer] Processing substring batch ${i + 1}/${substringBatches.length}`);

      const batchProposals = await analyzeSubstringBatch(substringBatches[i]);
      proposals.push(...batchProposals);

      // Rate limiting: 200ms between requests
      if (i < substringBatches.length - 1) {
        await sleep(200);
      }
    }
  }

  // Analyze encodings
  if (encodings && encodings.length > 0) {
    console.log(`[AI Pattern Analyzer] Analyzing ${encodings.length} encoding patterns`);
    const encodingProposals = await analyzeEncodings(encodings);
    proposals.push(...encodingProposals);
  }

  const duration = Date.now() - startTime;
  console.log(`[AI Pattern Analyzer] Complete in ${duration}ms - Generated ${proposals.length} proposals`);

  return proposals;
}

/**
 * Analyze a batch of substrings and propose regex patterns
 */
async function analyzeSubstringBatch(substrings) {
  const prompt = buildSubstringAnalysisPrompt(substrings);

  try {
    const response = await callOpenRouter(prompt);

    // Parse AI response
    const proposals = parseAIProposals(response, substrings);
    return proposals;

  } catch (error) {
    console.error('[AI Pattern Analyzer] Substring analysis failed:', error.message);
    return [];
  }
}

/**
 * Analyze encoding patterns
 */
async function analyzeEncodings(encodings) {
  const proposals = [];

  // Encodings are straightforward - AI can suggest improvements to detection
  encodings.forEach(encoding => {
    proposals.push({
      proposed_pattern: encoding.encodingType,
      pattern_type: 'encoding',
      reasoning: `AI Analysis: ${encoding.matchCount} instances detected. This encoding scheme is commonly used to obfuscate malicious payloads.`,
      frequency_count: encoding.matchCount,
      confidence_score: 0.9,
      ai_generated: true
    });
  });

  return proposals;
}

/**
 * Build analysis prompt for substrings
 */
function buildSubstringAnalysisPrompt(substrings) {
  const substringList = substrings
    .map(s => `- "${s.substring}" (found ${s.count} times, ${s.percentage}%)`)
    .join('\n');

  return `You are a security expert analyzing attack patterns in prompt injection attempts.

TASK: Analyze these suspicious substrings found in blocked prompts and propose regex patterns to detect similar attacks.

DISCOVERED SUBSTRINGS:
${substringList}

For EACH substring above, provide:

1. **Pattern Type**: Is this:
   - Direct keyword (e.g., "ignore instructions")
   - Attack technique (e.g., "system prompt", "developer mode")
   - Encoding/obfuscation attempt
   - False positive risk (common legitimate phrase)

2. **Regex Pattern**: Provide a regex that:
   - Matches this substring and similar variations
   - Handles case variations (use (?i) flag)
   - Captures common misspellings/variations
   - Is NOT too broad (avoid false positives)

3. **Confidence Score** (0.0-1.0):
   - 1.0 = Clear attack pattern, very specific
   - 0.5 = Potentially suspicious, needs context
   - 0.1 = High false positive risk, borderline

4. **Reasoning**: Brief explanation of why this is suspicious and what variations the regex captures.

RESPONSE FORMAT:
Return JSON array of objects (one per substring):
[
  {
    "substring": "original substring",
    "pattern_type": "keyword|technique|encoding|false_positive",
    "proposed_regex": "(?i)pattern here",
    "confidence_score": 0.9,
    "reasoning": "explanation here",
    "variations_captured": ["variation1", "variation2"]
  }
]

IMPORTANT:
- Only propose patterns for HIGH confidence (>0.7) findings
- If a substring is too generic or common, mark as false_positive
- Consider legitimate use cases (e.g., "system" is too broad alone)
- Regex should be production-ready (tested mentally for edge cases)

Return ONLY the JSON array, no other text.`;
}

/**
 * Parse AI response into proposals
 */
function parseAIProposals(aiResponse, substrings) {
  try {
    // Extract JSON from response (AI might add markdown formatting)
    let jsonText = aiResponse.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }

    // Convert AI proposals to our schema
    const proposals = parsed
      .filter(p => p.confidence_score >= 0.7) // Only high confidence
      .filter(p => p.pattern_type !== 'false_positive') // Exclude false positives
      .map(p => ({
        proposed_pattern: p.proposed_regex,
        pattern_type: 'regex',
        reasoning: `AI Analysis: ${p.reasoning}. Variations: ${p.variations_captured?.join(', ') || 'N/A'}`,
        frequency_count: substrings.find(s => s.substring === p.substring)?.count || 0,
        confidence_score: p.confidence_score,
        ai_generated: true,
        ai_metadata: {
          original_substring: p.substring,
          pattern_category: p.pattern_type,
          variations_captured: p.variations_captured || []
        }
      }));

    return proposals;

  } catch (error) {
    console.error('[AI Pattern Analyzer] Failed to parse AI response:', error.message);
    console.error('AI Response:', aiResponse.substring(0, 200));
    return [];
  }
}

/**
 * Call OpenRouter API with Gemini 2.0 Flash
 */
async function callOpenRouter(prompt) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://safeprompt.dev',
      'X-Title': 'SafePrompt Pattern Analyzer'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent analysis
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid OpenRouter response format');
  }

  return data.choices[0].message.content;
}

/**
 * Chunk array into batches
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  analyzeAndProposePatterns
};
