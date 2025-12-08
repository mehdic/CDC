import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './language-switcher.css';

/**
 * LanguageSwitcher Component
 *
 * Allows users to switch between French (fr-CH), German (de-CH), and Italian (it-CH)
 * Supports all three Swiss official languages
 */

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'fr-CH',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'de-CH',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'it-CH',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
];

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'button-group' | 'inline';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = AVAILABLE_LANGUAGES.find(
    lang => lang.code === i18n.language
  ) || AVAILABLE_LANGUAGES[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Save preference to localStorage
    localStorage.setItem('i18nLanguage', languageCode);
    setIsOpen(false);

    // Announce language change to screen readers
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = `Language changed to ${language.nativeName}`;
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  const renderLanguageLabel = (lang: LanguageOption): string => {
    const parts = [];
    if (showFlags) parts.push(lang.flag);
    parts.push(showNativeNames ? lang.nativeName : lang.name);
    return parts.join(' ');
  };

  if (variant === 'dropdown') {
    return (
      <div className={`language-switcher dropdown ${className}`}>
        <button
          className="language-switcher-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Change language"
        >
          {renderLanguageLabel(currentLanguage)}
          <svg
            className="dropdown-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <ul className="language-switcher-menu" role="listbox">
            {AVAILABLE_LANGUAGES.map(lang => (
              <li key={lang.code} role="option" aria-selected={lang.code === i18n.language}>
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`language-option ${
                    lang.code === i18n.language ? 'active' : ''
                  }`}
                >
                  {renderLanguageLabel(lang)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (variant === 'button-group') {
    return (
      <div className={`language-switcher button-group ${className}`}>
        <fieldset>
          <legend className="sr-only">Select language</legend>
          <div className="button-group-buttons" role="group">
            {AVAILABLE_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-button ${
                  lang.code === i18n.language ? 'active' : ''
                }`}
                aria-pressed={lang.code === i18n.language}
                aria-label={`Switch to ${lang.nativeName}`}
              >
                {renderLanguageLabel(lang)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  // inline variant
  return (
    <div className={`language-switcher inline ${className}`}>
      <nav aria-label="Language selection">
        <ul className="language-list">
          {AVAILABLE_LANGUAGES.map(lang => (
            <li key={lang.code}>
              {lang.code === i18n.language ? (
                <span className="language-current" aria-current="page">
                  {renderLanguageLabel(lang)}
                </span>
              ) : (
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className="language-link"
                  aria-label={`Switch to ${lang.nativeName}`}
                >
                  {renderLanguageLabel(lang)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default LanguageSwitcher;
