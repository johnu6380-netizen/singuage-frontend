// frontend/src/components/GrammarDropdown.tsx
// FIXED: Now shows "No grammar concepts found" state instead of hiding entirely
// WHY IT WAS FAILING: Component returned null when analysis was empty,
// making it seem broken. Now always visible with helpful message.

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectedGrammar } from '@/lib/grammar';
import { useTranslation } from 'react-i18next';

interface Props {
  grammarAnalysis: DetectedGrammar[];
  language?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export const GrammarDropdown = ({ grammarAnalysis, language, onOpenChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const handleConceptClick = (conceptId: string) => {
    setSelectedConcept(selectedConcept === conceptId ? null : conceptId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // FIXED: Always show component, even when no grammar found
  const hasGrammar = grammarAnalysis.length > 0;

  return (
    <div className="w-full rounded-xl border-2 border-primary-200 bg-white shadow-lg dark:border-primary-800 dark:bg-gray-800">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${hasGrammar ? 'bg-primary-100 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <BookOpen className={`h-5 w-5 ${hasGrammar ? 'text-primary-600' : 'text-gray-500'}`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('grammar.header.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hasGrammar ? t('grammar.header.count', { count: grammarAnalysis.length }) : t('grammar.header.none')}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
          >
            {hasGrammar ? (
              <div className="p-4 space-y-3">
                {grammarAnalysis.map((item) => (
                  <div
                    key={item.concept.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50"
                  >
                    {/* Concept Header */}
                    <button
                      onClick={() => handleConceptClick(item.concept.id)}
                      className="flex w-full items-start justify-between p-4 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-600/50"
                    >
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {t(`grammar.items.${item.concept.id}.name`, { defaultValue: item.concept.name })}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getDifficultyColor(
                              item.concept.difficulty
                            )}`}
                          >
                            {t(`grammar.item.difficulty.${item.concept.difficulty}`)}
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          {t(`grammar.items.${item.concept.id}.description`, { defaultValue: item.concept.description })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            {t('grammar.item.found_in_lines', { count: item.lineNumbers.length })}
                          </span>
                        </div>
                      </div>
                      <div>
                        {selectedConcept === item.concept.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </button>

                    {/* Lesson Content */}
                    <AnimatePresence>
                      {selectedConcept === item.concept.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-gray-200 dark:border-gray-600"
                        >
                          <div className="space-y-4 p-4">
                            {/* Mini Lesson */}
                            <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
                              <h5 className="mb-2 flex items-center gap-2 font-semibold text-primary-900 dark:text-primary-100">
                                <BookOpen className="h-4 w-4" />
                                {t('grammar.lesson.title')}
                              </h5>
                              <div className="whitespace-pre-line text-sm text-primary-800 dark:text-primary-200">
                                {t(`grammar.lessons.${item.concept.id}`, { defaultValue: item.concept.lesson })}
                              </div>
                            </div>

                            {/* Examples from This Song */}
                            <div className="rounded-lg bg-accent-50 p-4 dark:bg-accent-900/20">
                              <h5 className="mb-2 font-semibold text-accent-900 dark:text-accent-100">{t('grammar.examples.title')}</h5>
                              <div className="space-y-2">
                                {item.matches.slice(0, 5).map((match, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                                  >
                                    "{match}"
                                  </div>
                                ))}
                                {item.matches.length > 5 && (
                                  <p className="text-xs text-accent-700 dark:text-accent-300">
                                    {t('grammar.examples.more', { count: item.matches.length - 5 })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Learn More Link */}
                            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                              <h5 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">{t('grammar.learn_more.title')}</h5>
                              <a
                                href={item.concept.learnMoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {t('grammar.learn_more.cta')}
                              </a>
                              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">{t('grammar.learn_more.note')}</p>
                            </div>

                            {/* Lines where found */}
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {t('grammar.lines_label', {
                                lines: `${item.lineNumbers.slice(0, 10).join(', ')}${item.lineNumbers.length > 10 ? '...' : ''}`,
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ) : (
              // FIXED: New "No grammar found" state
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                    <Info className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">{t('grammar.none.heading')}</h4>
                  <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
                    {t('grammar.none.message', { language: language || t('grammar.none.this_language') })} {t('grammar.none.normal_for')}
                  </p>
                  <ul className="mt-3 space-y-1 text-left text-sm text-gray-600 dark:text-gray-400">
                    <li>• {t('grammar.none.reasons.1')}</li>
                    <li>• {t('grammar.none.reasons.2')}</li>
                    <li>• {t('grammar.none.reasons.3')}</li>
                  </ul>
                  <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>{t('grammar.tip_label')}</strong> {t('grammar.tip')}
                    </p>
                  </div>
                 </div>
               </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 };