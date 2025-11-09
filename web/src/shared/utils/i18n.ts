/**
 * Internationalization (i18n) utility for Web
 * Supports French, German, and English translations
 */

import { I18n } from 'i18n-js';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import en from '../locales/en.json';

/**
 * Supported languages
 */
export type Language = 'fr' | 'de' | 'en';

/**
 * Storage key for language preference
 */
const LANGUAGE_STORAGE_KEY = 'metapharm:language';

/**
 * Initialize i18n instance
 */
const i18n = new I18n({
  fr,
  de,
  en,
});

/**
 * Set default language to French (Swiss primary language)
 */
i18n.defaultLocale = 'fr';
i18n.locale = 'fr';

/**
 * Enable fallback to default locale
 */
i18n.enableFallback = true;

/**
 * Get browser locale
 */
export const getBrowserLocale = (): Language => {
  const browserLocale = navigator.language.split('-')[0];
  // Map to supported languages
  if (browserLocale === 'fr' || browserLocale === 'de' || browserLocale === 'en') {
    return browserLocale;
  }
  return 'fr'; // Default to French for Swiss market
};

/**
 * Get stored language preference
 */
export const getStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (stored === 'fr' || stored === 'de' || stored === 'en')) {
      return stored as Language;
    }
  } catch (error) {
    console.error('Error reading stored language:', error);
  }
  return getBrowserLocale();
};

/**
 * Set language preference
 */
export const setLanguage = (language: Language): void => {
  try {
    i18n.locale = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

/**
 * Initialize i18n with stored or browser locale
 */
export const initI18n = (): void => {
  const language = getStoredLanguage();
  i18n.locale = language;
};

/**
 * Translate a key
 */
export const t = (key: string, options?: Record<string, any>): string => {
  return i18n.t(key, options);
};

/**
 * Get current locale
 */
export const getCurrentLocale = (): Language => {
  return i18n.locale as Language;
};

/**
 * Check if key exists
 */
export const hasTranslation = (key: string): boolean => {
  return i18n.t(key) !== key;
};

/**
 * Export i18n instance for advanced usage
 */
export { i18n };

/**
 * Export default
 */
export default {
  t,
  setLanguage,
  getStoredLanguage,
  getCurrentLocale,
  initI18n,
  hasTranslation,
};
