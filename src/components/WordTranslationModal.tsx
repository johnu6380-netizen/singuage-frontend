// frontend/src/components/WordTranslationModal.tsx
// UPDATED: Added "+ Words to Work on" button to add vocabulary

import { useState, useEffect } from 'react';
import { X, BookOpen, Loader, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { translateWithExample } from '@/lib/translator';
import { detectLanguage, getSupportedLanguages } from '@/lib/translator';
import { useAuthStore } from '@/store/useStore';
import { vocabularyApi } from '@/lib/api';

interface Props {
  word?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  onClose: () => void;
}

export const WordTranslationModal = ({ 
  word = null, 
  sourceLanguage, 
  targetLanguage, 
  context,
  onClose 
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [translatedSentence, setTranslatedSentence] = useState('');
  const [exampleSentence, setExampleSentence] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: Vocabulary feature state
  const [addingToVocabulary, setAddingToVocabulary] = useState(false);
  const [vocabularyMessage, setVocabularyMessage] = useState<string | null>(null);
  const [vocabularySuccess, setVocabularySuccess] = useState(false);

  useEffect(() => {
    fetchTranslation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, context, sourceLanguage, targetLanguage]);

  const { user } = useAuthStore();
  
  const normalizeLang = (lang?: string): string | null => {
    if (!lang) return null;
    const code = lang.split(/[-_]/)[0].toLowerCase();
    const supported = getSupportedLanguages();
    if (supported.includes(code)) return code;
    const nameMap: Record<string, string> = { 
      english: 'en', spanish: 'es', french: 'fr', german: 'de', 
      italian: 'it', portuguese: 'pt' 
    };
    const nameKey = lang.trim().toLowerCase();
    if (nameMap[nameKey]) return nameMap[nameKey];
    return null;
  };

  const fetchTranslation = async () => {
    setLoading(true);
    setError(null);

    console.log('🔵 Modal requesting translation:', {
      word,
      sourceLanguage,
      targetLanguage,
      context
    });

    try {
      let src = normalizeLang(sourceLanguage) || null;
      let tgt = normalizeLang(targetLanguage) || null;

      if (!src || src === 'unknown' || src === 'auto') {
        try {
          const detected = await detectLanguage(context || word || '');
          src = detected || 'en';
          console.log('🔎 Modal detected source language:', src);
        } catch (e) {
          src = 'en';
        }
      }

      const userNative = user?.nativeLanguage;
      const userNativeCode = normalizeLang(userNative || undefined);
      
      if (!tgt) {
        tgt = userNativeCode || 'en';
      } else {
        if (userNativeCode) tgt = userNativeCode;
      }

      if (src === tgt) {
        if (userNativeCode && userNativeCode !== src) {
          tgt = userNativeCode;
        } else {
          tgt = src === 'en' ? 'es' : 'en';
        }
      }

      const wordForApi = word || '';
      const result = await translateWithExample(
        wordForApi,
        src,
        tgt,
        context
      );
      
      console.log('✅ Modal received translation:', result);
      
      if (result.success) {
        setTranslatedSentence(result.translatedSentence);
        setExampleSentence(result.exampleSentence);
      } else {
        setError('Translation not available. Please try again.');
      }
    } catch (err) {
      console.error('❌ Modal translation error:', err);
      setError('Failed to get translation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Add word to vocabulary (FIXED: Check for duplicates first)
  const handleAddToVocabulary = async () => {
    if (!word) return;
    
    setAddingToVocabulary(true);
    setVocabularyMessage(null);
    
    try {
      const normalizedWord = word.toLowerCase().trim();
      
      // Check if word already exists in vocabulary
      try {
        const existingWords = await vocabularyApi.getWords({
          language: sourceLanguage
        });
        
        const wordExists = existingWords.words?.some(
          (w: any) => w.word.toLowerCase() === normalizedWord && w.language === sourceLanguage
        );
        
        if (wordExists) {
          setVocabularySuccess(false);
          setVocabularyMessage('ℹ️ This word is already in your vocabulary!');
          
          setTimeout(() => {
            setVocabularyMessage(null);
          }, 3000);
          
          setAddingToVocabulary(false);
          return;
        }
      } catch (checkError) {
        console.warn('Could not check existing words:', checkError);
        // Continue with add attempt anyway
      }
      
      // Add the word
      await vocabularyApi.addWord({
        word: normalizedWord,
        language: sourceLanguage,
        context: context,
        translation: translatedSentence || undefined,
      });
      
      setVocabularySuccess(true);
      setVocabularyMessage('✅ Added to Words to Work on!');
      
      setTimeout(() => {
        setVocabularyMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to add word to vocabulary:', error);
      
      // Handle 409 conflict specifically
      if (error?.response?.status === 409 || error?.message?.includes('already')) {
        setVocabularySuccess(false);
        setVocabularyMessage('ℹ️ This word is already in your vocabulary!');
      } else {
        setVocabularySuccess(false);
        setVocabularyMessage('❌ Failed to add word. Please try again.');
      }
      
      setTimeout(() => {
        setVocabularyMessage(null);
      }, 3000);
    } finally {
      setAddingToVocabulary(false);
    }
  };

  const highlightWord = (sentence: string, wordToHighlight: string) => {
    const cleanWord = wordToHighlight.replace(/[.,!?;:"'¿¡\-]/g, '').trim().toLowerCase();
    const words = sentence.split(/(\s+)/);
    
    return words.map((w, idx) => {
      const cleanW = w.replace(/[.,!?;:"'¿¡\-]/g, '').toLowerCase();
      if (cleanW === cleanWord) {
        return (
          <span key={idx} className="rounded bg-yellow-200 px-1 font-bold text-yellow-900 dark:bg-yellow-600 dark:text-yellow-50">
            {w}
          </span>
        );
      }
      return <span key={idx}>{w}</span>;
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
                <Languages className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {word ? word : 'Sentence'}
                </h2>
                <p className="text-xs text-gray-500">
                  {sourceLanguage?.toUpperCase() || 'AUTO'} → {targetLanguage?.toUpperCase() || 'EN'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="mb-4 h-8 w-8 animate-spin text-primary-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Translating...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-yellow-50 p-6 text-center dark:bg-yellow-900/20">
                <BookOpen className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                <p className="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
                  Translation Error
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {error}
                </p>
                <button
                  onClick={fetchTranslation}
                  className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Original ({(sourceLanguage || 'auto').toUpperCase()})
                  </p>
                  <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                    {word ? highlightWord(context, word) : context}
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-6 dark:from-primary-900/20 dark:to-accent-900/20">
                  <div className="mb-2 flex items-center gap-2">
                    <Languages className="h-4 w-4 text-primary-600" />
                    <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
                      Translation ({(targetLanguage || 'en').toUpperCase()})
                    </p>
                  </div>
                  <p className="text-xl font-medium leading-relaxed text-primary-800 dark:text-primary-200">
                    {translatedSentence}
                  </p>
                </div>

                {exampleSentence && (
                  <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Example Usage
                    </p>
                    <p className="italic text-blue-700 dark:text-blue-300">
                      "{exampleSentence}"
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>💡 Pro Tip:</strong> The full sentence translation shows you how "{word}" is used in context!
                  </p>
                </div>

                {/* NEW: Add to Vocabulary Button */}
                {word && (
                  <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={handleAddToVocabulary}
                      disabled={addingToVocabulary}
                      className="flex items-center justify-center gap-2"
                    >
                      {addingToVocabulary ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">+</span>
                          <span>Words to Work on</span>
                        </>
                      )}
                    </Button>
                    {vocabularyMessage && (
                      <p className={`mt-2 text-center text-sm ${vocabularySuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {vocabularyMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by LibreTranslate
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
