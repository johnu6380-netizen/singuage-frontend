// frontend/src/components/VocabularySection.tsx
// NEW COMPONENT: Vocabulary management with Words to Work on and Learned Words

import { useState, useEffect } from 'react';
import { Trash2, Check, X, Edit2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vocabularyApi } from '@/lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

interface VocabularyWord {
  id: string;
  word: string;
  translation: string | null;
  language: string;
  context: string | null;
  status: 'learning' | 'learned';
  createdAt: string | Date;
  learnedAt: string | Date | null;
}

interface Props {
  language: string;
}

export const VocabularySection = ({ language }: Props) => {
  const [learningWords, setLearningWords] = useState<VocabularyWord[]>([]);
  const [learnedWords, setLearnedWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [testingWord, setTestingWord] = useState<VocabularyWord | null>(null);
  const [testAnswer, setTestAnswer] = useState('');
  const [testResult, setTestResult] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    loadWords();
  }, [language]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const [learningRes, learnedRes] = await Promise.all([
        vocabularyApi.getWords({ status: 'learning', language }),
        vocabularyApi.getWords({ status: 'learned', language }),
      ]);
      
      setLearningWords(learningRes.words || []);
      setLearnedWords(learnedRes.words || []);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTranslation = async (wordId: string, newTranslation: string) => {
    try {
      await vocabularyApi.updateWord(wordId, { translation: newTranslation });
      setEditingId(null);
      setEditValue('');
      loadWords();
    } catch (error) {
      console.error('Failed to update translation:', error);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    try {
      await vocabularyApi.deleteWord(wordId);
      loadWords();
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const handleTestWord = async () => {
    if (!testingWord || !testAnswer.trim()) return;

    try {
      const result = await vocabularyApi.testWord(testingWord.id, testAnswer);
      
      if (result.correct) {
        setTestResult('correct');
        setTimeout(() => {
          setTestingWord(null);
          setTestAnswer('');
          setTestResult(null);
          loadWords();
        }, 2000);
      } else {
        setTestResult('incorrect');
        setTimeout(() => {
          setTestResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to test word:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vocabulary...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Words to Work on */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <BookOpen className="h-5 w-5" />
          Words to Work on ({learningWords.length})
        </h3>

        {learningWords.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No words yet. Click on words during learning sessions to add them here!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {learningWords.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {word.word}
                      </span>
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                        {word.language.toUpperCase()}
                      </span>
                    </div>

                    {editingId === word.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Enter translation"
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTranslation(word.id, editValue)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditValue('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {word.translation || 'No translation set'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingId(word.id);
                            setEditValue(word.translation || '');
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {word.context && (
                      <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-500">
                        "{word.context}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {word.translation && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setTestingWord(word)}
                      >
                        Mark as Learned
                      </Button>
                    )}
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Learned Words */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <Check className="h-5 w-5 text-green-600" />
          Learned Words ({learnedWords.length})
        </h3>

        {learnedWords.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No learned words yet. Keep practicing!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learnedWords.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-green-50 dark:bg-green-900/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
                      {word.word}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {word.translation}
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Test Word Modal */}
      <Modal
        isOpen={!!testingWord}
        onClose={() => {
          setTestingWord(null);
          setTestAnswer('');
          setTestResult(null);
        }}
        title="Test Your Knowledge"
      >
        {testingWord && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                What is the translation of:
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {testingWord.word}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                Type your answer in <strong>lowercase</strong>. Accent marks will be ignored.
              </p>
              <Input
                value={testAnswer}
                onChange={(e) => setTestAnswer(e.target.value)}
                placeholder="Type translation..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleTestWord();
                }}
                autoFocus
              />
            </div>

            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-lg p-4 ${
                    testResult === 'correct'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <p
                    className={`text-center font-semibold ${
                      testResult === 'correct'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}
                  >
                    {testResult === 'correct'
                      ? '✅ Correct! Moving to Learned Words...'
                      : '❌ Not quite — keep practicing!'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="primary"
              fullWidth
              onClick={handleTestWord}
              disabled={!testAnswer.trim() || testResult === 'correct'}
            >
              Check Answer
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
