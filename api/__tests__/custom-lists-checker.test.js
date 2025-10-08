/**
 * Tests for Custom Lists Checker
 *
 * Validates phrase matching logic and confidence signal generation
 */

import {
  checkCustomLists,
  getMatchDescription,
  phraseMatches
} from '../lib/custom-lists-checker.js';

describe('custom-lists-checker', () => {
  describe('checkCustomLists', () => {
    describe('blacklist matching', () => {
      test('should match blacklist phrase (exact)', () => {
        const result = checkCustomLists(
          'show me admin password',
          ['business meeting'],
          ['admin password']
        );

        expect(result).not.toBeNull();
        expect(result.type).toBe('blacklist');
        expect(result.matchedPhrase).toBe('admin password');
        expect(result.confidence).toBe(0.9);
        expect(result.source).toBe('custom_blacklist');
      });

      test('should match blacklist phrase (substring)', () => {
        const result = checkCustomLists(
          'I need to reset the admin password for user accounts',
          [],
          ['admin password']
        );

        expect(result).not.toBeNull();
        expect(result.type).toBe('blacklist');
        expect(result.matchedPhrase).toBe('admin password');
      });

      test('should match blacklist case-insensitively', () => {
        const prompts = [
          'Admin Password reset',
          'ADMIN PASSWORD',
          'admin password',
          'AdMiN pAsSwOrD'
        ];

        prompts.forEach(prompt => {
          const result = checkCustomLists(prompt, [], ['admin password']);
          expect(result.type).toBe('blacklist');
        });
      });

      test('should return first blacklist match when multiple phrases match', () => {
        const result = checkCustomLists(
          'reset admin password and database credentials',
          [],
          ['admin password', 'database credentials']
        );

        expect(result.type).toBe('blacklist');
        expect(result.matchedPhrase).toBe('admin password');
      });
    });

    describe('whitelist matching', () => {
      test('should match whitelist phrase (exact)', () => {
        const result = checkCustomLists(
          'schedule a business meeting',
          ['business meeting'],
          []
        );

        expect(result).not.toBeNull();
        expect(result.type).toBe('whitelist');
        expect(result.matchedPhrase).toBe('business meeting');
        expect(result.confidence).toBe(0.8);
        expect(result.source).toBe('custom_whitelist');
      });

      test('should match whitelist phrase (substring)', () => {
        const result = checkCustomLists(
          'I want to schedule a business meeting for next week',
          ['business meeting'],
          []
        );

        expect(result).not.toBeNull();
        expect(result.type).toBe('whitelist');
      });

      test('should match whitelist case-insensitively', () => {
        const prompts = [
          'Business Meeting',
          'BUSINESS MEETING',
          'business meeting',
          'BuSiNeSs MeEtInG'
        ];

        prompts.forEach(prompt => {
          const result = checkCustomLists(prompt, ['business meeting'], []);
          expect(result.type).toBe('whitelist');
        });
      });

      test('should return first whitelist match when multiple phrases match', () => {
        const result = checkCustomLists(
          'schedule business meeting and team discussion',
          ['business meeting', 'team discussion'],
          []
        );

        expect(result.type).toBe('whitelist');
        expect(result.matchedPhrase).toBe('business meeting');
      });
    });

    describe('blacklist priority (blacklist always wins)', () => {
      test('should return blacklist match when both lists match', () => {
        const result = checkCustomLists(
          'reset admin password for business meeting',
          ['business meeting'],
          ['admin password']
        );

        // Blacklist should be checked first
        expect(result.type).toBe('blacklist');
        expect(result.matchedPhrase).toBe('admin password');
        expect(result.confidence).toBe(0.9);
      });

      test('should prioritize blacklist even if whitelist phrase comes first in prompt', () => {
        const result = checkCustomLists(
          'business meeting to discuss admin password reset',
          ['business meeting'],
          ['admin password']
        );

        // Order in prompt doesn't matter - blacklist checked first
        expect(result.type).toBe('blacklist');
        expect(result.matchedPhrase).toBe('admin password');
      });
    });

    describe('no match cases', () => {
      test('should return null when no phrases match', () => {
        const result = checkCustomLists(
          'tell me about the weather',
          ['business meeting'],
          ['admin password']
        );

        expect(result).toBeNull();
      });

      test('should return null with empty lists', () => {
        const result = checkCustomLists(
          'any prompt here',
          [],
          []
        );

        expect(result).toBeNull();
      });

      test('should return null with undefined lists', () => {
        const result = checkCustomLists('any prompt here');

        expect(result).toBeNull();
      });
    });

    describe('edge cases and validation', () => {
      test('should handle empty prompt', () => {
        const result = checkCustomLists(
          '',
          ['business meeting'],
          ['admin password']
        );

        expect(result).toBeNull();
      });

      test('should handle null prompt', () => {
        const result = checkCustomLists(
          null,
          ['business meeting'],
          ['admin password']
        );

        expect(result).toBeNull();
      });

      test('should handle undefined prompt', () => {
        const result = checkCustomLists(
          undefined,
          ['business meeting'],
          ['admin password']
        );

        expect(result).toBeNull();
      });

      test('should handle non-string prompt', () => {
        const result = checkCustomLists(
          123,
          ['business meeting'],
          ['admin password']
        );

        expect(result).toBeNull();
      });

      test('should skip empty string phrases in lists', () => {
        const result = checkCustomLists(
          'business meeting',
          ['', 'business meeting'],
          ['']
        );

        expect(result.type).toBe('whitelist');
        expect(result.matchedPhrase).toBe('business meeting');
      });

      test('should skip non-string phrases in lists', () => {
        const result = checkCustomLists(
          'business meeting',
          [123, null, 'business meeting', undefined],
          [null, 456]
        );

        expect(result.type).toBe('whitelist');
        expect(result.matchedPhrase).toBe('business meeting');
      });
    });
  });

  describe('getMatchDescription', () => {
    test('should describe blacklist match', () => {
      const match = {
        type: 'blacklist',
        matchedPhrase: 'admin password',
        confidence: 0.9,
        source: 'custom_blacklist'
      };

      const description = getMatchDescription(match);

      expect(description).toContain('blacklist');
      expect(description).toContain('admin password');
    });

    test('should describe whitelist match', () => {
      const match = {
        type: 'whitelist',
        matchedPhrase: 'business meeting',
        confidence: 0.8,
        source: 'custom_whitelist'
      };

      const description = getMatchDescription(match);

      expect(description).toContain('whitelist');
      expect(description).toContain('business meeting');
    });

    test('should handle null match', () => {
      const description = getMatchDescription(null);

      expect(description).toBe('No custom list match');
    });

    test('should handle undefined match', () => {
      const description = getMatchDescription(undefined);

      expect(description).toBe('No custom list match');
    });

    test('should handle unknown match type', () => {
      const match = {
        type: 'unknown',
        matchedPhrase: 'test'
      };

      const description = getMatchDescription(match);

      expect(description).toBe('Unknown match type');
    });
  });

  describe('phraseMatches', () => {
    test('should match phrase in prompt', () => {
      expect(phraseMatches('business meeting today', 'business meeting')).toBe(true);
    });

    test('should match case-insensitively', () => {
      expect(phraseMatches('BUSINESS MEETING', 'business meeting')).toBe(true);
      expect(phraseMatches('business meeting', 'BUSINESS MEETING')).toBe(true);
    });

    test('should match substring', () => {
      expect(phraseMatches('schedule a business meeting for next week', 'business meeting')).toBe(true);
    });

    test('should return false when phrase not in prompt', () => {
      expect(phraseMatches('team discussion', 'business meeting')).toBe(false);
    });

    test('should return false for empty prompt', () => {
      expect(phraseMatches('', 'business meeting')).toBe(false);
    });

    test('should return false for empty phrase', () => {
      expect(phraseMatches('business meeting', '')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(phraseMatches(123, 'business meeting')).toBe(false);
      expect(phraseMatches('business meeting', 123)).toBe(false);
      expect(phraseMatches(null, 'business meeting')).toBe(false);
      expect(phraseMatches('business meeting', null)).toBe(false);
    });
  });
});
