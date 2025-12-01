import { SupportedLanguage } from '../types/voice.types';

/**
 * Language Detection Service
 * Detects the language of voice transcription content
 * Supports Swiss 4-language detection: French, German, Italian, Romansh
 */
export class LanguageDetectionService {
  private languagePatterns: Record<SupportedLanguage, RegExp>;
  private supportedLanguages: Set<SupportedLanguage>;
  private defaultLanguage: SupportedLanguage;

  constructor(config: {
    supportedLanguages: SupportedLanguage[];
    defaultLanguage: SupportedLanguage;
  }) {
    this.languagePatterns = {
      [SupportedLanguage.FRENCH]: /\b(bonjour|merci|comment|savez|allez|ou|pour|avec)\b/gi,
      [SupportedLanguage.GERMAN]: /\b(guten|danke|wie|sprechen|mit|und|der|das)\b/gi,
      [SupportedLanguage.ITALIAN]: /\b(ciao|grazie|come|stai|mi|per|con|del)\b/gi,
      [SupportedLanguage.ROMANSH]: /\b(salut|grazia|tgina|chi|sche|cun)\b/gi,
    };

    this.supportedLanguages = new Set(config.supportedLanguages);
    this.defaultLanguage = config.defaultLanguage;
  }

  detectLanguage(text: string): SupportedLanguage {
    if (!text || text.trim().length === 0) {
      return this.defaultLanguage;
    }

    const scores: Record<SupportedLanguage, number> = {} as Record<
      SupportedLanguage,
      number
    >;

    Object.entries(this.languagePatterns).forEach(([lang, pattern]) => {
      const matches = text.match(pattern);
      scores[lang as SupportedLanguage] = matches ? matches.length : 0;
    });

    let detectedLanguage: SupportedLanguage | null = null;
    let maxScore = -1;

    Object.entries(scores).forEach(([lang, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang as SupportedLanguage;
      }
    });

    // If no language matched (all scores 0), return default
    if (maxScore === 0 || !detectedLanguage) {
      return this.defaultLanguage;
    }

    return detectedLanguage;
  }

  detectLanguageWithContext(
    text?: string,
    userPreferredLanguage?: SupportedLanguage,
  ): SupportedLanguage {
    if (userPreferredLanguage && this.isSupported(userPreferredLanguage)) {
      if (text) {
        const detectedLang = this.detectLanguage(text);
        if (detectedLang === userPreferredLanguage) {
          return detectedLang;
        }
        return userPreferredLanguage;
      }
      return userPreferredLanguage;
    }

    if (text) {
      return this.detectLanguage(text);
    }

    return this.defaultLanguage;
  }

  isSupported(language: string): boolean {
    return this.supportedLanguages.has(language as SupportedLanguage);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.supportedLanguages);
  }

  getDefaultLanguage(): SupportedLanguage {
    return this.defaultLanguage;
  }

  addLanguagePattern(language: SupportedLanguage, pattern: RegExp): void {
    if (this.isSupported(language)) {
      this.languagePatterns[language] = pattern;
    }
  }

  setDefaultLanguage(language: SupportedLanguage): void {
    if (this.isSupported(language)) {
      this.defaultLanguage = language;
    }
  }

  getConfidenceScore(text: string, language: SupportedLanguage): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    const pattern = this.languagePatterns[language];
    if (!pattern) {
      return 0;
    }

    const matches = text.match(pattern);
    const matchCount = matches ? matches.length : 0;
    const words = text.split(/\s+/).length;

    const score = Math.min(matchCount / Math.max(words, 1), 1.0);
    return Number(score.toFixed(2));
  }
}
