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
import { DifficultyMode } from '@/types';
import { useTranslation } from 'react-i18next';

interface Props {
  word?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  onClose: () => void;
  difficulty?: DifficultyMode | 'easy' | 'medium' | 'hard';
}

export const WordTranslationModal = ({ 
  word = null, 
  sourceLanguage, 
  targetLanguage, 
  context,
  onClose 
  , difficulty = 'easy'
}: Props) => {
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [translatedSentence, setTranslatedSentence] = useState('');
  const [exampleSentence, setExampleSentence] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: Vocabulary feature state
  const [addingToVocabulary, setAddingToVocabulary] = useState(false);
  const [vocabularyMessage, setVocabularyMessage] = useState<string | null>(null);
  const [vocabularySuccess, setVocabularySuccess] = useState(false);
  // NEW: Definition modal state shown after successful add
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [definitionText, setDefinitionText] = useState('');
  // Track the created vocabulary word id so we can update it with the typed definition
  const [createdWordId, setCreatedWordId] = useState<string | null>(null);
  const [savingDefinition, setSavingDefinition] = useState(false);

  useEffect(() => {
    fetchTranslation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, context, sourceLanguage, targetLanguage, difficulty]);

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

      // If hard mode and there's no context (first line), skip translation request and show nothing
      if (difficulty === 'hard' && (!context || !context.trim())) {
        setTranslatedSentence('');
        setExampleSentence(null);
        setLoading(false);
        return;
      }

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
        setError(t('word.modal.error.unavailable'));
      }
    } catch (err) {
      console.error('❌ Modal translation error:', err);
      setError(t('word.modal.error.failed'));
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
          setVocabularyMessage(t('word.vocab.already'));
          
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
      const addRes = await vocabularyApi.addWord({
        word: normalizedWord,
        language: sourceLanguage,
        context: context,
        translation: translatedSentence || undefined,
      });
      
      // backend returns { word: vocabularyWord }
      const newWord = addRes?.word ?? addRes;
      const newId = newWord?.id ?? null;
      setCreatedWordId(newId);

      setVocabularySuccess(true);
      setVocabularyMessage(t('word.vocab.added'));
      // Open the definition modal so the user can type a definition
      setShowDefinitionModal(true);
       
      setTimeout(() => {
        setVocabularyMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to add word to vocabulary:', error);
      
      // Handle 409 conflict specifically
      if (error?.response?.status === 409 || error?.message?.includes('already')) {
        setVocabularySuccess(false);
        setVocabularyMessage(t('word.vocab.already'));
      } else {
        setVocabularySuccess(false);
        setVocabularyMessage(t('word.vocab.add_failed'));
      }
      
      setTimeout(() => {
        setVocabularyMessage(null);
      }, 3000);
    } finally {
      setAddingToVocabulary(false);
    }
  };

  // Save the definition to the backend (update existing word or create+update fallback)
  const saveDefinition = async () => {
    if (savingDefinition) return;
    setSavingDefinition(true);
    try {
      const text = definitionText.trim();
      if (createdWordId) {
        await vocabularyApi.updateWord(createdWordId, { translation: text || undefined });
      } else if (word) {
        // Fallback: if we somehow don't have the id, try to add/update with translation included
        const addRes = await vocabularyApi.addWord({
          word: word.toLowerCase().trim(),
          language: sourceLanguage,
          context: context,
          translation: text || undefined,
        });
        const newWord = addRes?.word ?? addRes;
        setCreatedWordId(newWord?.id ?? null);
      }

      // show a small confirmation in the parent modal area
      setVocabularyMessage('✅ Definition saved');
      setVocabularySuccess(true);
      setTimeout(() => setVocabularyMessage(null), 2000);
    } catch (err) {
      console.error('Failed to save definition:', err);
      setVocabularyMessage('❌ Failed to save definition');
      setVocabularySuccess(false);
      setTimeout(() => setVocabularyMessage(null), 2000);
    } finally {
      setSavingDefinition(false);
      setShowDefinitionModal(false);
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

  // Helper: mask vowels for medium difficulty (matches learning page behavior for untyped characters)
  const maskMedium = (s: string) => {
    if (!s) return s;
    return s.split('').map(ch => {
      // Keep punctuation and whitespace
      if (!/[A-Za-zÀ-ÿ]/.test(ch)) return ch;
      // Replace vowels with underscore
      if (/[aeiouAEIOU]/.test(ch)) return '_';
      return ch;
    }).join('');
  };
  
  const renderOriginalContent = () => {
     // EASY: show full original with highlighted word
     if (difficulty === 'easy') {
       return word ? highlightWord(context, word) : context;
     }

     // MEDIUM: show masked original (vowels hidden) but highlight the clicked word region (masked)
     if (difficulty === 'medium') {
       const parts = context.split(/(\s+)/);
       return parts.map((part, idx) => {
         if (/^\s+$/.test(part)) return <span key={idx}>{part}</span>;
         const cleanPart = part.replace(/[.,!?;:\\"'¿¡\-]/g, '').toLowerCase();
         const cleanWord = (word || '').replace(/[.,!?;:\\"'¿¡\-]/g, '').toLowerCase();
         const masked = maskMedium(part);
         if (cleanWord && cleanPart === cleanWord) {
           return (
             <span key={idx} className="rounded bg-yellow-200 px-1 font-bold text-yellow-900 dark:bg-yellow-600 dark:text-yellow-50">
               {masked}
             </span>
           );
         }
         return <span key={idx}>{masked}</span>;
       });
     }

     // HARD: show the previous line original (context contains previous line when invoked from hard mode)
     return context || '';
   };

  // Compute headings that adjust in hard difficulty to indicate previous-line content
  const originalHeadingText = difficulty === 'hard'
    ? t('word.modal.previous_original', { lang: (sourceLanguage || 'auto').toUpperCase() })
    : t('word.modal.original', { lang: (sourceLanguage || 'auto').toUpperCase() });
    
  const translationHeadingText = difficulty === 'hard'
    ? t('word.modal.previous_translation', { lang: (targetLanguage || 'en').toUpperCase() })
    : t('word.modal.translation', { lang: (targetLanguage || 'en').toUpperCase() });
    
  // Build a WordReference URL based on source and user's native language (fallbacks applied)
  const buildWordReferenceUrl = (w: string) => {
    const src = normalizeLang(sourceLanguage) || 'en';
    const userNativeCode = normalizeLang(user?.nativeLanguage || undefined) || 'en';
    // WordReference uses pair like enes for English-Spanish; construct pair conservatively
    const pair = `${src}${userNativeCode}`;
    return `https://www.wordreference.com/${pair}/${encodeURIComponent(w)}`;
  };

  return (
    <>
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
                    {word ? word : t('word.modal.sentence')}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('word.modal.loading')}</p>
                </div>
              ) : error ? (
                <div className="rounded-xl bg-yellow-50 p-6 text-center dark:bg-yellow-900/20">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                  <p className="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">{t('word.modal.error.title')}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
                  <button
                    onClick={fetchTranslation}
                    className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                  >
                    {t('word.modal.error.try_again')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {originalHeadingText}
                    </p>
                    <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                      {renderOriginalContent()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-6 dark:from-primary-900/20 dark:to-accent-900/20">
                    <div className="mb-2 flex items-center gap-2">
                      <Languages className="h-4 w-4 text-primary-600" />
                      <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
                        {translationHeadingText}
                      </p>
                    </div>
                    <p className="text-xl font-medium leading-relaxed text-primary-800 dark:text-primary-200">
                      {translatedSentence}
                    </p>
                  </div>

                  {exampleSentence && (
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {t('word.modal.example_usage')}
                      </p>
                      <p className="italic text-blue-700 dark:text-blue-300">
                        "{exampleSentence}"
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      <strong>{t('word.modal.pro_tip_label')}</strong> {t('word.modal.pro_tip', { word: word || '' })}
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
                            <span>{t('word.vocab.adding')}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg">+</span>
                            <span>{t('word.vocab.cta')}</span>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('word.modal.powered_by')}</p>
              <Button variant="ghost" size="sm" onClick={onClose}>{t('buttons.close')}</Button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Definition Modal shown after successful add */}
      <AnimatePresence>
        {showDefinitionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={async () => { await saveDefinition(); }}
              className="absolute inset-0 bg-black/50"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('word.modal.definition.title')}</h3>
                  <p className="text-xs text-gray-500">{t('word.modal.definition.prompt')} <span className="font-medium">{word}</span></p>
                </div>
                <button
                  onClick={async () => { await saveDefinition(); }}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 flex justify-end">
                <a
                  href={buildWordReferenceUrl(word || '')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline"
                >
                  {t('word.modal.open_wordreference')}
                </a>
              </div>

              <textarea
                value={definitionText}
                onChange={(e) => setDefinitionText(e.target.value)}
                onKeyDown={(e) => {
                  // Enter (without Shift) saves the definition
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void saveDefinition();
                  }
                }}
                placeholder={t('word.modal.definition.placeholder')}
                className="w-full min-h-[120px] rounded-lg border border-gray-200 p-3 text-sm text-gray-800 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => { await saveDefinition(); }}
                  disabled={savingDefinition}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                >
                  {t('buttons.close')}
                </button>
              </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </>
   );
 }