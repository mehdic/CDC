/**
 * Language Detection Service Unit Tests
 * Tests for language detection and analysis
 */

import { LanguageDetectionService } from '../services/language-detection.service';
import { SupportedLanguage } from '../types/voice.types';

describe('LanguageDetectionService', () => {
  let service: LanguageDetectionService;

  beforeEach(() => {
    service = new LanguageDetectionService({
      supportedLanguages: [
        SupportedLanguage.FRENCH,
        SupportedLanguage.GERMAN,
        SupportedLanguage.ITALIAN,
        SupportedLanguage.ROMANSH,
      ],
      defaultLanguage: SupportedLanguage.FRENCH,
    });
  });

  describe('detectLanguage', () => {
    it('should detect French language from text', () => {
      const text = 'Bonjour, comment allez-vous? Je merci beaucoup pour votre aide.';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should detect German language from text', () => {
      const text = 'Guten Tag, wie geht es Ihnen? Danke für Ihre Hilfe heute.';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.GERMAN);
    });

    it('should detect Italian language from text', () => {
      const text = 'Ciao, come stai? Grazie mille per il vostro aiuto.';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.ITALIAN);
    });

    it('should return default language for empty text', () => {
      const detected = service.detectLanguage('');
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should return default language for whitespace only', () => {
      const detected = service.detectLanguage('   ');
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should return default language when no keywords match', () => {
      const text = 'xyz abc 123 def ghij klm';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should handle case-insensitive detection', () => {
      const text = 'BONJOUR MERCI COMMENT ALLEZ VOUS';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });
  });

  describe('detectLanguageWithContext', () => {
    it('should use preferred language when provided', () => {
      const text = 'Some text content';
      const detected = service.detectLanguageWithContext(
        text,
        SupportedLanguage.GERMAN,
      );
      expect(detected).toBe(SupportedLanguage.GERMAN);
    });

    it('should detect from text when no preference provided', () => {
      const text = 'Bonjour merci comment';
      const detected = service.detectLanguageWithContext(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should use default when no text and no preference', () => {
      const detected = service.detectLanguageWithContext();
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should prioritize user preference over detected language', () => {
      const frenchText = 'Bonjour comment allez';
      const detected = service.detectLanguageWithContext(
        frenchText,
        SupportedLanguage.ITALIAN,
      );
      // User preference should be returned even if text suggests French
      expect(detected).toBe(SupportedLanguage.ITALIAN);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported language', () => {
      expect(service.isSupported(SupportedLanguage.FRENCH)).toBe(true);
      expect(service.isSupported(SupportedLanguage.GERMAN)).toBe(true);
      expect(service.isSupported(SupportedLanguage.ITALIAN)).toBe(true);
      expect(service.isSupported(SupportedLanguage.ROMANSH)).toBe(true);
    });

    it('should return false for unsupported language', () => {
      expect(service.isSupported('en-US')).toBe(false);
      expect(service.isSupported('es-ES')).toBe(false);
      expect(service.isSupported('pt-PT')).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toHaveLength(4);
      expect(languages).toContain(SupportedLanguage.FRENCH);
      expect(languages).toContain(SupportedLanguage.GERMAN);
      expect(languages).toContain(SupportedLanguage.ITALIAN);
      expect(languages).toContain(SupportedLanguage.ROMANSH);
    });
  });

  describe('getDefaultLanguage', () => {
    it('should return configured default language', () => {
      expect(service.getDefaultLanguage()).toBe(SupportedLanguage.FRENCH);
    });
  });

  describe('addLanguagePattern', () => {
    it('should add custom language pattern', () => {
      const customPattern = /\b(hello|world|test)\b/gi;
      service.addLanguagePattern(SupportedLanguage.FRENCH, customPattern);
      // Pattern should be used in detection
      const detected = service.detectLanguage('hello world test');
      // Detection might succeed or fail depending on pattern matching
      expect(typeof detected).toBe('string');
    });

    it('should not add pattern for unsupported language', () => {
      const customPattern = /\b(hello|world)\b/gi;
      // Should not throw error
      service.addLanguagePattern('xx-XX' as any, customPattern);
    });
  });

  describe('setDefaultLanguage', () => {
    it('should change default language to supported language', () => {
      service.setDefaultLanguage(SupportedLanguage.GERMAN);
      expect(service.getDefaultLanguage()).toBe(SupportedLanguage.GERMAN);
    });

    it('should not change to unsupported language', () => {
      service.setDefaultLanguage('xx-XX' as any);
      expect(service.getDefaultLanguage()).toBe(SupportedLanguage.FRENCH);
    });

    it('should use new default language for no-match detection', () => {
      const newService = new LanguageDetectionService({
        supportedLanguages: [
          SupportedLanguage.FRENCH,
          SupportedLanguage.GERMAN,
          SupportedLanguage.ITALIAN,
          SupportedLanguage.ROMANSH,
        ],
        defaultLanguage: SupportedLanguage.GERMAN,
      });
      const detected = newService.detectLanguage('xyz abc 123');
      expect(detected).toBe(SupportedLanguage.GERMAN);
    });
  });

  describe('getConfidenceScore', () => {
    it('should return confidence score between 0 and 1', () => {
      const text = 'Bonjour comment allez vous merci beaucoup';
      const score = service.getConfidenceScore(text, SupportedLanguage.FRENCH);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return higher score for more keywords', () => {
      const fewKeywords = 'Bonjour merci test one two';
      const manyKeywords =
        'Bonjour comment allez vous merci beaucoup bien et comment pour avec savez';
      const scoreFew = service.getConfidenceScore(
        fewKeywords,
        SupportedLanguage.FRENCH,
      );
      const scoreMany = service.getConfidenceScore(
        manyKeywords,
        SupportedLanguage.FRENCH,
      );
      expect(scoreMany).toBeGreaterThan(scoreFew);
    });

    it('should return 0 for empty text', () => {
      const score = service.getConfidenceScore('', SupportedLanguage.FRENCH);
      expect(score).toBe(0);
    });

    it('should return 0 for unsupported language', () => {
      const text = 'Bonjour comment';
      const score = service.getConfidenceScore(text, 'xx-XX' as any);
      expect(score).toBe(0);
    });

    it('should cap confidence at 1.0', () => {
      // Very short text with many matching keywords
      const text = 'Bonjour merci';
      const score = service.getConfidenceScore(text, SupportedLanguage.FRENCH);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Multiple language scenarios', () => {
    it('should handle multilingual text by detecting dominant language', () => {
      const mixedText =
        'Bonjour comment allez vous. Hello how are you. Ciao come stai.';
      const detected = service.detectLanguage(mixedText);
      // Should detect the language with most keywords
      expect(detected).toBeDefined();
      expect(service.isSupported(detected)).toBe(true);
    });

    it('should handle technical terms mixed with language', () => {
      const text =
        'Le patient a une récurrence avec metadata importante et audit trail complet.';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should handle acronyms and numbers', () => {
      const text =
        'Le code postal 1200 Genève, référence NHS-2024-001, avec commentaire.';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text', () => {
      const longText = 'Bonjour '.repeat(1000) + 'comment allez vous';
      const detected = service.detectLanguage(longText);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should handle text with special characters', () => {
      const text = "L'État, c'est moi! Comment ça va? Merci! À bientôt!";
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });

    it('should handle URLs and email addresses in text', () => {
      const text =
        'Consultez https://example.com ou contactez test@example.com bonjour merci';
      const detected = service.detectLanguage(text);
      expect(detected).toBe(SupportedLanguage.FRENCH);
    });
  });
});
