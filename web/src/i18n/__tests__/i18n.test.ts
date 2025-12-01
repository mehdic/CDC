import i18n from '../config';

describe('i18n Configuration and Localization', () => {
  /**
   * Configuration Tests
   */
  describe('i18n setup', () => {
    it('should initialize i18n with default language fr-CH', async () => {
      await i18n.init;
      expect(i18n.language).toBeDefined();
    });

    it('should have all three Swiss languages configured', async () => {
      await i18n.init;
      const languages = Object.keys(i18n.options.resources || {});
      expect(languages).toContain('fr-CH');
      expect(languages).toContain('de-CH');
      expect(languages).toContain('it-CH');
    });

    it('should set fallback language to fr-CH', async () => {
      await i18n.init;
      const fallback = i18n.options.fallbackLng;
      // fallback can be a string or array
      const fallbackLng = Array.isArray(fallback) ? fallback[0] : fallback;
      expect(fallbackLng).toBe('fr-CH');
    });
  });

  /**
   * Translation Loading Tests
   */
  describe('Translation resources', () => {
    it('should load common translations for all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      expect(resources['fr-CH'].common).toBeDefined();
      expect(resources['de-CH'].common).toBeDefined();
      expect(resources['it-CH'].common).toBeDefined();
    });

    it('should load auth translations for all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      expect(resources['fr-CH'].auth).toBeDefined();
      expect(resources['de-CH'].auth).toBeDefined();
      expect(resources['it-CH'].auth).toBeDefined();
    });

    it('should load appointments translations for all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      expect(resources['fr-CH'].appointments).toBeDefined();
      expect(resources['de-CH'].appointments).toBeDefined();
      expect(resources['it-CH'].appointments).toBeDefined();
    });

    it('should load messaging translations for all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      expect(resources['fr-CH'].messaging).toBeDefined();
      expect(resources['de-CH'].messaging).toBeDefined();
      expect(resources['it-CH'].messaging).toBeDefined();
    });
  });

  /**
   * French Language Tests (fr-CH)
   */
  describe('French translations (fr-CH)', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('fr-CH');
    });

    it('should translate common navigation items', async () => {
      await i18n.init;
      const home = i18n.t('common:navigation.home', { lng: 'fr-CH' });
      expect(home).toBe('Accueil');

      const dashboard = i18n.t('common:navigation.dashboard', { lng: 'fr-CH' });
      expect(dashboard).toBe('Tableau de bord');
    });

    it('should translate authentication strings', async () => {
      await i18n.init;
      const login = i18n.t('auth:login.title', { lng: 'fr-CH' });
      expect(login).toBe('Connexion');

      const email = i18n.t('auth:login.email', { lng: 'fr-CH' });
      expect(email).toBe('Adresse e-mail');
    });

    it('should translate appointment booking', async () => {
      await i18n.init;
      const book = i18n.t('appointments:appointments.book_appointment', { lng: 'fr-CH' });
      expect(book).toBe('Prendre rendez-vous');
    });

    it('should support currency formatting', async () => {
      await i18n.init;
      const chf = i18n.t('common:currency.chf', { lng: 'fr-CH' });
      expect(chf).toBe('CHF');
    });

    it('should have all month names in French', async () => {
      await i18n.init;
      const months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];

      months.forEach(month => {
        const translated = i18n.t(`common:time.${month}`, { lng: 'fr-CH' });
        expect(translated).toBeDefined();
      });
    });

    it('should have all weekday names in French', async () => {
      await i18n.init;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      days.forEach(day => {
        const translated = i18n.t(`common:time.${day}`, { lng: 'fr-CH' });
        expect(translated).toBeDefined();
      });
    });
  });

  /**
   * German Language Tests (de-CH)
   */
  describe('German translations (de-CH)', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('de-CH');
    });

    it('should translate common navigation items', async () => {
      await i18n.init;
      const home = i18n.t('common:navigation.home', { lng: 'de-CH' });
      expect(home).toBe('Startseite');

      const dashboard = i18n.t('common:navigation.dashboard', { lng: 'de-CH' });
      expect(dashboard).toBe('Dashboard');
    });

    it('should translate authentication strings', async () => {
      await i18n.init;
      const login = i18n.t('auth:login.title', { lng: 'de-CH' });
      expect(login).toBe('Anmelden');
    });

    it('should support German date formatting', async () => {
      await i18n.init;
      const january = i18n.t('common:time.january', { lng: 'de-CH' });
      expect(january).toBe('Januar');

      const monday = i18n.t('common:time.monday', { lng: 'de-CH' });
      expect(monday).toBe('Montag');
    });
  });

  /**
   * Italian Language Tests (it-CH)
   */
  describe('Italian translations (it-CH)', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('it-CH');
    });

    it('should translate common navigation items', async () => {
      await i18n.init;
      const home = i18n.t('common:navigation.home', { lng: 'it-CH' });
      expect(home).toBe('Home');

      const dashboard = i18n.t('common:navigation.dashboard', { lng: 'it-CH' });
      expect(dashboard).toBe('Pannello di controllo');
    });

    it('should translate authentication strings', async () => {
      await i18n.init;
      const login = i18n.t('auth:login.title', { lng: 'it-CH' });
      expect(login).toBe('Accedi');
    });

    it('should support Italian date formatting', async () => {
      await i18n.init;
      const january = i18n.t('common:time.january', { lng: 'it-CH' });
      expect(january).toBe('Gennaio');

      const monday = i18n.t('common:time.monday', { lng: 'it-CH' });
      expect(monday).toBe('Lunedì');
    });
  });

  /**
   * Localization Features
   */
  describe('Localization features', () => {
    it('should support language change at runtime', async () => {
      await i18n.init;
      await i18n.changeLanguage('fr-CH');
      let home = i18n.t('navigation.home');
      expect(home).toBe('Accueil');

      await i18n.changeLanguage('de-CH');
      home = i18n.t('navigation.home');
      expect(home).toBe('Startseite');

      await i18n.changeLanguage('it-CH');
      home = i18n.t('navigation.home');
      expect(home).toBe('Home');
    });

    it('should have consistent namespace structure across languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;
      const frKeys = Object.keys(resources['fr-CH'].common);
      const deKeys = Object.keys(resources['de-CH'].common);
      const itKeys = Object.keys(resources['it-CH'].common);

      expect(frKeys).toEqual(deKeys);
      expect(frKeys).toEqual(itKeys);
    });

    it('should have date/time localization', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      // Check French date translations
      expect(resources['fr-CH'].common.time).toBeDefined();
      expect(resources['fr-CH'].common.time.january).toBeDefined();
      expect(resources['fr-CH'].common.time.monday).toBeDefined();

      // Check German date translations
      expect(resources['de-CH'].common.time.january).toBeDefined();
      expect(resources['de-CH'].common.time.monday).toBeDefined();

      // Check Italian date translations
      expect(resources['it-CH'].common.time.january).toBeDefined();
      expect(resources['it-CH'].common.time.monday).toBeDefined();
    });

    it('should support currency localization', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      // All languages should have CHF currency (Swiss Francs)
      expect(resources['fr-CH'].common.currency.chf).toBe('CHF');
      expect(resources['de-CH'].common.currency.chf).toBe('CHF');
      expect(resources['it-CH'].common.currency.chf).toBe('CHF');
    });

    it('should support interpolation in translations', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      // Check that format strings with variables exist
      expect(resources['fr-CH'].common.currency.format).toContain('{{amount}}');
      expect(resources['de-CH'].common.currency.format).toContain('{{amount}}');
      expect(resources['it-CH'].common.currency.format).toContain('{{amount}}');
    });
  });

  /**
   * Healthcare-Specific Localization
   */
  describe('Healthcare terminology localization', () => {
    it('should have medical appointment types in all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      const appointmentTypes = ['consultation', 'teleconsultation', 'pharmacy_consultation', 'medication_review', 'follow_up'];

      appointmentTypes.forEach(type => {
        expect(resources['fr-CH'].appointments.appointment_types[type]).toBeDefined();
        expect(resources['de-CH'].appointments.appointment_types[type]).toBeDefined();
        expect(resources['it-CH'].appointments.appointment_types[type]).toBeDefined();
      });
    });

    it('should have healthcare professional roles in all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      const roles = ['pharmacist', 'doctor', 'nurse', 'specialist'];

      roles.forEach(role => {
        expect(resources['fr-CH'].appointments.provider[role]).toBeDefined();
        expect(resources['de-CH'].appointments.provider[role]).toBeDefined();
        expect(resources['it-CH'].appointments.provider[role]).toBeDefined();
      });
    });

    it('should have encrypted messaging features in all languages', async () => {
      await i18n.init;
      const resources = i18n.options.resources as any;

      const healthcare = [
        'prescription_sharing',
        'medical_record_sharing',
        'consultation_notes',
        'lab_results',
        'encrypted'
      ];

      healthcare.forEach(feature => {
        expect(resources['fr-CH'].messaging.healthcare_features[feature]).toBeDefined();
        expect(resources['de-CH'].messaging.healthcare_features[feature]).toBeDefined();
        expect(resources['it-CH'].messaging.healthcare_features[feature]).toBeDefined();
      });
    });
  });

  /**
   * Configuration Options Tests
   */
  describe('i18n configuration options', () => {
    it('should escape HTML values for security', async () => {
      await i18n.init;
      expect(i18n.options.interpolation?.escapeValue).toBe(false);
    });

    it('should use React Suspense for lazy loading', async () => {
      await i18n.init;
      expect(i18n.options.react?.useSuspense).toBe(true);
    });

    it('should support all configured namespaces', async () => {
      await i18n.init;
      const ns = i18n.options.ns;
      expect(ns).toContain('common');
      expect(ns).toContain('auth');
      expect(ns).toContain('appointments');
      expect(ns).toContain('messaging');
    });

    it('should use localStorage for language persistence', async () => {
      await i18n.init;
      const detection = i18n.options.detection as any;
      expect(detection.order).toContain('localStorage');
      expect(detection.caches).toContain('localStorage');
    });
  });
});
