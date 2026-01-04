// frontend/src/pages/ReviewWords.tsx
// Review Words quiz page

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Flame, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { vocabularyApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';

interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  language: string;
  context: string;
  status: 'learning' | 'learned';
}

interface ReviewSession {
  words: VocabularyWord[];
  currentIndex: number;
  userAnswers: string[];
  correctCount: number;
  totalAnswered: number;
  startTime: number;
}

export const ReviewWords = ({ onBackToLibrary }: { onBackToLibrary: () => void }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [hasStarted, setHasStarted] = useState(false);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sessionStats, setSessionStats] = useState<{
    correctCount: number;
    totalWords: number;
    streak: number;
    timeSpent: number;
    xpEarned: number;
  } | null>(null);

  const startReview = async () => {
    try {
      // Fetch words to work on
      const response = await vocabularyApi.getWords({ status: 'learning' });
      const allWords: VocabularyWord[] = response.words || [];

      if (allWords.length === 0) {
        alert('No words to review! Add some words from learning sessions first.');
        return;
      }

      // Randomly select 7 words (or fewer if not enough words)
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(7, allWords.length));

      setSession({
        words: selectedWords,
        currentIndex: 0,
        userAnswers: [],
        correctCount: 0,
        totalAnswered: 0,
        startTime: Date.now(),
      });
      setHasStarted(true);
    } catch (error) {
      console.error('Failed to load words:', error);
      alert('Failed to load words. Please try again.');
    }
  };

  const handleSubmitAnswer = () => {
    if (!session || currentAnswer.trim() === '') return;

    const currentWord = session.words[session.currentIndex];
    const userAnswerNormalized = currentAnswer.trim().toLowerCase();
    const correctAnswerNormalized = currentWord.translation.trim().toLowerCase();
    
    const isCorrect = userAnswerNormalized === correctAnswerNormalized;
    
    const newCorrectCount = session.correctCount + (isCorrect ? 1 : 0);
    const newTotalAnswered = session.totalAnswered + 1;

    // Move to next word or finish
    if (session.currentIndex < session.words.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
        correctCount: newCorrectCount,
        totalAnswered: newTotalAnswered,
        userAnswers: [...session.userAnswers, currentAnswer],
      });
      setCurrentAnswer('');
    } else {
      // Last word - finish review
      finishReview(newCorrectCount, newTotalAnswered);
    }
  };

  const finishReview = async (finalCorrectCount: number, finalTotalAnswered: number) => {
    if (!session) return;

    const timeSpent = Math.floor((Date.now() - session.startTime) / 1000);
    const REVIEW_XP = 10; // Fixed XP for review sessions

    try {
      // Try to record review session (may fail if backend doesn't accept vocabulary-review as songId)
      let sessionResponse;
      try {
        sessionResponse = await progressApi.recordSession({
          songId: 'vocabulary-review',
          difficulty: 'medium',
          accuracy: Math.round((finalCorrectCount / finalTotalAnswered) * 100),
          completedLines: finalTotalAnswered,
          totalLines: session.words.length,
          timeSpentMs: Date.now() - session.startTime,
        });
      } catch (recordError) {
        console.warn('Failed to record vocabulary review session, continuing anyway:', recordError);
      }

      // Get XP from backend response, fallback to fixed amount
      const xpEarned = sessionResponse?.xpEarned || sessionResponse?.xp || REVIEW_XP;

      // Reload user progress to get updated streak
      const progressResponse = await progressApi.getProgress();
      
      // Calculate new total XP (add review XP to current total)
      const newTotalXp = (progressResponse.totalXp || user?.totalXp || 0) + xpEarned;
      
      updateUser({
        totalXp: newTotalXp,
        currentStreak: progressResponse.currentStreak,
        longestStreak: progressResponse.longestStreak,
      });

      setSessionStats({
        correctCount: finalCorrectCount,
        totalWords: finalTotalAnswered,
        streak: progressResponse.currentStreak,
        timeSpent,
        xpEarned,
      });
      setShowCelebration(true);
    } catch (error) {
      console.error('Failed to record review session:', error);
      // Still show celebration even if recording failed
      // Add XP manually
      const newTotalXp = (user?.totalXp || 0) + REVIEW_XP;
      updateUser({
        totalXp: newTotalXp,
      });
      
      setSessionStats({
        correctCount: finalCorrectCount,
        totalWords: finalTotalAnswered,
        streak: user?.currentStreak || 0,
        timeSpent,
        xpEarned: REVIEW_XP,
      });
      setShowCelebration(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const currentWord = session?.words[session.currentIndex];

  // Initial state - just the Begin Review button
  if (!hasStarted) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Button
          variant="primary"
          onClick={startReview}
          className="px-8 py-4 text-lg font-semibold"
        >
          Begin Review
        </Button>
      </div>
    );
  }

  // Celebration modal
  if (showCelebration && sessionStats) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <div className="rounded-2xl bg-white dark:bg-gray-900 dark:border dark:border-gray-800 p-8 shadow-2xl">
            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6 flex justify-center"
            >
              <div className="rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-6 shadow-lg">
                <Trophy className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-center"
            >
              <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-gray-100">
                Good job reviewing! 🎉
              </h1>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {/* Correct Answers */}
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 text-center border border-green-200 dark:border-green-800">
                <Target className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {sessionStats.correctCount}/{sessionStats.totalWords}
                </div>
                <div className="text-xs font-medium text-green-700 dark:text-green-300">
                  Correct
                </div>
              </div>

              {/* XP Earned */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 text-center border border-blue-200 dark:border-blue-800">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  +{sessionStats.xpEarned}
                </div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  XP Earned
                </div>
              </div>

              {/* Streak */}
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-4 text-center border border-orange-200 dark:border-orange-800">
                <Flame className="mx-auto mb-2 h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {sessionStats.streak}
                </div>
                <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Day Streak
                </div>
              </div>

              {/* Time */}
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 text-center border border-purple-200 dark:border-purple-800">
                <Clock className="mx-auto mb-2 h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatTime(sessionStats.timeSpent)}
                </div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Time
                </div>
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="primary"
                onClick={onBackToLibrary}
                className="w-full rounded-xl py-4 text-lg font-semibold"
              >
                Back to My Library
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Review in progress
  if (!currentWord) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Progress Indicator */}
      <div className="mb-8 text-center">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Word {session.currentIndex + 1} of {session.words.length}
        </div>
        {session.totalAnswered > 0 && (
          <div className="mt-2 text-lg font-semibold text-primary-600 dark:text-primary-400">
            Correct: {session.correctCount}/{session.totalAnswered}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-6 rounded-xl bg-white dark:bg-gray-900 dark:border dark:border-gray-800 p-8 shadow-lg">
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {currentWord.language.toUpperCase()}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            What is the translation of <span className="text-primary-600 dark:text-primary-400">{currentWord.word}</span>?
          </h2>
        </div>

        {/* Input */}
        <input
          type="text"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmitAnswer();
            }
          }}
          placeholder="Type your answer..."
          className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          autoFocus
        />

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowHint(true)}
            className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors border border-yellow-300 dark:border-yellow-800"
          >
            Hint
          </button>
          <Button
            variant="primary"
            onClick={handleSubmitAnswer}
            disabled={currentAnswer.trim() === ''}
            className="flex-1"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Hint Modal */}
      <Modal
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        title="Hint"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
              ORIGINAL LINE
            </p>
            <p className="text-gray-900 dark:text-gray-100">
              {currentWord.context}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowHint(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
