// src/pages/Achievements.tsx
// Achievements and badges page - FULLY FUNCTIONAL with real user data

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Zap, Target, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { achievementsApi } from '@/lib/api';
import { UserDropdown } from '@/components/UserDropdown';
import { useTranslation } from 'react-i18next';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
}

export const Achievements = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  // Derive category identifiers from translation resources so labels are localized
  const categories = Object.keys(t('achievements.categories', { returnObjects: true }) as Record<string, string>);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'All');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await achievementsApi.getAchievements();
      setAchievements(response.achievements || []);
    } catch (err: any) {
      console.error('Failed to fetch achievements:', err);
      setError(t('achievements.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  // categories are derived from translations above

  const filteredAchievements = selectedCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('achievements.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchAchievements}
            className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            {t('achievements.retry')}
          </button>
        </div>
      </div>
    );
  }

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
                  {t('achievements.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('achievements.unlocked_of', { unlocked: unlockedCount, total: totalCount })}
                </p>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="mb-2 flex justify-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {unlockedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('achievements.stats.unlocked')}</p>
            </div>
            <div>
              <div className="mb-2 flex justify-center">
                <Star className="h-8 w-8 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('achievements.stats.completion')}</p>
            </div>
            <div>
              <div className="mb-2 flex justify-center">
                <Zap className="h-8 w-8 text-accent-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalCount - unlockedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('achievements.stats.remaining')}</p>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {t(`achievements.categories.${category}`, { defaultValue: category })}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card-hover relative overflow-hidden ${
                achievement.unlocked ? 'border-2 border-yellow-500' : ''
              }`}
            >
              {/* Unlocked Badge */}
              {achievement.unlocked && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                      : 'bg-gray-200 grayscale dark:bg-gray-700'
                  }`}
                >
                  {achievement.unlocked ? achievement.icon : <Lock className="h-8 w-8 text-gray-400" />}
                </div>
              </div>

              {/* Info */}
              <h3
                className={`mb-2 text-center text-lg font-bold ${
                  achievement.unlocked
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t(achievement.name as string, { defaultValue: achievement.name as string })}
              </h3>
              <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {t(achievement.description as string, { defaultValue: achievement.description as string })}
              </p>

              {/* Progress Bar (for locked achievements) */}
              {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <div>
                  <div className="mb-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{t('achievements.progress')}</span>
                    <span>
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{
                        width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Unlocked Date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="mt-4 text-center text-xs text-gray-500">
                  {t('achievements.unlocked_on', { date: new Date(achievement.unlockedAt).toLocaleDateString(i18n.language) })}
                </p>
              )}

              {/* Category Badge */}
              <div className="mt-4 flex justify-center">
                <span className="badge-secondary text-xs">{t(`achievements.categories.${achievement.category}`, { defaultValue: achievement.category })}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="card py-12 text-center">
            <Target className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('achievements.empty.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('achievements.empty.message')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};