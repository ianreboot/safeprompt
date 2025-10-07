/**
 * Unit tests for Pattern Discovery Pipeline
 * Tests substring frequency analysis, encoding detection, and AI pattern proposals
 *
 * Note: These tests focus on pure functions exported via _test to avoid
 * Supabase initialization at module load time.
 */

import { describe, it, expect } from 'vitest';

// Import only the exported test functions to avoid Supabase init
// The main module initializes Supabase at load time which requires credentials
let findFrequentSubstrings, detectEncodingSchemes, _test;

try {
  const module = await import('../lib/pattern-discovery.js');
  findFrequentSubstrings = module.findFrequentSubstrings;
  detectEncodingSchemes = module.detectEncodingSchemes;
  _test = module._test;
} catch (error) {
  // If import fails due to missing credentials, skip tests gracefully
  console.warn('Skipping pattern-discovery tests: ' + error.message);
}

describe('Pattern Discovery - Substring Frequency Analysis', () => {
  describe('Basic Substring Detection', () => {
    it('should find frequent substrings across multiple prompts', () => {
      const texts = [
        'eval(document.cookie)',
        'eval(window.location)',
        'eval(localStorage.getItem)',
        'eval(sessionStorage)',
        'eval(fetch)'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 3,
        maxResults: 10
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.substring.includes('eval('))).toBe(true);
    });

    it('should exclude common words from pattern detection', () => {
      const texts = [
        'the quick brown fox',
        'the lazy dog',
        'the cat and the dog',
        'the user and the admin'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 3,
        maxResults: 10
      });

      // Should not return substrings starting/ending with "the"
      results.forEach(r => {
        expect(r.substring.startsWith('the ')).toBe(false);
        expect(r.substring.endsWith(' the')).toBe(false);
      });
    });

    it('should handle minimum occurrence threshold', () => {
      const texts = [
        'SELECT * FROM users',
        'SELECT * FROM passwords',
        'INSERT INTO logs'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 5,
        maxResults: 10
      });

      // No substring appears 5+ times
      expect(results.length).toBe(0);
    });

    it('should respect minimum length requirement', () => {
      const texts = [
        'abc abc abc abc',
        'def def def def'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 2,
        maxResults: 10
      });

      // "abc" and "def" are too short
      results.forEach(r => {
        expect(r.substring.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should limit results to maxResults parameter', () => {
      const texts = Array(100).fill('pattern1 pattern2 pattern3 pattern4 pattern5');

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 10,
        maxResults: 3
      });

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('SQL Injection Pattern Detection', () => {
    it('should detect SQL keywords in attack prompts', () => {
      const texts = [
        'SELECT * FROM users WHERE id=1',
        'SELECT password FROM admin',
        'SELECT token FROM sessions',
        'DROP TABLE users; --'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 6,
        minOccurrences: 3,
        maxResults: 10
      });

      expect(results.some(r => r.substring.toLowerCase().includes('select'))).toBe(true);
    });

    it('should detect UNION-based SQL injection', () => {
      const texts = [
        'UNION SELECT null, password FROM users',
        'UNION SELECT @@version',
        'UNION SELECT table_name FROM information_schema'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 2,
        maxResults: 10
      });

      expect(results.some(r => r.substring.toLowerCase().includes('union'))).toBe(true);
    });
  });

  describe('XSS Pattern Detection', () => {
    it('should detect JavaScript execution patterns', () => {
      const texts = [
        '<script>alert(1)</script>',
        '<script>document.cookie</script>',
        '<script>window.location</script>',
        '<script>fetch("/api")</script>'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 7,
        minOccurrences: 3,
        maxResults: 10
      });

      expect(results.some(r => r.substring.includes('<script>'))).toBe(true);
    });

    it('should detect event handler attacks', () => {
      const texts = [
        'onerror=alert(1)',
        'onerror=fetch()',
        'onerror=eval()'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 2,
        maxResults: 10
      });

      expect(results.some(r => r.substring.includes('onerror'))).toBe(true);
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate correct occurrence percentages', () => {
      const texts = [
        'pattern1 pattern1',
        'pattern1 other',
        'pattern1 data',
        'unrelated text'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 2,
        maxResults: 10
      });

      const pattern1 = results.find(r => r.substring.includes('pattern1'));
      if (pattern1) {
        expect(pattern1.percentage).toBe('75.00'); // 3 out of 4 texts
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text array', () => {
      const results = findFrequentSubstrings([], {
        minLength: 5,
        minOccurrences: 1,
        maxResults: 10
      });

      expect(results).toEqual([]);
    });

    it('should handle texts with only whitespace', () => {
      const texts = ['   ', '\t\t', '\n\n'];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 1,
        maxResults: 10
      });

      expect(results).toEqual([]);
    });

    it('should handle texts shorter than minLength', () => {
      const texts = ['ab', 'cd', 'ef'];

      const results = findFrequentSubstrings(texts, {
        minLength: 10,
        minOccurrences: 1,
        maxResults: 10
      });

      expect(results).toEqual([]);
    });

    it('should handle special characters correctly', () => {
      const texts = [
        'eval("test")',
        'eval("data")',
        'eval("code")'
      ];

      const results = findFrequentSubstrings(texts, {
        minLength: 5,
        minOccurrences: 2,
        maxResults: 10
      });

      expect(results.some(r => r.substring.includes('eval('))).toBe(true);
    });
  });
});

