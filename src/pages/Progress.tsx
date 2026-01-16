// frontend/src/pages/Progress.tsx
// UPDATED: Added Vocabulary tab with VocabularySection component

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useStore';
import { VocabularySection } from '@/components/VocabularySection';
import { UserDropdown } from '@/components/UserDropdown';
import { vocabularyApi, progressApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

export const Progress = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Vocabulary stats per language from backend
  const [_vocabStats, setVocabStats] = useState<{
    total: number;
    learning: number;
    learned: number;
    byLanguage: { language: string; total: number; learning: number; learned: number }[];
  } | null>(null);
  // XP by language from backend
  const [xpByLanguage, setXpByLanguage] = useState<{ language: string; xp: number }[] | null>(null);

  const daysSinceJoined = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Streak calendar dates (normalized ISO date strings 'YYYY-MM-DD')
  const [streakDates, setStreakDates] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const res = await vocabularyApi.getStats();
        if (mounted) setVocabStats(res || null);
      } catch (e) {
        console.warn('Failed to load vocabulary stats', e);
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const loadXpByLang = async () => {
      try {
        const res = await progressApi.getXpByLanguage();
        // backend returns { xpByLanguage: [...] } per route implementation
        const data = res?.xpByLanguage ?? res;
        if (mounted) setXpByLanguage(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('Failed to load XP by language', e);
      }
    };
    loadXpByLang();
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const loadStreak = async () => {
      try {
        const res = await progressApi.getStreakCalendar();
        // backend returns { dates: [...] } but some responses may return the array directly
        const raw = res?.dates ?? res;
        const arr = Array.isArray(raw) ? raw : [];
        const dates: string[] = arr.map((d: any) => {
          const dt = new Date(d);
          dt.setHours(0, 0, 0, 0);
          return dt.toISOString().split('T')[0];
        });
        if (mounted) setStreakDates(dates);
      } catch (e) {
        console.warn('Failed to load streak calendar', e);
      }
    };
    loadStreak();
    return () => { mounted = false; };
  }, [user?.id, user?.lastPracticeDate, user?.currentStreak]);

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
                  {t('pages.progress.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('pages.progress.subtitle')}
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
              {t('pages.progress.overview_tab')}
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'vocabulary'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {t('pages.progress.vocabulary_tab')}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.bars.xp')}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.bars.streak')}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.languages_label')}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.days_active')}</p>
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
                {t('pages.progress.xp_progress_heading')}
              </h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('pages.progress.current_level')}</span>
                  <span className="font-bold text-primary-600">
                    {t('pages.progress.level_label', { level: Math.floor((user?.totalXp || 0) / 100) + 1 })}
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
                  <span>{t('pages.progress.current_xp_short', { xp: (user?.totalXp || 0) % 100 })}</span>
                  <span>{t('pages.progress.next_level_label', { xp: (Math.floor((user?.totalXp || 0) / 100) + 1) * 100 })}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="mb-1 text-sm text-green-700 dark:text-green-300">{t('pages.learning_session.modes.easy')}</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{t('pages.progress.xp_values.easy')}</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="mb-1 text-sm text-yellow-700 dark:text-yellow-300">{t('pages.learning_session.modes.medium')}</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{t('pages.progress.xp_values.medium')}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="mb-1 text-sm text-red-700 dark:text-red-300">{t('pages.learning_session.modes.hard')}</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{t('pages.progress.xp_values.hard')}</p>
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
                {t('pages.progress.streak_history')}
              </h2>
              
              {/* Month calendar: show days of current month; practiced days show a fire emoji */}
              <div className="w-full overflow-x-auto">
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth(); // 0-indexed
                  const firstOfMonth = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0).getDate();
                  const startWeekday = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

                  // Build cells: leading blanks then days 1..lastDay
                  const cells: Array<null | number> = [];
                  for (let i = 0; i < startWeekday; i++) cells.push(null);
                  for (let d = 1; d <= lastDay; d++) cells.push(d);

                  const dateToKey = (dayNum: number) => {
                    const dt = new Date(year, month, dayNum);
                    dt.setHours(0, 0, 0, 0);
                    return dt.toISOString().split('T')[0];
                  };

                  // Normalize today's date and lastPracticeDate to ISO day keys to avoid timezone mismatches
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayKey = today.toISOString().split('T')[0];
                  const lastPracticeKey = user?.lastPracticeDate ? (() => {
                    const d = new Date(user.lastPracticeDate);
                    d.setHours(0, 0, 0, 0);
                    return d.toISOString().split('T')[0];
                  })() : null;

                  return (
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {/* Weekday headers */}
                      {(function renderWeekdays() {
                        const weekdayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
                        return weekdayKeys.map((k) => (
                          <div key={k} className="text-xs font-medium text-gray-500">{t(`pages.progress.weekdays.${k}`)}</div>
                        ));
                      })()}

                      {cells.map((c, idx) => {
                        if (c === null) return <div key={idx} className="h-10" />;
                        const iso = dateToKey(c);
                        const practiced = streakDates.includes(iso) || (iso === todayKey && lastPracticeKey === todayKey);
                        return (
                          <div
                            key={iso}
                            className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium ${practiced ? 'text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                            title={practiced ? t('pages.progress.practiced_on', { date: iso }) : iso}
                          >
                            {practiced ? (
                              <div className="relative flex h-10 w-10 items-center justify-center">
                                {/* big fire emoji behind */}
                                <span className="absolute inset-0 flex items-center justify-center text-2xl leading-none">🔥</span>
                                {/* day number on top */}
                                <span className="relative text-sm font-semibold drop-shadow-sm">{c}</span>
                              </div>
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center">{c}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

               <div className="mt-6 flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.current_streak_label')}</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                     {t('pages.progress.current_streak_display', { count: user?.currentStreak || 0 })}
                   </p>
                 </div>
                 {user?.lastPracticeDate && (
                   <div className="text-right">
                     <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.progress.last_practice_label')}</p>
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
                {t('pages.progress.languages_progress_heading')}
              </h2>
              
              {user?.targetLanguages && user.targetLanguages.length > 0 ? (
                <div className="space-y-4">
                  {user.targetLanguages.map((tl) => {
                    const code = typeof tl === 'string' ? tl : tl.code;
                    const levelLabel = typeof tl === 'string' ? 'beginner' : tl.level;
                    
                    // Find xp for this language
                    const langXpEntry = xpByLanguage?.find((b) => (b.language || '').toLowerCase() === (code || '').toLowerCase());
                    const xp = langXpEntry ? Number(langXpEntry.xp || 0) : 0;

                    // Exponential leveling parameters
                    const BASE_XP = 100; // XP required for level 1
                    const GROWTH = 1.5; // exponential growth per level

                    // Compute level and progress using cumulative formula:
                    // cumulative XP to reach level L: BASE_XP * (GROWTH^L - 1) / (GROWTH - 1)
                    const computeLevel = (xpValue: number) => {
                      const x = Math.max(0, xpValue);
                      // Solve for L: GROWTH^L = 1 + (GROWTH-1) * x / BASE_XP
                      const denom = (GROWTH - 1);
                      const val = 1 + denom * x / BASE_XP;
                      const rawL = Math.log(Math.max(val, 1)) / Math.log(GROWTH);
                      const level = Math.floor(rawL);
                      const gPowL = Math.pow(GROWTH, level);
                      const cumL = BASE_XP * (gPowL - 1) / denom; // XP to reach current level
                      const xpIntoLevel = x - cumL;
                      const xpForNext = BASE_XP * gPowL; // next level size
                      const percentToNext = xpForNext > 0 ? Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))) : 0;
                      const cumNext = BASE_XP * (Math.pow(GROWTH, level + 1) - 1) / denom; // total XP required to reach next level
                      const remainingToNext = Math.max(0, Math.ceil(cumNext - x));
                      return { level, xpIntoLevel: Math.max(0, xpIntoLevel), xpForNext, percentToNext, cumNext, remainingToNext };
                    };
 
                    const { level, xpIntoLevel: _xpIntoLevel, xpForNext: _xpForNext, percentToNext, cumNext, remainingToNext } = computeLevel(xp);
 
                     return (
                       <div key={code} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {t('pages.progress.language_header', { code: code.toUpperCase(), level })}
                            </p>
                            <p className="text-sm capitalize text-gray-600 dark:text-gray-400">
                              {t(`pages.progress.levels.${levelLabel}`, { defaultValue: levelLabel })}
                            </p>
                          </div>
                          <span className="badge-primary">{code.toUpperCase()}</span>
                        </div>

                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                          <span>{t('pages.progress.total_xp', { xp })}</span>
                          <span className="font-medium">{t('pages.progress.xp_to_next', { xp: remainingToNext })}</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full bg-primary-600 transition-all"
                            style={{ width: `${percentToNext}%` }}
                          />
                        </div>

                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{t('pages.progress.xp_summary', { xp, cumNext: Math.floor(cumNext) })}</span>
                        </div>
                       </div>
                     );
                   })}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                  <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                    {t('pages.progress.no_target_languages_msg')}
                  </p>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {t('pages.progress.add_languages_cta')}
                  </p>
                  <button
                    onClick={() => navigate('/account')}
                    className="btn-primary"
                  >
                    {t('pages.progress.add_languages_cta')}
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
                  {t('pages.progress.no_target_languages_help')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
