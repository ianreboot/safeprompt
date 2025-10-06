/**
 * External Reference Detector
 * Detects URLs, IPs, file paths, and encoded references
 * Handles various obfuscation techniques
 */

export class ExternalReferenceDetector {
  constructor() {
    // Normalize input first to handle encoding tricks
    this.normalizers = [
      // Remove zero-width characters
      text => text.replace(/[\u200B-\u200F\u2028-\u202E\uFEFF]/g, ''),

      // Handle spaces in URLs
      text => text.replace(/h\s*t\s*t\s*p/gi, 'http'),
      text => text.replace(/w\s*w\s*w\s*\./gi, 'www.'),
      text => text.replace(/\.\s*c\s*o\s*m/gi, '.com'),
      text => text.replace(/\.\s*o\s*r\s*g/gi, '.org'),
      text => text.replace(/\.\s*n\s*e\s*t/gi, '.net'),

      // Handle [dot] [slash] variations
      text => text.replace(/\[dot\]|\(dot\)|\{dot\}|<dot>|\[\.\]|\(\.\)|\{\.\}/gi, '.'),
      text => text.replace(/\[slash\]|\(slash\)|\{slash\}|<slash>|\[\/\]|\(\/\)|\{\/\}/gi, '/'),
      text => text.replace(/\[colon\]|\(colon\)|\{colon\}|<colon>|\[:\]|\(:\)|\{:\}/gi, ':'),
      text => text.replace(/\[at\]|\(at\)|\{at\}|<at>|\[@\]|\(@\)|\{@\}/gi, '@'),

      // Handle defanged URLs (hxxp instead of http)
      text => text.replace(/hxxp/gi, 'http'),
      text => text.replace(/hXXp/gi, 'http'),

      // Handle homoglyphs (lookalike characters)
      text => {
        // Expanded homoglyph mapping: Cyrillic, Greek, Full-width, Mathematical
        const homoglyphMap = {
          // Cyrillic (existing)
          'а':'a', 'о':'o', 'е':'e', 'р':'p', 'с':'c', 'х':'x',
          'А':'A', 'О':'O', 'Е':'E', 'Р':'P', 'С':'C', 'Х':'X',
          'В':'B', 'Н':'H', 'К':'K', 'М':'M', 'Т':'T', 'У':'Y',
          'в':'b', 'н':'h', 'к':'k', 'м':'m', 'т':'t', 'у':'y',

          // Greek (common lookalikes)
          'ο':'o', 'ν':'v', 'ρ':'p', 'α':'a', 'ε':'e', 'ι':'i',
          'τ':'t', 'υ':'y', 'ω':'w', 'σ':'s', 'η':'n', 'μ':'u',
          'Ο':'O', 'Ν':'N', 'Ρ':'P', 'Α':'A', 'Ε':'E', 'Ι':'I',
          'Τ':'T', 'Υ':'Y', 'Ω':'W', 'Η':'H', 'Μ':'M', 'Κ':'K',

          // Full-width Latin (often used in Unicode attacks)
          'ａ':'a', 'ｂ':'b', 'ｃ':'c', 'ｄ':'d', 'ｅ':'e', 'ｆ':'f',
          'ｇ':'g', 'ｈ':'h', 'ｉ':'i', 'ｊ':'j', 'ｋ':'k', 'ｌ':'l',
          'ｍ':'m', 'ｎ':'n', 'ｏ':'o', 'ｐ':'p', 'ｑ':'q', 'ｒ':'r',
          'ｓ':'s', 'ｔ':'t', 'ｕ':'u', 'ｖ':'v', 'ｗ':'w', 'ｘ':'x',
          'ｙ':'y', 'ｚ':'z',
          'Ａ':'A', 'Ｂ':'B', 'Ｃ':'C', 'Ｄ':'D', 'Ｅ':'E', 'Ｆ':'F',
          'Ｇ':'G', 'Ｈ':'H', 'Ｉ':'I', 'Ｊ':'J', 'Ｋ':'K', 'Ｌ':'L',
          'Ｍ':'M', 'Ｎ':'N', 'Ｏ':'O', 'Ｐ':'P', 'Ｑ':'Q', 'Ｒ':'R',
          'Ｓ':'S', 'Ｔ':'T', 'Ｕ':'U', 'Ｖ':'V', 'Ｗ':'W', 'Ｘ':'X',
          'Ｙ':'Y', 'Ｚ':'Z',

          // Mathematical Alphanumeric Symbols (bold, italic, etc.)
          // Bold lowercase
          '𝐚':'a', '𝐛':'b', '𝐜':'c', '𝐝':'d', '𝐞':'e', '𝐟':'f',
          '𝐠':'g', '𝐡':'h', '𝐢':'i', '𝐣':'j', '𝐤':'k', '𝐥':'l',
          '𝐦':'m', '𝐧':'n', '𝐨':'o', '𝐩':'p', '𝐪':'q', '𝐫':'r',
          '𝐬':'s', '𝐭':'t', '𝐮':'u', '𝐯':'v', '𝐰':'w', '𝐱':'x',
          '𝐲':'y', '𝐳':'z',
          // Bold uppercase
          '𝐀':'A', '𝐁':'B', '𝐂':'C', '𝐃':'D', '𝐄':'E', '𝐅':'F',
          '𝐆':'G', '𝐇':'H', '𝐈':'I', '𝐉':'J', '𝐊':'K', '𝐋':'L',
          '𝐌':'M', '𝐍':'N', '𝐎':'O', '𝐏':'P', '𝐐':'Q', '𝐑':'R',
          '𝐒':'S', '𝐓':'T', '𝐔':'U', '𝐕':'V', '𝐖':'W', '𝐗':'X',
          '𝐘':'Y', '𝐙':'Z',
          // Sans-serif bold (commonly used for obfuscation)
          '𝗮':'a', '𝗯':'b', '𝗰':'c', '𝗱':'d', '𝗲':'e', '𝗳':'f',
          '𝗴':'g', '𝗵':'h', '𝗶':'i', '𝗷':'j', '𝗸':'k', '𝗹':'l',
          '𝗺':'m', '𝗻':'n', '𝗼':'o', '𝗽':'p', '𝗾':'q', '𝗿':'r',
          '𝘀':'s', '𝘁':'t', '𝘂':'u', '𝘃':'v', '𝘄':'w', '𝘅':'x',
          '𝘆':'y', '𝘇':'z'
        };

        // Replace all homoglyphs with Latin equivalents
        return text.split('').map(char => homoglyphMap[char] || char).join('');
      },

      // Normalize dots and slashes
      text => text.replace(/[․‧⁘∙•·]/g, '.'), // Various dot characters
      text => text.replace(/[⁄∕╱⧸／]/g, '/'),  // Various slash characters
      text => text.replace(/[：﹕]/g, ':'),      // Various colon characters

      // Handle percent encoding
      text => text.replace(/%2F/gi, '/'),
      text => text.replace(/%3A/gi, ':'),
      text => text.replace(/%2E/gi, '.'),
    ];

    // Patterns for different reference types
    this.patterns = {
      // URLs (including obfuscated)
      urls: [
        // Standard URLs with protocol
        /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,

        // FTP, file, and other protocols
        /(?:ftp|file|ssh|telnet|vnc|rdp):\/\/[^\s<>"{}|\\^`\[\]]+/gi,

        // www without protocol
        /www\.[a-z0-9][a-z0-9-]*[a-z0-9]\.[^\s<>"{}|\\^`\[\]]+/gi,

        // Domain patterns
        /[a-z0-9][a-z0-9-]*[a-z0-9]\.(com|org|net|io|dev|app|ai|cloud|xyz|edu|gov|mil|biz|info|name|museum|us|ca|uk|de|jp|fr|au|ru|ch|it|nl|se|no|es|mil)[^\s<>"{}|\\^`\[\]]*/gi,

        // URL-like patterns without protocol
        /[a-z0-9-]+\.[a-z]{2,}\/([\w\-._~:/?#[\]@!$&'()*+,;=])+/gi,

        // Shortened URLs
        /(bit\.ly|tinyurl\.com|goo\.gl|t\.co|short\.link|tiny\.cc|ow\.ly|is\.gd|buff\.ly)\/[a-z0-9]+/gi,

        // Markdown/markup links
        /\[([^\]]+)\]\(([^)]+)\)/g,
        /<a[^>]*href=['"]([^'"]+)['"]/gi,

        // Localhost references
        /localhost(:[0-9]{1,5})?/gi,
        /127\.0\.0\.1(:[0-9]{1,5})?/g,
      ],

      // IP addresses (v4 and v6)
      ips: [
        // IPv4
        /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

        // IPv4 with port
        /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):[0-9]{1,5}\b/g,

        // IPv6 full
        /\b(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}\b/gi,

        // IPv6 compressed
        /\b(?:[a-f0-9]{1,4}:)*:(?:[a-f0-9]{1,4}:)*[a-f0-9]{1,4}\b/gi,

        // IPv6 with port
        /\[(?:[a-f0-9]{1,4}:)*:?(?:[a-f0-9]{1,4}:)*[a-f0-9]{1,4}\]:[0-9]{1,5}/gi,
      ],

      // File paths and references
      files: [
        // Unix/Linux absolute paths
        /\/(?:home|usr|var|etc|tmp|opt|bin|sbin|lib|mnt|media|root|boot|dev|proc|sys)\/[\w\-\.\/]+/g,

        // Windows paths
        /[a-z]:\\(?:[\w\-\.\s]+\\)*[\w\-\.\s]+/gi,

        // UNC paths
        /\\\\[\w\-\.]+\\[\w\-\.\s\\$]+/gi,

        // File URLs
        /file:\/\/\/?.+/gi,

        // Relative paths that look suspicious
        /\.\.\/[\w\-\.\/]+/g,
      ],

      // Command-like instructions to fetch
      commands: [
        /(?:fetch|get|read|load|retrieve|download|curl|wget|request|pull|grab)\s+(?:from\s+)?['"]?([^\s'"]+)['"]?/gi,
        /(?:navigate|go|visit|open|browse|access|surf)\s+(?:to\s+)?['"]?([^\s'"]+)['"]?/gi,
        /(?:follow|click)\s+(?:this\s+)?(?:link|url|address)[:>\s]+([^\s<>]+)/gi,
        /(?:check|look|see)\s+(?:what's\s+)?(?:at|on)\s+([^\s<>]+)/gi,
        /(?:import|include|require|source)\s+(?:from\s+)?['"]?([^\s'"]+)['"]?/gi,
      ]
    };
  }

  /**
   * Detect all external references in text
   */
  detect(text) {
    const results = {
      hasExternalReferences: false,
      confidence: 1.0,
      types: [],
      details: [],
      normalizedText: text,
      reasoning: [],
      obfuscationDetected: false
    };

    // Track original vs normalized to detect obfuscation
    const originalText = text;

    // First, normalize the text
    let normalized = text;
    for (const normalizer of this.normalizers) {
      const before = normalized;
      normalized = normalizer(normalized);
      if (before !== normalized) {
        results.obfuscationDetected = true;
      }
    }
    results.normalizedText = normalized;

    // Check for ROT13 encoding
    const rot13Decoded = this.decodeROT13(normalized);
    if (rot13Decoded !== normalized) {
      const rot13Refs = this.detectPatterns(rot13Decoded);
      if (rot13Refs.length > 0) {
        results.hasExternalReferences = true;
        results.types.push('rot13_encoded');
        results.reasoning.push('ROT13 encoded references detected - possible evasion attempt');
        results.confidence = 0.2; // Very low confidence due to encoding
        results.obfuscationDetected = true;
        results.details.push({
          type: 'rot13_encoded',
          decoded: rot13Decoded,
          matches: rot13Refs
        });
      }
    }

    // Check for base64 encoding (with recursive decoding for nested Base64)
    const base64Candidates = normalized.match(/[a-zA-Z0-9+\/]{30,}={0,2}/g) || [];
    for (const candidate of base64Candidates) {
      try {
        // Try recursive decoding up to 7 levels (defense against deep encoding)
        let decoded = candidate;
        let decodedAtLevel = null;

        for (let level = 1; level <= 7; level++) {
          const attemptDecode = Buffer.from(decoded, 'base64').toString('utf-8');

          // Check if this level looks like a URL/IP
          if (this.looksLikeURL(attemptDecode) || this.looksLikeIP(attemptDecode)) {
            decodedAtLevel = level;
            decoded = attemptDecode;
            break;
          }

          // Check if it looks like another Base64 string (for next iteration)
          if (/^[a-zA-Z0-9+\/]{20,}={0,2}$/.test(attemptDecode)) {
            decoded = attemptDecode; // Continue decoding
          } else {
            break; // Not Base64, stop
          }
        }

        if (decodedAtLevel) {
          results.hasExternalReferences = true;
          results.types.push('base64_encoded');
          results.details.push({
            type: 'base64_encoded',
            encoded: candidate.substring(0, 50) + '...',
            decoded: decoded,
            nestingLevel: decodedAtLevel
          });
          results.confidence = 0.2; // Very low confidence
          results.obfuscationDetected = true;
          results.reasoning.push(`Base64 encoded URL/IP detected (nesting level: ${decodedAtLevel}) - likely evasion attempt`);
        }
      } catch (e) {
        // Not valid base64, ignore
      }
    }

    // Check for hex encoding
    const hexPattern = /(?:0x)?([0-9a-f]{8,})/gi;
    const hexCandidates = normalized.match(hexPattern) || [];
    for (const hex of hexCandidates) {
      try {
        const cleaned = hex.replace(/^0x/i, '');
        const decoded = Buffer.from(cleaned, 'hex').toString('utf-8');
        if (this.looksLikeURL(decoded) || this.looksLikeIP(decoded)) {
          results.hasExternalReferences = true;
          results.types.push('hex_encoded');
          results.details.push({
            type: 'hex_encoded',
            encoded: hex.substring(0, 50) + '...',
            decoded: decoded
          });
          results.confidence = 0.2;
          results.obfuscationDetected = true;
          results.reasoning.push('Hex encoded URL/IP detected - likely evasion attempt');
        }
      } catch (e) {
        // Not valid hex, ignore
      }
    }

    // Check each pattern type
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = normalized.match(pattern);
        if (matches && matches.length > 0) {
          results.hasExternalReferences = true;
          if (!results.types.includes(type)) {
            results.types.push(type);
          }

          // Add unique matches
          const uniqueMatches = [...new Set(matches)];
          for (const match of uniqueMatches) {
            results.details.push({
              type,
              match: match.substring(0, 100), // Limit length
              pattern: type // Simplified pattern name
            });
          }
        }
      }
    }

    // Determine confidence based on reference types and obfuscation
    if (results.hasExternalReferences) {
      if (results.obfuscationDetected) {
        results.confidence = Math.min(results.confidence, 0.3);
        results.reasoning.push('Obfuscation detected - cannot verify safety');
      }

      if (results.types.includes('rot13_encoded') || results.types.includes('base64_encoded') || results.types.includes('hex_encoded')) {
        results.confidence = Math.min(results.confidence, 0.2);
        results.reasoning.push('Encoded external references - high risk of evasion');
      } else if (results.types.includes('urls') || results.types.includes('ips')) {
        results.confidence = Math.min(results.confidence, 0.5);
        results.reasoning.push('Contains external URLs/IPs - cannot verify content');
      } else if (results.types.includes('commands')) {
        results.confidence = Math.min(results.confidence, 0.4);
        results.reasoning.push('Contains commands to fetch external content');
      } else if (results.types.includes('files')) {
        results.confidence = Math.min(results.confidence, 0.6);
        results.reasoning.push('Contains file path references');
      }

      // Add general warning
      results.reasoning.push('External content cannot be validated by SafePrompt');
      results.reasoning.push('Manual review recommended before processing');
    }

    return results;
  }

  /**
   * Helper: Detect patterns in text
   */
  detectPatterns(text) {
    const matches = [];
    for (const patterns of Object.values(this.patterns)) {
      for (const pattern of patterns) {
        const found = text.match(pattern);
        if (found) {
          matches.push(...found);
        }
      }
    }
    return matches;
  }

  /**
   * Helper: Decode ROT13
   */
  decodeROT13(text) {
    return text.replace(/[a-zA-Z]/g, char => {
      const code = char.charCodeAt(0);
      const base = code < 97 ? 65 : 97;
      return String.fromCharCode((code - base + 13) % 26 + base);
    });
  }

  /**
   * Helper: Check if decoded text looks like a URL
   */
  looksLikeURL(text) {
    if (!text || text.length < 10) return false;
    return /^https?:\/\//.test(text) ||
           /^www\./.test(text) ||
           /^ftp:\/\//.test(text) ||
           /\.(com|org|net|io|dev|app)/.test(text);
  }

  /**
   * Helper: Check if decoded text looks like an IP
   */
  looksLikeIP(text) {
    if (!text || text.length < 7) return false;
    // Simple IPv4 check
    return /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(text) ||
           // Simple IPv6 check
           /\b(?:[a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}\b/i.test(text);
  }
}

export default ExternalReferenceDetector;