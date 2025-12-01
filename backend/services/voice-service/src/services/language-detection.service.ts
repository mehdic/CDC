/**
 * Language Detection Service
 * Detects and validates languages in voice transcriptions
 * Supports Swiss multilingual environment: French, German, Italian, Romansh
 */

import { SupportedLanguage, LanguageDetectionConfig } from '../types/voice.types';

export class LanguageDetectionService {
  private supportedLanguages: SupportedLanguage[] = [
    SupportedLanguage.FRENCH,
    SupportedLanguage.GERMAN,
    SupportedLanguage.ITALIAN,
    SupportedLanguage.ROMANSH,
  ];

  private languagePatterns = {
    [SupportedLanguage.FRENCH]: {
      articles: ['le', 'la', 'les', 'un', 'une', 'des'],
      commonWords: ['et', 'de', 'à', 'le', 'que', 'qu'],
      stopWords: ['est', 'sont', 'être', 'avoir', 'ce', 'qui'],
      pattern: /\b(le|la|les|un|une|des|et|de|à|que|qu|est|sont|être|avoir|ce|qui)\b/gi,
    },
    [SupportedLanguage.GERMAN]: {
      articles: ['der', 'die', 'das', 'den', 'dem', 'des'],
      commonWords: ['und', 'der', 'die', 'das', 'in', 'von'],
      stopWords: ['ist', 'sind', 'sein', 'haben', 'dieser', 'diese'],
      pattern: /\b(der|die|das|den|dem|des|und|in|von|ist|sind|sein|haben)\b/gi,
    },
    [SupportedLanguage.ITALIAN]: {
      articles: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una'],
      commonWords: ['di', 'da', 'a', 'per', 'con', 'in'],
      stopWords: ['è', 'sono', 'essere', 'avere', 'questo', 'questa'],
      pattern: /\b(il|lo|la|i|gli|le|un|uno|una|di|da|a|per|con|in|è|sono)\b/gi,
    },
    [SupportedLanguage.ROMANSH]: {
      articles: ['il', 'la', 'ils', 'las'],
      commonWords: ['e', 'da', 'a', 'in', 'sin'],
      stopWords: ['è', 'essan', 'tegnir', 'haver'],
      pattern: /\b(il|la|ils|las|e|da|a|in|sin|è|essan)\b/gi,
    },
  };

  constructor(config?: LanguageDetectionConfig) {
    if (config?.supportedLanguages) {
      this.supportedLanguages = config.supportedLanguages;
    }
  }

  /**
   * Detect language from transcribed text
   * Returns the detected language and confidence score
   */
  detectLanguage(text: string): { language: SupportedLanguage; confidence: number } {
    if (!text || text.trim().length < 20) {
      return {
        language: SupportedLanguage.FRENCH, // default fallback
        confidence: 0.3,
      };
    }

    const scores: Record<string, number> = {};

    // Calculate language scores based on pattern matching
    for (const lang of this.supportedLanguages) {
      const pattern = this.languagePatterns[lang];
      const matches = (text.match(pattern.pattern) || []).length;
      const words = text.split(/\s+/).length;
      scores[lang] = words > 0 ? matches / words : 0;
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLanguage = SupportedLanguage.FRENCH;

    for (const lang of this.supportedLanguages) {
      if ((scores[lang] || 0) > maxScore) {
        maxScore = scores[lang] || 0;
        detectedLanguage = lang;
      }
    }

    // Normalize confidence (0-1)
    const confidence = Math.min(maxScore, 1.0);

    return {
      language: detectedLanguage,
      confidence: confidence,
    };
  }

  /**
   * Validate if a language is supported
   */
  isSupported(language: SupportedLanguage): boolean {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }

  /**
   * Extract language metadata from text
   */
  analyzeLanguageContent(text: string, language: SupportedLanguage) {
    const analysis = {
      language,
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      hasNumbers: /\d/.test(text),
      hasPunctuation: /[.!?,;:—–-]/.test(text),
      hasUpperCase: /[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŒÆ]/.test(text),
      hasLowerCase: /[a-zàâäéèêëïîôöùûüœæ]/.test(text),
    };

    return analysis;
  }

  /**
   * Validate language consistency (checks if text matches expected language)
   */
  validateLanguageConsistency(text: string, expectedLanguage: SupportedLanguage): boolean {
    if (!text || text.trim().length < 20) {
      return true; // Skip validation for very short text
    }

    const detected = this.detectLanguage(text);
    // Accept if detected language matches expected or confidence is low (mixed content)
    return detected.language === expectedLanguage || detected.confidence < 0.5;
  }
}
