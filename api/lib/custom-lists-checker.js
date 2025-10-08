/**
 * Custom Lists Checker
 *
 * Checks prompts against custom whitelist/blacklist phrases
 * Returns confidence signals for routing, NOT instant decisions
 *
 * Part of Custom Lists V2 feature (Phase 2)
 */

/**
 * Check prompt against custom lists
 *
 * Returns confidence signals that guide AI validation routing:
 * - Blacklist match → confidence 0.9 (strong attack signal)
 * - Whitelist match → confidence 0.8 (strong business signal)
 * - No match → null (proceed to AI validation)
 *
 * IMPORTANT: These are routing signals, not instant block/allow decisions
 * Pattern detection (XSS, SQL, etc.) CANNOT be overridden by whitelist
 *
 * @param {string} prompt - User prompt to check
 * @param {string[]} whitelist - Array of allowed phrases
 * @param {string[]} blacklist - Array of blocked phrases
 * @returns {Object|null} Match result or null
 *   - {type: 'blacklist', matchedPhrase: string, confidence: 0.9}
 *   - {type: 'whitelist', matchedPhrase: string, confidence: 0.8}
 *   - null (no match)
 */
export function checkCustomLists(prompt, whitelist = [], blacklist = []) {
  // Validate inputs
  if (typeof prompt !== 'string' || !prompt) {
    return null;
  }

  // Normalize prompt for case-insensitive matching
  const normalizedPrompt = prompt.toLowerCase();

  // BLACKLIST ALWAYS WINS - Check blacklist first
  // Blacklist match → High attack confidence (0.9)
  for (const phrase of blacklist) {
    if (typeof phrase === 'string' && phrase && normalizedPrompt.includes(phrase.toLowerCase())) {
      return {
        type: 'blacklist',
        matchedPhrase: phrase,
        confidence: 0.9,
        source: 'custom_blacklist'
      };
    }
  }

  // Check whitelist second
  // Whitelist match → High business confidence (0.8)
  for (const phrase of whitelist) {
    if (typeof phrase === 'string' && phrase && normalizedPrompt.includes(phrase.toLowerCase())) {
      return {
        type: 'whitelist',
        matchedPhrase: phrase,
        confidence: 0.8,
        source: 'custom_whitelist'
      };
    }
  }

  // No match - proceed to AI validation
  return null;
}

/**
 * Get match details for reporting/attribution
 *
 * @param {Object} matchResult - Result from checkCustomLists()
 * @returns {string} Human-readable match description
 */
export function getMatchDescription(matchResult) {
  if (!matchResult) {
    return 'No custom list match';
  }

  if (matchResult.type === 'blacklist') {
    return `Matched custom blacklist phrase: "${matchResult.matchedPhrase}"`;
  }

  if (matchResult.type === 'whitelist') {
    return `Matched custom whitelist phrase: "${matchResult.matchedPhrase}"`;
  }

  return 'Unknown match type';
}

/**
 * Check if a phrase would match against a prompt
 * Utility function for testing and validation
 *
 * @param {string} prompt - Prompt to check
 * @param {string} phrase - Phrase to match
 * @returns {boolean} True if phrase matches
 */
export function phraseMatches(prompt, phrase) {
  if (typeof prompt !== 'string' || typeof phrase !== 'string') {
    return false;
  }

  if (!prompt || !phrase) {
    return false;
  }

  return prompt.toLowerCase().includes(phrase.toLowerCase());
}

export default {
  checkCustomLists,
  getMatchDescription,
  phraseMatches
};