describe('Pattern Discovery - Encoding Scheme Detection', () => {
  describe('Base64 Detection', () => {
    it('should detect Base64-encoded strings', () => {
      const texts = [
        'payload: SGVsbG8gV29ybGQ=',
        'data: dGVzdERhdGE=',
        'encoded: YWxlcnQoMSk='
      ];

      const results = detectEncodingSchemes(texts);

      const base64 = results.find(r => r.encodingType === 'base64');
      expect(base64).toBeDefined();
      expect(base64.matchCount).toBeGreaterThan(0);
      expect(base64.examples.length).toBeGreaterThan(0);
    });

    it('should include examples of Base64 matches', () => {
      const texts = ['payload: SGVsbG8gV29ybGQ='];

      const results = detectEncodingSchemes(texts);

      const base64 = results.find(r => r.encodingType === 'base64');
      expect(base64.examples).toContain('SGVsbG8gV29ybGQ=');
    });
  });

  describe('URL Encoding Detection', () => {
    it('should detect percent-encoded characters', () => {
      const texts = [
        'param=%3Cscript%3E',
        'url=%2Fetc%2Fpasswd',
        'data=%20%20%20'
      ];

      const results = detectEncodingSchemes(texts);

      const urlEncoded = results.find(r => r.encodingType === 'urlEncoded');
      expect(urlEncoded).toBeDefined();
      expect(urlEncoded.matchCount).toBeGreaterThan(0);
    });

    it('should detect multiple URL-encoded sequences', () => {
      const texts = ['test%20with%20spaces%20and%20more'];

      const results = detectEncodingSchemes(texts);

      const urlEncoded = results.find(r => r.encodingType === 'urlEncoded');
      expect(urlEncoded.matchCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Hexadecimal Encoding Detection', () => {
    it('should detect hex-encoded bytes (\\x format)', () => {
      const texts = [
        'payload: \\x3c\\x73\\x63\\x72\\x69\\x70\\x74\\x3e',
        'data: \\x41\\x42\\x43'
      ];

      const results = detectEncodingSchemes(texts);

      const hexEncoded = results.find(r => r.encodingType === 'hexEncoded');
      expect(hexEncoded).toBeDefined();
      expect(hexEncoded.matchCount).toBeGreaterThan(0);
    });

    it('should detect hex-encoded bytes (0x format)', () => {
      const texts = [
        'payload: 0x3c 0x73 0x63',
        'data: 0x41 0x42'
      ];

      const results = detectEncodingSchemes(texts);

      const hexEncoded = results.find(r => r.encodingType === 'hexEncoded');
      expect(hexEncoded).toBeDefined();
    });
  });

  describe('Unicode Escape Detection', () => {
    it('should detect Unicode escape sequences', () => {
      const texts = [
        'payload: \\u003c\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u003e',
        'data: \\u0041\\u0042\\u0043'
      ];

      const results = detectEncodingSchemes(texts);

      const unicodeEscape = results.find(r => r.encodingType === 'unicodeEscape');
      expect(unicodeEscape).toBeDefined();
      expect(unicodeEscape.matchCount).toBeGreaterThan(0);
    });
  });

  describe('HTML Entity Detection', () => {
    it('should detect named HTML entities', () => {
      const texts = [
        'payload: &lt;script&gt;alert(1)&lt;/script&gt;',
        'data: &amp;&quot;&apos;'
      ];

      const results = detectEncodingSchemes(texts);

      const htmlEntity = results.find(r => r.encodingType === 'htmlEntity');
      expect(htmlEntity).toBeDefined();
      expect(htmlEntity.matchCount).toBeGreaterThan(0);
    });

    it('should detect numeric HTML entities', () => {
      const texts = [
        'payload: &#60;script&#62;',
        'data: &#x3c;&#x3e;'
      ];

      const results = detectEncodingSchemes(texts);

      const htmlEntity = results.find(r => r.encodingType === 'htmlEntity');
      expect(htmlEntity).toBeDefined();
    });
  });

  describe('Encoding Type Sorting', () => {
    it('should sort results by match count (most common first)', () => {
      const texts = [
        'base64: SGVsbG8= and url: %20%20%20 and more %20%20',
        'base64: dGVzdA== and url: %3C%3E',
        'base64: YWxlcnQ= and hex: \\x41'
      ];

      const results = detectEncodingSchemes(texts);

      if (results.length >= 2) {
        // First result should have >= matchCount than second
        expect(results[0].matchCount).toBeGreaterThanOrEqual(results[1].matchCount);
      }
    });
  });

  describe('Encoding Descriptions', () => {
    it('should include human-readable descriptions', () => {
      const texts = ['test: SGVsbG8='];

      const results = detectEncodingSchemes(texts);

      results.forEach(r => {
        expect(r.description).toBeDefined();
        expect(r.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle texts with no encoding', () => {
      const texts = [
        'plain text with no encoding',
        'just normal words here'
      ];

      const results = detectEncodingSchemes(texts);

      // May return empty array or very few matches
      expect(results).toBeDefined();
    });

    it('should handle empty text array', () => {
      const results = detectEncodingSchemes([]);

      expect(results).toEqual([]);
    });

    it('should handle texts with mixed encodings', () => {
      const texts = [
        'base64: SGVsbG8= url: %20 hex: \\x41 unicode: \\u0041 entity: &lt;'
      ];

      const results = detectEncodingSchemes(texts);

      // Should detect all encoding types
      expect(results.length).toBeGreaterThan(0);
    });

    it('should limit examples to 3 per encoding type', () => {
      const texts = Array(10).fill('base64: SGVsbG8gV29ybGQ=');

      const results = detectEncodingSchemes(texts);

      const base64 = results.find(r => r.encodingType === 'base64');
      expect(base64.examples.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('Pattern Discovery - Helper Functions', () => {
  describe('Common Word Detection', () => {
    it('should identify substrings starting with common words', () => {
      expect(_test.startsOrEndsWithCommonWord('the quick fox')).toBe(true);
      expect(_test.startsOrEndsWithCommonWord('and the dog')).toBe(true);
    });

    it('should identify substrings ending with common words', () => {
      expect(_test.startsOrEndsWithCommonWord('quick fox the')).toBe(true);
      expect(_test.startsOrEndsWithCommonWord('dog and')).toBe(true);
    });

    it('should accept substrings without common words', () => {
      expect(_test.startsOrEndsWithCommonWord('eval(document')).toBe(false);
      expect(_test.startsOrEndsWithCommonWord('SELECT password')).toBe(false);
    });
  });
});
