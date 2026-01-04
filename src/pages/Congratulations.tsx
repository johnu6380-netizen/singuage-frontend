// frontend/src/pages/Congratulations.tsx
// Shown when user completes a learning session

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, CheckCircle, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface SessionStats {
  accuracy: number;
  linesCompleted: number;
  totalLines: number;
  durationSeconds: number;
  songTitle: string;
  difficulty: string;
  xpEarned: number;
}

export const Congratulations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stats = location.state?.stats as SessionStats;

  // Redirect to dashboard if no stats provided
  useEffect(() => {
    if (!stats) {
      navigate('/dashboard');
    }
  }, [stats, navigate]);

  if (!stats) {
    return null;
  }

  // Format duration nicely
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Main Card */}
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

          {/* Congratulations Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-center"
          >
            <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-gray-100">
              Congratulations! 🎉
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              You completed <span className="font-semibold text-primary-600 dark:text-primary-400">"{stats.songTitle}"</span>!
            </p>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-500">
              Great work! Every session brings you closer to fluency. Keep practicing, and you'll be amazed at how much you can achieve. We're proud of your dedication!
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 grid grid-cols-3 gap-4"
          >
            {/* Accuracy Card */}
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 text-center border border-green-200 dark:border-green-800">
              <Target className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.accuracy}%
              </div>
              <div className="text-xs font-medium text-green-700 dark:text-green-300">
                Accuracy
              </div>
            </div>

            {/* Lines Completed Card */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 text-center border border-blue-200 dark:border-blue-800">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.linesCompleted}/{stats.totalLines}
              </div>
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Lines
              </div>
            </div>

            {/* Duration Card */}
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 text-center border border-purple-200 dark:border-purple-800">
              <Clock className="mx-auto mb-2 h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatDuration(stats.durationSeconds)}
              </div>
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Time
              </div>
            </div>
          </motion.div>

          {/* XP Earned Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 shadow-lg">
              <span className="text-2xl">✨</span>
              <span className="text-lg font-bold text-white">
                +{stats.xpEarned} XP Earned
              </span>
            </div>
          </motion.div>

          {/* Back to Library Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-xl py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              Back to My Library
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
