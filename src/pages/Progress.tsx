// frontend/src/pages/Progress.tsx
// UPDATED: Added Vocabulary tab with VocabularySection component

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useStore';
import { VocabularySection } from '@/components/VocabularySection';
import { UserDropdown } from '@/components/UserDropdown';

export const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // NEW: Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'vocabulary'>('overview');
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (Array.isArray(user?.targetLanguages) && user.targetLanguages.length > 0) {
      const first = user.targetLanguages[0];
      return typeof first === 'string' ? first : first.code || 'en';
    }
    return 'en';
  });

  const daysSinceJoined = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Your Progress
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your learning journey
                </p>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* NEW: Tabs */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'vocabulary'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              Vocabulary
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === 'overview' ? (
          <>
            {/* Overview Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/20">
                    <TrendingUp className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {user?.totalXp || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent-100 p-3 dark:bg-accent-900/20">
                    <Calendar className="h-6 w-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {user?.currentStreak || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {user?.targetLanguages?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Languages</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {daysSinceJoined}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Days Active</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* XP Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card mb-8"
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                XP Progress
              </h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Current Level</span>
                  <span className="font-bold text-primary-600">
                    Level {Math.floor((user?.totalXp || 0) / 100) + 1}
                  </span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all"
                    style={{
                      width: `${((user?.totalXp || 0) % 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{(user?.totalXp || 0) % 100} XP</span>
                  <span>Next level: {(Math.floor((user?.totalXp || 0) / 100) + 1) * 100} XP</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="mb-1 text-sm text-green-700 dark:text-green-300">Easy Mode</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">+10 XP</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="mb-1 text-sm text-yellow-700 dark:text-yellow-300">Medium Mode</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">+20 XP</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="mb-1 text-sm text-red-700 dark:text-red-300">Hard Mode</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">+30 XP</p>
                </div>
              </div>
            </motion.div>

            {/* Streak Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card mb-8"
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Streak History
              </h2>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => {
                  const isPracticed = i < (user?.currentStreak || 0);
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg ${
                        isPracticed
                          ? 'bg-gradient-to-br from-accent-500 to-accent-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={isPracticed ? 'Practiced' : 'Not practiced'}
                    />
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {user?.currentStreak || 0} days 🔥
                  </p>
                </div>
                {user?.lastPracticeDate && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Practice</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(user.lastPracticeDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Target Languages Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Languages You're Learning
              </h2>
              
              {user?.targetLanguages && user.targetLanguages.length > 0 ? (
                <div className="space-y-4">
                  {user.targetLanguages.map((tl, index) => {
                    const code = typeof tl === 'string' ? tl : tl.code;
                    const level = typeof tl === 'string' ? 'beginner' : tl.level;
                    
                    return (
                      <div key={code} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {code.toUpperCase()}
                            </p>
                            <p className="text-sm capitalize text-gray-600 dark:text-gray-400">
                              {level}
                            </p>
                          </div>
                          <span className="badge-primary">{code.toUpperCase()}</span>
                        </div>
                        
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full bg-primary-600 transition-all"
                            style={{ width: `${(index + 1) * 20}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                  <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                    No target languages yet
                  </p>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Add languages you want to learn in your account settings
                  </p>
                  <button
                    onClick={() => navigate('/account')}
                    className="btn-primary"
                  >
                    Add Languages
                  </button>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          // NEW: Vocabulary Tab Content
          <div className="space-y-6">
            {user?.targetLanguages && user.targetLanguages.length > 0 ? (
              <>
                {/* Language tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  {(Array.isArray(user.targetLanguages) ? user.targetLanguages : []).map((lang: any) => {
                    const langCode = typeof lang === 'string' ? lang : lang.code || 'en';
                    return (
                      <button
                        key={langCode}
                        onClick={() => setSelectedLanguage(langCode)}
                        className={`px-4 py-2 font-medium transition-colors ${
                          selectedLanguage === langCode
                            ? 'border-b-2 border-primary-600 text-primary-600'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                      >
                        {langCode.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                <VocabularySection language={selectedLanguage} />
              </>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-400">
                  No target languages set. Add target languages in your account settings.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
