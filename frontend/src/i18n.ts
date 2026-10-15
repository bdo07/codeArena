import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';

const LANGUAGE_STORAGE_KEY = 'codearena_language';

const savedLanguage =
  (typeof window !== 'undefined' && localStorage.getItem(LANGUAGE_STORAGE_KEY)) || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    fr: { translation: frTranslation },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safely escapes values
  },
});

// Update lang attribute on change and persist
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    document.documentElement.setAttribute('lang', lng);
  }
});

export default i18n;
