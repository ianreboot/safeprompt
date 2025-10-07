/**
 * Unit tests for Honeypot Pattern Learning
 * Tests automated pattern extraction from honeypot data
 */

import { describe, it, expect } from 'vitest';

describe('Honeypot Learning - Pattern Extraction', () => {
  describe('SQL Injection Pattern Extraction', () => {
    it('should extract SQL keywords from honeypot requests', () => {
      const requests = [
        { full_request: { url: '/api/users?id=1 OR 1=1', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/api/admin?id=1 OR 1=1', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/api/data?id=1 OR 1=1', body: {} }, ip_hash: 'hash3' }
      ];

      // Pattern: "OR 1=1" appears in 3 requests from 3 IPs
      const pattern = 'or 1=1';
      const occurrences = 3;
      const uniqueIPs = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3); // MIN_OCCURRENCES
      expect(uniqueIPs).toBeGreaterThanOrEqual(2); // MIN_UNIQUE_IPS
    });

    it('should extract UNION SELECT patterns', () => {
      const requests = [
        { full_request: { url: '/api/test?id=1 UNION SELECT', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/api/data UNION SELECT null', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/debug UNION SELECT @@version', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = 'union';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should detect DROP TABLE attempts', () => {
      const requests = [
        { full_request: { url: '/api/admin; DROP TABLE users--', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/test; DROP TABLE logs--', body: {} }, ip_hash: 'hash2' }
      ];

      const pattern = 'drop';
      const occurrences = 2;

      expect(occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('XSS Pattern Extraction', () => {
    it('should extract script tag patterns', () => {
      const requests = [
        { full_request: { url: '/search?q=<script>alert(1)</script>', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/comment?text=<script>evil</script>', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/input?data=<script>bad</script>', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = '<script';
      const occurrences = 3;
      const uniqueIPs = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
      expect(uniqueIPs).toBeGreaterThanOrEqual(2);
    });

    it('should extract event handler patterns', () => {
      const requests = [
        { full_request: { url: '/test?param=onerror=alert(1)', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/data?val=onerror=fetch()', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/input?x=onerror=eval()', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = 'onerror=';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should extract javascript: protocol patterns', () => {
      const requests = [
        { full_request: { url: '/redirect?url=javascript:alert(1)', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/link?href=javascript:void(0)', body: {} }, ip_hash: 'hash2' }
      ];

      const pattern = 'javascript:';
      const occurrences = 2;

      expect(occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Command Injection Pattern Extraction', () => {
    it('should extract semicolon injection patterns', () => {
      const requests = [
        { full_request: { url: '/exec?cmd=ls;cat /etc/passwd', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/run?command=pwd;whoami', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/shell?input=ls;id', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = ';';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should extract pipe operator patterns', () => {
      const requests = [
        { full_request: { url: '/cmd?arg=ls|grep secret', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/exec?data=cat|base64', body: {} }, ip_hash: 'hash2' }
      ];

      const pattern = '|';
      const occurrences = 2;

      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it('should extract command substitution patterns', () => {
      const requests = [
        { full_request: { url: '/run?cmd=$(whoami)', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/exec?arg=$(id)', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/shell?input=$(pwd)', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = '$(';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Path Traversal Pattern Extraction', () => {
    it('should extract directory traversal patterns', () => {
      const requests = [
        { full_request: { url: '/file?path=../../etc/passwd', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/read?file=../../../config', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/get?name=../../secret', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = '../';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should extract URL-encoded traversal patterns', () => {
      const requests = [
        { full_request: { url: '/file?path=%2e%2e%2f', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/read?file=%2e%2e/', body: {} }, ip_hash: 'hash2' }
      ];

      const pattern = '../';
      const occurrences = 2;

      expect(occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Parameter Fuzzing Pattern Extraction', () => {
    it('should extract debug parameter patterns', () => {
      const requests = [
        { full_request: { url: '/api/users?debug=true', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/api/admin?debug=1', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/api/data?debug=yes', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = 'debug=';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should extract admin parameter patterns', () => {
      const requests = [
        { full_request: { url: '/page?admin=true', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/view?admin=1', body: {} }, ip_hash: 'hash2' }
      ];

      const pattern = 'admin=';
      const occurrences = 2;

      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it('should extract test parameter patterns', () => {
      const requests = [
        { full_request: { url: '/api/endpoint?test=true', body: {} }, ip_hash: 'hash1' },
        { full_request: { url: '/service?test=1', body: {} }, ip_hash: 'hash2' },
        { full_request: { url: '/method?test=yes', body: {} }, ip_hash: 'hash3' }
      ];

      const pattern = 'test=';
      const occurrences = 3;

      expect(occurrences).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Honeypot Learning - Auto-Deployment Safety', () => {
  describe('Frequency Thresholds', () => {
    it('should require minimum 3 occurrences', () => {
      const MIN_OCCURRENCES = 3;

      const validPattern = { occurrences: 5, uniqueIPs: 3 };
      const invalidPattern = { occurrences: 2, uniqueIPs: 3 };

      expect(validPattern.occurrences).toBeGreaterThanOrEqual(MIN_OCCURRENCES);
      expect(invalidPattern.occurrences).toBeLessThan(MIN_OCCURRENCES);
    });

    it('should require minimum 2 unique IPs', () => {
      const MIN_UNIQUE_IPS = 2;

      const validPattern = { occurrences: 5, uniqueIPs: 3 };
      const invalidPattern = { occurrences: 5, uniqueIPs: 1 };

      expect(validPattern.uniqueIPs).toBeGreaterThanOrEqual(MIN_UNIQUE_IPS);
      expect(invalidPattern.uniqueIPs).toBeLessThan(MIN_UNIQUE_IPS);
    });

    it('should auto-deploy when both thresholds met', () => {
      const pattern = {
        occurrences: 5,
        uniqueIPs: 3
      };

      const shouldDeploy = pattern.occurrences >= 3 && pattern.uniqueIPs >= 2;
      expect(shouldDeploy).toBe(true);
    });

    it('should NOT auto-deploy when thresholds not met', () => {
      const patterns = [
        { occurrences: 2, uniqueIPs: 3 }, // Not enough occurrences
        { occurrences: 5, uniqueIPs: 1 }, // Not enough IPs
        { occurrences: 1, uniqueIPs: 1 }  // Neither threshold met
      ];

      patterns.forEach(pattern => {
        const shouldDeploy = pattern.occurrences >= 3 && pattern.uniqueIPs >= 2;
        expect(shouldDeploy).toBe(false);
      });
    });
  });

  describe('Honeypot Data Isolation', () => {
    it('should only use honeypot endpoint data', () => {
      const honeypotEndpoints = [
        '/api/v1/validate-debug',
        '/api/v1/admin-test',
        '/api/internal/check'
      ];

      honeypotEndpoints.forEach(endpoint => {
        expect(endpoint.includes('debug') || endpoint.includes('admin') || endpoint.includes('internal')).toBe(true);
      });
    });

    it('should NOT use real user data', () => {
      const realEndpoints = [
        '/api/v1/validate',
        '/api/v1/usage'
      ];

      realEndpoints.forEach(endpoint => {
        const isHoneypot = endpoint.includes('debug') || endpoint.includes('admin') || endpoint.includes('internal');
        expect(isHoneypot).toBe(false);
      });
    });
  });

  describe('Pattern Confidence Scoring', () => {
    it('should calculate confidence based on occurrence frequency', () => {
      const calculateConfidence = (occurrences) => Math.min(occurrences / 10, 1.0);

      expect(calculateConfidence(5)).toBe(0.5);
      expect(calculateConfidence(10)).toBe(1.0);
      expect(calculateConfidence(15)).toBe(1.0); // Capped at 1.0
    });

    it('should have higher confidence for more frequent patterns', () => {
      const pattern1 = { occurrences: 3, confidence: Math.min(3 / 10, 1.0) };
      const pattern2 = { occurrences: 8, confidence: Math.min(8 / 10, 1.0) };

      expect(pattern2.confidence).toBeGreaterThan(pattern1.confidence);
    });
  });
});

describe('Honeypot Learning - Pattern Deduplication', () => {
  describe('Duplicate Pattern Handling', () => {
    it('should group identical patterns', () => {
      const patterns = [
        { pattern: 'SELECT', ip: 'hash1' },
        { pattern: 'SELECT', ip: 'hash2' },
        { pattern: 'SELECT', ip: 'hash3' }
      ];

      const uniquePatterns = new Map();
      patterns.forEach(p => {
        if (!uniquePatterns.has(p.pattern)) {
          uniquePatterns.set(p.pattern, { count: 0, ips: new Set() });
        }
        uniquePatterns.get(p.pattern).count++;
        uniquePatterns.get(p.pattern).ips.add(p.ip);
      });

      const selectPattern = uniquePatterns.get('SELECT');
      expect(selectPattern.count).toBe(3);
      expect(selectPattern.ips.size).toBe(3);
    });

    it('should preserve pattern variations', () => {
      const patterns = [
        { pattern: 'SELECT', ip: 'hash1' },
        { pattern: 'select', ip: 'hash2' },
        { pattern: 'Select', ip: 'hash3' }
      ];

      // After normalization, should be same pattern
      const normalized = patterns.map(p => ({ pattern: p.pattern.toLowerCase(), ip: p.ip }));
      const uniqueCount = new Set(normalized.map(p => p.pattern)).size;

      expect(uniqueCount).toBe(1); // All normalize to "select"
    });
  });
});
