// i18n initialization
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// Use localStorage key 'native_language' to respect user's chosen native language.
// Fallback to browser language and then to 'en'.
const detectorOptions = {
  // order of detectors: localStorage first (native preference), then navigator/browser
  order: ['localStorage', 'navigator'],
  // the key in localStorage to look for
  lookupLocalStorage: 'native_language',
  // cache user language to localStorage under the same key when changed
  caches: ['localStorage'],
};

// Try to read cached native language immediately so we can set it as the initial language
let initialLng: string | undefined;
try {
  const cached = localStorage.getItem('native_language');
  if (cached) {
    // Normalize to language prefix so values like 'es-ES' or 'en_US' map to 'es'/'en'
    initialLng = String(cached).trim().toLowerCase().split(/[-_]/)[0];
  }
} catch (e) {
  // ignore (e.g. during SSR or when storage is unavailable)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
    },
    // If we have an explicit cached language, use it as the initial language so the
    // first render uses the correct language. Otherwise let the detector decide.
    lng: initialLng,
    fallbackLng: 'en',
    debug: false,
    detection: detectorOptions,
    interpolation: {
      escapeValue: false,
    },
  });

// Helper to programmatically set the native language and persist it.
function normalizeLangCode(lang?: string | null): string | null {
  if (!lang) return null;
  let s = String(lang).trim().toLowerCase();
  if (!s) return null;
  // If the value is a locale like 'es-ES' or 'en_US', take the prefix
  s = s.split(/[-_]/)[0];

  const nameMap: Record<string, string> = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
    español: 'es',
    castellano: 'es',
  };

  if (nameMap[s]) s = nameMap[s];

  const supported = Object.keys(i18n.options.resources || {});
  if (supported.includes(s)) return s;

  // If not supported, fall back to first two letters if it matches
  if (s.length === 2) return s;
  return null;
}

export function setNativeLanguage(lang: string | null) {
  const code = normalizeLangCode(lang);
  if (!code) return;
  i18n.changeLanguage(code);
  try {
    localStorage.setItem('native_language', code);
  } catch (e) {
    // ignore storage errors
  }
}

export default i18n;