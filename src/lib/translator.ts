// frontend/src/lib/translator.ts
// FINAL VERSION: Shows full sentence translation only (most accurate)

export interface TranslationResult {
  originalWord: string;
  originalSentence: string;
  translatedSentence: string;
  sourceLanguage: string;
  targetLanguage: string;
  success: boolean;
  error?: string;
}

// Language code mapping
const LANGUAGE_CODE_MAP: Record<string, string> = {
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'zh': 'zh',
  'ja': 'ja',
  'ko': 'ko',
  'ar': 'ar',
  'hi': 'hi',
  'nl': 'nl',
  'pl': 'pl',
  'tr': 'tr',
  'uk': 'uk',
  'sv': 'sv',
  'da': 'da',
  'fi': 'fi',
  'no': 'no',
};

// Map some common full language names to codes
const LANGUAGE_NAME_MAP: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it',
  portuguese: 'pt',
  russian: 'ru',
  japanese: 'ja',
  chinese: 'zh',
  korean: 'ko',
};

const normalizeLang = (lang?: string): string | null => {
  if (!lang) return null;
  const code = lang.split(/[-_]/)[0].toLowerCase();
  if (LANGUAGE_CODE_MAP[code]) return LANGUAGE_CODE_MAP[code];
  const name = lang.trim().toLowerCase();
  if (LANGUAGE_NAME_MAP[name]) return LANGUAGE_NAME_MAP[name];
  return null;
};

// Simple heuristic language detector for fallback when APIs fail or unknown is passed
const heuristicDetectLanguage = (text: string): string => {
  const s = text.toLowerCase();
  // Quick checks for common words in target languages
  const checks: { lang: string; words: string[] }[] = [
    { lang: 'fr', words: [' je ', " j'", ' le ', ' la ', ' et ', ' pas ', ' ne ', 'que ', 'pour '] },
    { lang: 'es', words: [' yo ', ' que ', ' el ', ' la ', ' y ', ' para ', ' por ', 'como '] },
    { lang: 'de', words: [' der ', ' die ', ' und ', ' nicht ', ' ich ', ' es ', 'zu '] },
    { lang: 'it', words: [' che ', ' non ', ' la ', ' il ', ' e ', ' per ', ' io '] },
    { lang: 'pt', words: [' que ', ' eu ', ' a ', ' o ', ' e ', ' para ', ' por '] },
    { lang: 'en', words: [' the ', ' and ', ' of ', ' to ', ' is ', ' I ', ' you '] },
  ];

  for (const c of checks) {
    for (const w of c.words) {
      if (s.includes(w)) return c.lang;
    }
  }

  // fallback to english if ambiguous
  return 'en';
};

/**
 * Try to detect language using LibreTranslate detect endpoint, fallback to heuristic
 */
const detectLanguage = async (text: string): Promise<string> => {
  const trimmed = (text || '').trim();
  if (!trimmed) return 'en';

  try {
    const resp = await fetch('https://libretranslate.com/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: trimmed }),
    });

    if (resp.ok) {
      const data = await resp.json();
      // data is an array like [{language: 'fr', confidence: 0.9}, ...]
      if (Array.isArray(data) && data[0]?.language) {
        const code = data[0].language.toLowerCase();
        return LANGUAGE_CODE_MAP[code] || code;
      }
    } else {
      console.warn('⚠️ LibreTranslate detect failed with status:', resp.status);
    }
  } catch (err) {
    console.warn('⚠️ LibreTranslate detect error:', err);
  }

  // Last resort: heuristic
  try {
    return heuristicDetectLanguage(trimmed);
  } catch (e) {
    return 'en';
  }
};

/**
 * Translate full sentence using LibreTranslate
 */
const translateSentence = async (
  sentence: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> => {
  console.log('🔵 Translation Request:', {
    sentence,
    from: sourceLanguage,
    to: targetLanguage
  });

  // Normalize provided language identifiers
  let sourceLang = normalizeLang(sourceLanguage) || sourceLanguage;
  const targetLang = normalizeLang(targetLanguage) || targetLanguage;

  // If sourceLanguage is missing or unknown, try to detect it
  if (!sourceLang || sourceLang === 'unknown' || sourceLang === 'auto') {
    try {
      sourceLang = await detectLanguage(sentence);
      console.log('🔍 Detected source language:', sourceLang);
    } catch (err) {
      console.warn('⚠️ Language detection failed, defaulting to en');
      sourceLang = 'en';
    }
  }

  // Try LibreTranslate first
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: sentence,
        source: sourceLang,
        target: targetLang,
        format: 'text',
        api_key: '',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ LibreTranslate success:', data.translatedText);
      // Decode any HTML entities returned by the API (e.g., numeric newline references)
      return decodeHtmlEntities(data.translatedText);
    }

    // If rate limited (429) or other non-ok, log and continue to fallback
    console.warn('⚠️ LibreTranslate failed with status:', response.status);
  } catch (error) {
    console.warn('⚠️ LibreTranslate error:', error);
  }

  // Fallback to MyMemory
  try {
    // MyMemory expects ISO language codes; if sourceLang is unknown use 'auto' not accepted so fallback to heuristic
    const safeSource = sourceLang && sourceLang !== 'unknown' ? sourceLang : heuristicDetectLanguage(sentence);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sentence)}&langpair=${safeSource}|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      console.log('✅ MyMemory success:', data.responseData.translatedText);
      return decodeHtmlEntities(data.responseData.translatedText);
    }

    // MyMemory sometimes returns a match in the 'matches' array
    if (Array.isArray(data.matches) && data.matches[0]?.translation) {
      console.log('✅ MyMemory matches fallback:', data.matches[0].translation);
      return decodeHtmlEntities(data.matches[0].translation);
    }

    console.warn('⚠️ MyMemory did not return a valid translation');
  } catch (error) {
    console.warn('⚠️ MyMemory error:', error);
  }

  throw new Error('All translation services failed');
};

