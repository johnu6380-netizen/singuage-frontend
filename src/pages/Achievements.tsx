// src/pages/Achievements.tsx
// Achievements and badges page - FEATURE 4

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Zap, Target, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserDropdown } from '@/components/UserDropdown';

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

// Mock achievements data
const ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first song',
    icon: '🎵',
    category: 'Learning',
    unlocked: true,
    unlockedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'Streak',
    unlocked: false,
    progress: 3,
    maxProgress: 7,
  },
  {
    id: '3',
    name: 'XP Master',
    description: 'Earn 1000 total XP',
    icon: '⭐',
    category: 'XP',
    unlocked: false,
    progress: 450,
    maxProgress: 1000,
  },
  {
    id: '4',
    name: 'Polyglot',
    description: 'Learn songs in 3 different languages',
    icon: '🌍',
    category: 'Languages',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
  },
  {
    id: '5',
    name: 'Perfect Score',
    description: 'Complete a song with 100% accuracy',
    icon: '💯',
    category: 'Mastery',
    unlocked: false,
    progress: 94,
    maxProgress: 100,
  },
  {
    id: '6',
    name: 'Speed Demon',
    description: 'Complete a song in hard mode',
    icon: '⚡',
    category: 'Challenge',
    unlocked: false,
  },
];

export const Achievements = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Learning', 'Streak', 'XP', 'Languages', 'Mastery', 'Challenge'];

  const filteredAchievements = selectedCategory === 'All'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

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
                  Achievements
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unlockedCount} of {totalCount} unlocked
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
            </div>
            <div>
              <div className="mb-2 flex justify-center">
                <Star className="h-8 w-8 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
            </div>
            <div>
              <div className="mb-2 flex justify-center">
                <Zap className="h-8 w-8 text-accent-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalCount - unlockedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
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
              {category}
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
                {achievement.name}
              </h3>
              <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {achievement.description}
              </p>

              {/* Progress Bar (for locked achievements) */}
              {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <div>
                  <div className="mb-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Progress</span>
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
                  Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}

              {/* Category Badge */}
              <div className="mt-4 flex justify-center">
                <span className="badge-secondary text-xs">{achievement.category}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="card py-12 text-center">
            <Target className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              No achievements in this category
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};