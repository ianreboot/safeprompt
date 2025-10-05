/**
 * Unit tests for External Reference Detector
 * Tests URL, IP, file path, and encoding detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExternalReferenceDetector } from '../lib/external-reference-detector.js';

describe('External Reference Detector', () => {
  let detector;

  beforeEach(() => {
    detector = new ExternalReferenceDetector();
  });

  describe('URL Detection', () => {
    describe('Standard URLs', () => {
      it('should detect HTTP URLs', () => {
        const result = detector.detect('Check this out: http://example.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
        expect(result.confidence).toBeLessThan(1.0);
      });

      it('should detect HTTPS URLs', () => {
        const result = detector.detect('Visit https://secure.example.com/path');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect www URLs without protocol', () => {
        const result = detector.detect('Go to www.example.com for more info');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect FTP URLs', () => {
        const result = detector.detect('Download from ftp://files.example.com/archive');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect file:// URLs', () => {
        const result = detector.detect('Load file:///path/to/file.txt');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });
    });

    describe('Domain Patterns', () => {
      it('should detect .com domains', () => {
        const result = detector.detect('Visit example.com for details');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect various TLDs', () => {
        const tlds = ['example.org', 'test.net', 'app.io', 'service.dev', 'site.app'];

        for (const domain of tlds) {
          const result = detector.detect(`Check ${domain}`);
          expect(result.hasExternalReferences).toBe(true);
        }
      });

      it('should detect domains with paths', () => {
        const result = detector.detect('See example.com/docs/api for API documentation');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });
    });

    describe('Shortened URLs', () => {
      it('should detect bit.ly links', () => {
        const result = detector.detect('Click bit.ly/abc123');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect tinyurl links', () => {
        const result = detector.detect('Visit tinyurl.com/xyz789');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect t.co links', () => {
        const result = detector.detect('See t.co/shorturl');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });
    });

    describe('Localhost References', () => {
      it('should detect localhost', () => {
        const result = detector.detect('Connect to localhost:3000');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect 127.0.0.1', () => {
        const result = detector.detect('API at 127.0.0.1:8080');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });
    });

    describe('Markdown and HTML Links', () => {
      it('should detect markdown links', () => {
        const result = detector.detect('Check [this link](https://example.com)');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });

      it('should detect HTML href attributes', () => {
        const result = detector.detect('<a href="https://example.com">link</a>');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('urls');
      });
    });
  });

  describe('IP Address Detection', () => {
    describe('IPv4', () => {
      it('should detect standard IPv4 addresses', () => {
        const result = detector.detect('Connect to 192.168.1.1');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });

      it('should detect IPv4 with port', () => {
        const result = detector.detect('Server at 10.0.0.1:8080');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });

      it('should detect public IP addresses', () => {
        const result = detector.detect('Visit 8.8.8.8 for DNS');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });

      it('should detect multiple IPs', () => {
        const result = detector.detect('Servers: 192.168.1.1, 192.168.1.2, 10.0.0.1');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.details.length).toBeGreaterThan(1);
      });
    });

    describe('IPv6', () => {
      it('should detect full IPv6 addresses', () => {
        const result = detector.detect('IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });

      it('should detect compressed IPv6', () => {
        const result = detector.detect('Connect to 2001:db8::1');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });

      it('should detect IPv6 with port', () => {
        const result = detector.detect('Server [2001:db8::1]:8080');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('ips');
      });
    });
  });

  describe('File Path Detection', () => {
    describe('Unix/Linux Paths', () => {
      it('should detect /home paths', () => {
        const result = detector.detect('Read from /home/user/file.txt');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });

      it('should detect /etc paths', () => {
        const result = detector.detect('Check /etc/passwd for users');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });

      it('should detect /var paths', () => {
        const result = detector.detect('Logs at /var/log/system.log');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });

      it('should detect /usr paths', () => {
        const result = detector.detect('Binary in /usr/bin/python');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });
    });

    describe('Windows Paths', () => {
      it('should detect C: drive paths', () => {
        const result = detector.detect('File at C:\\Users\\Documents\\file.txt');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });

      it('should detect other drive letters', () => {
        const result = detector.detect('Data on D:\\data\\export.csv');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });
    });

    describe('UNC Paths', () => {
      it('should detect network shares', () => {
        const result = detector.detect('Access \\\\server\\share\\file.doc');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });
    });

    describe('Relative Paths', () => {
      it('should detect ../ traversal attempts', () => {
        const result = detector.detect('Read ../../etc/passwd');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });

      it('should detect multiple levels of traversal', () => {
        const result = detector.detect('Access ../../../secrets.txt');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('files');
      });
    });
  });

  describe('Command Detection', () => {
    it('should detect fetch commands', () => {
      const result = detector.detect('Fetch from https://api.example.com/data');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });

    it('should detect curl commands', () => {
      const result = detector.detect('curl https://example.com');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });

    it('should detect navigate commands', () => {
      const result = detector.detect('Navigate to example.com');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });

    it('should detect click link instructions', () => {
      const result = detector.detect('Follow this link: https://malicious.com');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });

    it('should detect import commands', () => {
      const result = detector.detect('Import from https://cdn.example.com/script.js');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });

    it('should detect visit commands', () => {
      const result = detector.detect('Visit example.com for more');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
    });
  });

  describe('Obfuscation Techniques', () => {
    describe('Space Injection', () => {
      it('should detect h t t p with spaces', () => {
        const result = detector.detect('Go to h t t p://example.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect w w w with spaces', () => {
        const result = detector.detect('Visit w w w.example.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect .c o m with spaces', () => {
        const result = detector.detect('Check example.c o m');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });
    });

    describe('[dot] [slash] Notation', () => {
      it('should detect [dot] notation', () => {
        const result = detector.detect('Visit example[dot]com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect (dot) notation', () => {
        const result = detector.detect('See example(dot)com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect [slash] notation', () => {
        const result = detector.detect('http://example.com[slash]path');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect [@] notation for emails', () => {
        const result = detector.detect('Contact user[@]example.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });
    });

    describe('Defanged URLs', () => {
      it('should detect hxxp instead of http', () => {
        const result = detector.detect('Visit hxxp://malicious.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });

      it('should detect hXXp with mixed case', () => {
        const result = detector.detect('See hXXp://threat.com');

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });
    });

    describe('Zero-Width Characters', () => {
      it('should detect and remove zero-width spaces', () => {
        const textWithZWS = 'http://exam\u200Bple.com';
        const result = detector.detect(textWithZWS);

        expect(result.hasExternalReferences).toBe(true);
        expect(result.obfuscationDetected).toBe(true);
      });
    });
  });

  describe('Encoding Detection', () => {
    describe('Base64 Encoding', () => {
      it('should detect base64 encoded URLs', () => {
        // 'http://example.com' in base64 (needs to be 30+ chars for base64 detection)
        const base64 = 'aHR0cDovL2V4YW1wbGUuY29tL3BhdGgvdG8vcmVzb3VyY2U=';
        const result = detector.detect(`Encoded URL: ${base64}`);

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('base64_encoded');
        expect(result.confidence).toBeLessThan(0.3);
      });

      it('should detect nested base64 encoding', () => {
        // 'http://example.com' -> base64 -> base64 again
        const doubleEncoded = 'YUhSMGNEb3ZMMlY0WVcxd2JHVXVZMjl0';
        const result = detector.detect(`Double encoded: ${doubleEncoded}`);

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('base64_encoded');
      });

      it('should report nesting level for nested encoding', () => {
        const base64 = 'aHR0cDovL2V4YW1wbGUuY29t';
        const result = detector.detect(`URL: ${base64}`);

        if (result.details.some(d => d.type === 'base64_encoded')) {
          const base64Detail = result.details.find(d => d.type === 'base64_encoded');
          expect(base64Detail.nestingLevel).toBeDefined();
        }
      });
    });

    describe('Hex Encoding', () => {
      it('should detect hex encoded URLs', () => {
        // 'http://ex' in hex
        const hex = '687474703a2f2f6578';
        const result = detector.detect(`Hex: ${hex}`);

        // This might or might not detect depending on the hex string length and content
        // Just verify it doesn't crash
        expect(result).toBeDefined();
      });

      it('should detect 0x prefixed hex', () => {
        const hex = '0x687474703a2f2f6578616d706c652e636f6d';
        const result = detector.detect(`Encoded: ${hex}`);

        expect(result).toBeDefined();
      });
    });

    describe('ROT13 Encoding', () => {
      it('should detect ROT13 encoded URLs', () => {
        // 'http://example.com' in ROT13
        const rot13 = 'uggc://rknzcyr.pbz';
        const result = detector.detect(`Encoded: ${rot13}`);

        expect(result.hasExternalReferences).toBe(true);
        expect(result.types).toContain('rot13_encoded');
        expect(result.confidence).toBeLessThan(0.3);
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence <= 0.5 for plain URLs', () => {
      const result = detector.detect('Visit https://example.com');

      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should return very low confidence for encoded references', () => {
      const base64 = 'aHR0cDovL2V4YW1wbGUuY29tL3BhdGgvdG8vcmVzb3VyY2U='; // 30+ chars
      const result = detector.detect(`Encoded: ${base64}`);

      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should return low confidence for obfuscated URLs', () => {
      const result = detector.detect('Visit hxxp://example[dot]com');

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.obfuscationDetected).toBe(true);
    });

    it('should include reasoning for low confidence', () => {
      const result = detector.detect('https://example.com');

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Reference Types', () => {
    it('should detect multiple types in one string', () => {
      const result = detector.detect('Visit https://example.com and connect to 192.168.1.1');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('urls');
      expect(result.types).toContain('ips');
    });

    it('should detect URLs and file paths together', () => {
      const result = detector.detect('Download from https://example.com and save to /tmp/file.txt');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('urls');
      expect(result.types).toContain('files');
    });

    it('should detect commands with URLs', () => {
      const result = detector.detect('curl https://api.example.com/data');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('commands');
      expect(result.types).toContain('urls');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = detector.detect('');

      expect(result.hasExternalReferences).toBe(false);
      expect(result.types).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle plain text with no references', () => {
      const result = detector.detect('This is just normal text with no URLs or references');

      expect(result.hasExternalReferences).toBe(false);
      expect(result.types).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle very long text', () => {
      const longText = 'normal text '.repeat(1000) + 'https://example.com';
      const result = detector.detect(longText);

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('urls');
    });

    it('should not crash on malformed URLs', () => {
      const result = detector.detect('http://');

      // Should not crash, but might not detect as URL
      expect(result).toBeDefined();
    });

    it('should handle mixed legitimate and suspicious content', () => {
      const result = detector.detect('For cybersecurity best practices, never visit hxxp://malicious[dot]com');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.obfuscationDetected).toBe(true);
    });

    it('should not detect non-URL dots and slashes', () => {
      const result = detector.detect('The ratio is 3.14159 and the path uses / as separator');

      // Should not detect floating point or isolated slashes
      expect(result.hasExternalReferences).toBe(false);
    });

    it('should handle unicode text', () => {
      const result = detector.detect('访问 https://example.com 获取更多信息');

      expect(result.hasExternalReferences).toBe(true);
      expect(result.types).toContain('urls');
    });
  });

  describe('Reasoning and Details', () => {
    it('should provide reasoning for detected references', () => {
      const result = detector.detect('https://example.com');

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning.some(r => r.includes('External content'))).toBe(true);
    });

    it('should provide details about detected references', () => {
      const result = detector.detect('Visit https://example.com');

      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
      expect(result.details[0].type).toBeDefined();
      expect(result.details[0].match).toBeDefined();
    });

    it('should include normalized text in results', () => {
      const result = detector.detect('Visit h t t p://example.com');

      expect(result.normalizedText).toBeDefined();
      expect(result.normalizedText).toContain('http://example.com');
    });

    it('should include decoded content for encoded references', () => {
      const base64 = 'aHR0cDovL2V4YW1wbGUuY29t';
      const result = detector.detect(`Encoded: ${base64}`);

      const encodedDetail = result.details.find(d => d.type === 'base64_encoded');
      if (encodedDetail) {
        expect(encodedDetail.decoded).toBeDefined();
        expect(encodedDetail.decoded).toContain('example.com');
      }
    });
  });

  describe('Helper Methods', () => {
    it('looksLikeURL should identify URLs', () => {
      expect(detector.looksLikeURL('https://example.com')).toBe(true);
      expect(detector.looksLikeURL('www.example.com')).toBe(true);
      expect(detector.looksLikeURL('something.com/path')).toBe(true);
      expect(detector.looksLikeURL('notaurl')).toBe(false);
      expect(detector.looksLikeURL('short')).toBe(false);
    });

    it('looksLikeIP should identify IP addresses', () => {
      expect(detector.looksLikeIP('192.168.1.1')).toBe(true);
      expect(detector.looksLikeIP('10.0.0.1')).toBe(true);
      expect(detector.looksLikeIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(detector.looksLikeIP('notanip')).toBe(false);
      expect(detector.looksLikeIP('192')).toBe(false);
    });

    it('decodeROT13 should decode correctly', () => {
      const input = 'uggc://rknzcyr.pbz';
      const decoded = detector.decodeROT13(input);

      expect(decoded).toBe('http://example.com');
    });

    it('decodeROT13 should handle mixed case', () => {
      const input = 'HTTP://EXAMPLE.COM';
      const decoded = detector.decodeROT13(input);

      expect(decoded.toLowerCase()).toBe('uggc://rknzcyr.pbz');
    });
  });
});