/**
 * MAIN FUNCTION: Translate sentence with word highlighted
 */
export const translateWord = async (
  word: string,
  sourceLanguage: string,
  targetLanguage: string,
  sentenceContext: string
): Promise<TranslationResult> => {
  console.log('🚀 Starting translation:', {
    word,
    sourceLanguage,
    targetLanguage,
    sentenceContext
  });

  if (!sentenceContext) {
    return {
      originalWord: word,
      originalSentence: sentenceContext,
      translatedSentence: sentenceContext,
      sourceLanguage,
      targetLanguage,
      success: false,
      error: 'Missing word or context',
    };
  }

  // Prefer explicit, normalized source language when available (e.g., song.language)
  let src = normalizeLang(sourceLanguage) || null;
  let tgt = normalizeLang(targetLanguage) || null;

  // If source isn't explicit, try to detect from context
  if (!src) {
    try {
      src = await detectLanguage(sentenceContext);
      console.log('🔍 Detected source language from context:', src);
    } catch (err) {
      console.warn('⚠️ Context language detection failed, defaulting src to en');
      src = 'en';
    }
  }

  // If target not provided, fallback to English
  if (!tgt) tgt = 'en';

  if (src === tgt) {
    return {
      originalWord: word,
      originalSentence: sentenceContext,
      translatedSentence: sentenceContext,
      sourceLanguage: src,
      targetLanguage,
      success: true,
    };
  }

  try {
    const translatedSentence = await translateSentence(
      sentenceContext,
      src || 'auto',
      tgt || 'en'
    );

    console.log('🎉 Translation complete:', {
      original: sentenceContext,
      translated: translatedSentence
    });

    return {
      originalWord: word,
      originalSentence: sentenceContext,
      translatedSentence,
      sourceLanguage: src || sourceLanguage,
      targetLanguage: tgt || targetLanguage,
      success: true,
    };
  } catch (error) {
    console.error('❌ Translation failed:', error);
    return {
      originalWord: word,
      originalSentence: sentenceContext,
      translatedSentence: sentenceContext,
      sourceLanguage: src || sourceLanguage,
      targetLanguage: tgt || targetLanguage,
      success: false,
      error: 'Translation service unavailable',
    };
  }
};

/**
 * Get dictionary definition (English only)
 */
export const getDefinition = async (
  word: string,
  language: string
): Promise<string | null> => {
  if (language !== 'en') return null;

  try {
    const cleanWord = word.replace(/[.,!?;:"']/g, '').trim().toLowerCase();
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      return data[0].meanings[0].definitions[0].definition;
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get example sentence (English only)
 */
export const getExampleSentence = async (
  word: string,
  language: string
): Promise<string | null> => {
  if (language !== 'en') return null;

  try {
    const cleanWord = word.replace(/[.,!?;:"']/g, '').trim().toLowerCase();
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data?.[0]?.meanings) {
      for (const meaning of data[0].meanings) {
        if (meaning.definitions) {
          for (const def of meaning.definitions) {
            if (def.example) return def.example;
          }
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Translate with example in one call
 */
export const translateWithExample = async (
  word: string,
  sourceLanguage: string,
  targetLanguage: string,
  context: string
): Promise<{
  originalWord: string;
  originalSentence: string;
  translatedSentence: string;
  definition?: string;
  exampleSentence: string | null;
  success: boolean;
}> => {
  const translationResult = await translateWord(
    word,
    sourceLanguage,
    targetLanguage,
    context
  );

  let definition: string | undefined;
  let exampleSentence: string | null = null;

  // If translationResult detected a language and it's 'en', try to get definition/example
  const detectedSource = translationResult.sourceLanguage || sourceLanguage;
  if (detectedSource === 'en') {
    definition = (await getDefinition(word, detectedSource)) || undefined;
    exampleSentence = await getExampleSentence(word, detectedSource);
  }

  return {
    originalWord: translationResult.originalWord,
    originalSentence: translationResult.originalSentence,
    translatedSentence: translationResult.translatedSentence,
    definition,
    exampleSentence,
    success: translationResult.success,
  };
};

/**
 * Get supported languages
 */
export const getSupportedLanguages = (): string[] => {
  return Object.keys(LANGUAGE_CODE_MAP);
};

// Export detectLanguage so other parts of the app can deduce a song's language
export { detectLanguage };

// Helper: decode HTML entities such as &#x0A; or &amp; into actual characters.
const decodeHtmlEntities = (input: string): string => {
  if (!input) return input;
  try {
    // Runs in browser environment — use a textarea to decode safely
    const txt = document.createElement('textarea');
    txt.innerHTML = input;
    return txt.value;
  } catch (e) {
    // Fallback: decode numeric entities manually
    return input
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  }
};