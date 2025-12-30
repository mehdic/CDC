import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import frCH from './locales/fr-CH/common.json';
import frCHAuth from './locales/fr-CH/auth.json';
import frCHAppointments from './locales/fr-CH/appointments.json';
import frCHMessaging from './locales/fr-CH/messaging.json';
import frCHPrescriptions from './locales/fr-CH/prescriptions.json';

import deCH from './locales/de-CH/common.json';
import deCHAuth from './locales/de-CH/auth.json';
import deCHAppointments from './locales/de-CH/appointments.json';
import deCHMessaging from './locales/de-CH/messaging.json';
import deCHPrescriptions from './locales/de-CH/prescriptions.json';

import itCH from './locales/it-CH/common.json';
import itCHAuth from './locales/it-CH/auth.json';
import itCHAppointments from './locales/it-CH/appointments.json';
import itCHMessaging from './locales/it-CH/messaging.json';
import itCHPrescriptions from './locales/it-CH/prescriptions.json';

/**
 * i18n configuration for MetaPharm Connect
 * Supports French (fr-CH), German (de-CH), and Italian (it-CH)
 * Uses browser language detection with fallback to French
 */

const resources = {
  'fr-CH': {
    common: frCH,
    auth: frCHAuth,
    appointments: frCHAppointments,
    messaging: frCHMessaging,
    prescriptions: frCHPrescriptions,
  },
  'de-CH': {
    common: deCH,
    auth: deCHAuth,
    appointments: deCHAppointments,
    messaging: deCHMessaging,
    prescriptions: deCHPrescriptions,
  },
  'it-CH': {
    common: itCH,
    auth: itCHAuth,
    appointments: itCHAppointments,
    messaging: itCHMessaging,
    prescriptions: itCHPrescriptions,
  },
};

const languageDetectorOptions = {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
  lookupLocalStorage: 'i18nLanguage',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr-CH',
    defaultNS: 'common',
    ns: ['common', 'auth', 'appointments', 'messaging', 'prescriptions'],
    resources,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: languageDetectorOptions,
    react: {
      useSuspense: true,
      transEmptyNodeValue: '',
    },
  });

export default i18n;
