// frontend/src/pages/ReviewWords.tsx
// Review Words quiz page

import { useState, useEffect } from 'react';
import { Trophy, Target, Flame, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import { vocabularyApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [reservedSlot, setReservedSlot] = useState(false);

  // Current word being reviewed
  const currentWord = session?.words?.[session?.currentIndex || 0];

  // Helper to release local reservation for today's started count
  const releaseReservation = () => {
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const key = `vocab_review_started_${y}-${m}-${d}`;
      const startedStr = localStorage.getItem(key);
      const current = startedStr ? Number(startedStr) : 0;
      const next = Math.max(0, current - 1);
      localStorage.setItem(key, String(next));
      setReservedSlot(false);
    } catch (e) {
      // ignore
    }
  };

  const startReview = async () => {
    try {
      // Enforce 2 review sessions per user per server-day.
      // Prefer authoritative server-side count when authenticated.
      let serverCount = 0;
      if (user) {
        try {
          const res = await progressApi.getVocabCount();
          serverCount = res?.count ?? 0;
        } catch (e) {
          serverCount = 0;
        }
      }

      // Local started reservations for today (best-effort). Keyed by date.
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const key = `vocab_review_started_${y}-${m}-${d}`;
      const startedStr = localStorage.getItem(key);
      const started = startedStr ? Number(startedStr) : 0;

      const effectiveCount = serverCount + started;

      // Treat either hasPremium or isPremium as the premium flag (backend uses hasPremium)
      const userHasPremium = Boolean((user as any)?.hasPremium || (user as any)?.isPremium);
      if (!userHasPremium && effectiveCount >= 2) {
        // Show upgrade modal and prevent starting
        setShowUpgradeModal(true);
        return;
      }

      // Reserve a slot immediately to prevent parallel starts
      try {
        const currentStarted = startedStr ? Number(startedStr) : 0;
        localStorage.setItem(key, String(currentStarted + 1));
        setReservedSlot(true);
      } catch (e) {
        // ignore storage errors
      }

      // Fetch words to work on
      const response = await vocabularyApi.getWords({ status: 'learning' });
      const allWords: VocabularyWord[] = response.words || [];

      if (allWords.length === 0) {
        alert(t('pages.review_words.no_words'));
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
      alert(t('pages.review_words.load_failed'));
    }
  };

  const handleSubmitAnswer = () => {
    // Ensure session and current word exist before accessing fields
    if (!session || !currentWord || currentAnswer.trim() === '') return;

    const userAnswerNormalized = currentAnswer.trim().toLowerCase();
    const correctAnswerNormalized = (currentWord.translation || '').trim().toLowerCase();

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
      } catch (recordError: any) {
        // If backend rejects due to daily limit, show upgrade modal and prevent completion.
        if (recordError?.response?.status === 402) {
          setShowUpgradeModal(true);
          // Do not show celebration. Keep localStorage reservation so the daily count remains blocked.
          setHasStarted(false);
          setSession(null);
          setCurrentAnswer('');
          return;
        }
        console.warn('Failed to record vocabulary review session, continuing anyway:', recordError);
      }

      // Get XP from backend response, fallback to fixed amount
      const xpEarned = sessionResponse?.xpEarned ?? sessionResponse?.xp ?? REVIEW_XP;

      // Reload user progress to get updated totals (server may already have applied XP)
      const progressResponse = await progressApi.getProgress();

      // Calculate new total XP (add review XP to current total)
      const newTotalXp = (progressResponse.totalXp || user?.totalXp || 0);

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
      // release local reservation when finished
      if (reservedSlot) releaseReservation();
    } catch (error: any) {
      console.error('Failed to record review session:', error);
      // If we were rejected due to daily limit, show upgrade modal and do not award XP
      if (error?.response?.status === 402 || error?.statusCode === 402) {
        setShowUpgradeModal(true);
        setHasStarted(false);
        setSession(null);
        setCurrentAnswer('');
        // Intentionally do NOT release the local reservation so the client-side count remains consistent.
        return;
      }

      // Fallback: still show celebration and award fallback XP when the backend call fails for other reasons
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
      if (reservedSlot) releaseReservation();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return t('pages.review_words.time_seconds', { s: secs });
    return t('pages.review_words.time_minutes_seconds', { m: mins, s: secs });
  };

  // Cleanup: if user navigates away/unmounts while a slot is reserved, release it
  useEffect(() => {
    return () => {
      if (reservedSlot) releaseReservation();
    };
  }, [reservedSlot]);

  // Initial state - just the Begin Review button
  if (!hasStarted) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Button
          variant="primary"
          onClick={startReview}
          className="px-8 py-4 text-lg font-semibold"
        >
          {t('pages.review_words.begin_review')}
        </Button>

        {showUpgradeModal && (
          <PremiumUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
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
                {t('pages.review_words.good_job_title')}
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
                  {t('pages.review_words.correct_label')}
                </div>
              </div>

              {/* XP Earned */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 text-center border border-blue-200 dark:border-blue-800">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  +{sessionStats.xpEarned}
                </div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {t('pages.review_words.xp_earned')}
                </div>
              </div>

              {/* Streak */}
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-4 text-center border border-orange-200 dark:border-orange-800">
                <Flame className="mx-auto mb-2 h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {sessionStats.streak}
                </div>
                <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  {t('pages.review_words.day_streak')}
                </div>
              </div>

              {/* Time */}
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 text-center border border-purple-200 dark:border-purple-800">
                <Clock className="mx-auto mb-2 h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatTime(sessionStats.timeSpent)}
                </div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {t('pages.review_words.time_label')}
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
                {t('pages.review_words.back_to_library')}
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
          {t('pages.review_words.progress', { current: session.currentIndex + 1, total: session.words.length })}
        </div>
        {session.totalAnswered > 0 && (
          <div className="mt-2 text-lg font-semibold text-primary-600 dark:text-primary-400">
            {t('pages.review_words.correct_progress', { correct: session.correctCount, total: session.totalAnswered })}
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
            {t('pages.review_words.question_prefix')}
            <span className="text-primary-600 dark:text-primary-400">{currentWord.word}</span>?
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
          placeholder={t('pages.review_words.placeholder_type_answer')}
          className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          autoFocus
        />

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowHint(true)}
            className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors border border-yellow-300 dark:border-yellow-800"
          >
            {t('pages.review_words.hint')}
          </button>
          <Button
            variant="primary"
            onClick={handleSubmitAnswer}
            className="mt-4 w-full"
          >
            {t('pages.review_words.submit')}
          </Button>
        </div>
      </div>

      {/* Hint Modal */}
      <Modal
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        title={t('pages.review_words.hint')}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
              {t('pages.review_words.original_line')}
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
            {t('common.close')}
          </Button>
        </div>
      </Modal>

      {/* Upgrade modal (shown when limit reached) */}
      {showUpgradeModal && (
        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export default ReviewWords;
