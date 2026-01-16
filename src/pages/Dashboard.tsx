// frontend/src/pages/Dashboard.tsx
// FIXED: Added three-dot menu with "Change Lyrics" and "Remove" options
// Removed standalone trash icon in favor of dropdown menu

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music2, TrendingUp, Plus, Play, Flame, Loader, Trash2, Edit3, MoreVertical, HelpCircle, BookOpen, Unlock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { UserDropdown } from '@/components/UserDropdown';
import { Modal } from '@/components/ui/Modal';
import { Discover } from './Discover';
import { HowToPlay } from './HowToPlay';
import { ReviewWords } from './ReviewWords';
import { Upgrade } from './Upgrade';
import Premium from './Premium';
import { useAuthStore } from '@/store/useStore';
import { Footer } from '@/components/Footer';
import { songApi, progressApi, handleApiError } from '@/lib/api';
import { Song } from '@/types';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserLocal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'library' | 'discover' | 'reviewwords' | 'howtoplay' | 'upgrade' | 'premium'>('library');
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [inProgressMap, setInProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Track which menu is open
  const menuRef = useRef<HTMLDivElement>(null);
  // Mini-tabs for large libraries (group by language)
  const enableMiniTabs = savedSongs.length > 9;
  const groupedByLanguage = useMemo(() => {
    return savedSongs.reduce<Record<string, Song[]>>((acc, s) => {
      const lang = (s.language || 'unknown').toLowerCase();
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(s);
      return acc;
    }, {});
  }, [savedSongs]);

  const languages = Object.keys(groupedByLanguage).sort((a, b) => groupedByLanguage[b].length - groupedByLanguage[a].length);
  const [activeLanguageTab, setActiveLanguageTab] = useState<string | null>(null);

  useEffect(() => {
    if (enableMiniTabs) {
      setActiveLanguageTab(languages[0] || null);
    } else {
      setActiveLanguageTab(null);
    }
  }, [enableMiniTabs, languages.join(',')]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync active tab with `?tab=` query param so external navigation (e.g. from Upgrade page)
  // can switch the dashboard tab without remounting the component.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const allowedTabs = ['library', 'discover', 'reviewwords', 'howtoplay', 'upgrade', 'premium'];
    if (tabParam && allowedTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as any);
    }
  }, [location.search]);

  // Keep the URL in sync when the user switches tabs inside the dashboard.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const songsResponse = await songApi.getAll();
      const rawSongs: Song[] = songsResponse.songs || [];
      const uniqueByVideoId: Record<string, Song> = {};
      rawSongs.forEach(s => { if (s && s.youtubeVideoId) uniqueByVideoId[s.youtubeVideoId] = s; });

      // Sort songs alphabetically by title (case-insensitive) before setting state
      const songsSorted = Object.values(uniqueByVideoId).sort((s1: any, s2: any) =>
        String(s1.title || '').localeCompare(String(s2.title || ''), undefined, { sensitivity: 'base' })
      );
      setSavedSongs(songsSorted);

      // Compute which songs have saved in-progress progress (currentLine > 0 or completedLines > 0)
      const progressMap: Record<string, boolean> = {};
      songsSorted.forEach(s => {
        try {
          const keys: string[] = [];
          if (s.youtubeVideoId) keys.push(`session_progress_${s.youtubeVideoId}`);
          if (s.id) keys.push(`session_progress_id_${s.id}`);

          let found: any = null;
          for (const k of keys) {
            const str = localStorage.getItem(k);
            if (!str) continue;
            try {
              const parsed = JSON.parse(str);
              if (!parsed) continue;
              if (!found || (parsed.savedAt && new Date(parsed.savedAt).getTime() > new Date(found.savedAt || 0).getTime())) {
                found = parsed;
              }
            } catch (e) {
              // corrupt entry - remove
              localStorage.removeItem(k);
            }
          }

          if (found) {
            const currentLine = typeof found.currentLine === 'number' ? found.currentLine : 0;
            const completedLines = typeof found.completedLines === 'number' ? found.completedLines : 0;
            progressMap[s.id] = currentLine > 0 || completedLines > 0;
          } else {
            progressMap[s.id] = false;
          }
        } catch (err) {
          progressMap[s.id] = false;
        }
      });
      setInProgressMap(progressMap);

      const progressResponse = await progressApi.getProgress();
      setProgress(progressResponse);

      // Update local user state without triggering a backend profile update to avoid render loops
      if (user) {
        setUserLocal({
          ...user,
          totalXp: progressResponse.totalXp,
          currentStreak: progressResponse.currentStreak,
          longestStreak: progressResponse.longestStreak,
        });
      }
    } catch (error) {
      console.error('Error loading data:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = (song: Song) => {
    // Navigate using the song's database id (LearningSession expects :songId)
    navigate(`/learn/${song.id}`, { state: { song } });
  };

  const handleEditLyrics = (song: Song) => {
    setOpenMenuId(null);
    // Navigate to AddSong page with the song data
    navigate(`/add-song/${song.youtubeVideoId}`, { 
      state: { 
        video: {
          id: song.id,
          videoId: song.youtubeVideoId,
          title: song.title,
          artist: song.artist,
          thumbnail: `https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`,
          language: song.language,
          isExplicit: song.isExplicit || false,
        }
      } 
    });
  };

  const handleDeleteSong = async () => {
    if (!songToDelete) return;

    setIsDeleting(true);
    try {
      await songApi.delete(songToDelete.id);
      await loadData();
      setSongToDelete(null);
      console.log('✅ Song deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting song:', error);
      alert(handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenu = (songId: string) => {
    setOpenMenuId(openMenuId === songId ? null : songId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-white">
                <Music2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('app.title')}</h1>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('library')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'library'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <Music2 className="mr-2 inline h-5 w-5" />
              {t('tabs.library', { defaultValue: 'Library' })}
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <TrendingUp className="mr-2 inline h-5 w-5" />
              {t('tabs.discover', { defaultValue: 'Discover' })}
            </button>
            <button
              onClick={() => setActiveTab('reviewwords')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'reviewwords'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <BookOpen className="mr-2 inline h-5 w-5" />
              {t('tabs.review_words', { defaultValue: 'Review Words' })}
            </button>
            {/* Show Upgrade tab if user does NOT have premium; show Premium tab if user has premium */}
            {((user as any)?.hasPremium || (user as any)?.isPremium) ? (
              <button
                onClick={() => setActiveTab('premium')}
                className={`border-b-2 py-4 font-medium transition-colors ${
                  activeTab === 'premium'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <Star className="mr-2 inline h-5 w-5 text-yellow-400" />
                {t('tabs.premium')}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('upgrade')}
                className={`border-b-2 py-4 font-medium transition-colors ${
                  activeTab === 'upgrade'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <Unlock className="mr-2 inline h-5 w-5" />
                {t('tabs.upgrade')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('howtoplay')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'howtoplay'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <HelpCircle className="mr-2 inline h-5 w-5" />
              {t('tabs.how_to_play')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'library' ? (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Stats */}
          {!loading && progress && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900/20">
                    <TrendingUp className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.totalXp || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.dashboard.stats.total_xp')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.currentStreak || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.dashboard.stats.day_streak')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                    <Music2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{savedSongs.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('pages.dashboard.stats.songs')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Songs */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{t('pages.dashboard.my_songs')}</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-12 w-12 animate-spin text-primary-600" />
              </div>
            ) : savedSongs.length === 0 ? (
              <div className="card text-center py-12">
                <Music2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold">{t('pages.dashboard.no_songs_title')}</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">{t('pages.dashboard.no_songs_subtitle')}</p>
                <Button variant="primary" onClick={() => setActiveTab('discover')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.browse_songs', { defaultValue: 'Browse Songs' })}
                </Button>
              </div>
            ) : (
              <>
                {/* Mini language tabs when library is large */}
                {enableMiniTabs && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguageTab(lang)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${activeLanguageTab === lang ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                      >
                        {lang.toUpperCase()} ({groupedByLanguage[lang].length})
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    enableMiniTabs
                      ? (groupedByLanguage[activeLanguageTab || languages[0]] || [])
                      : savedSongs
                  ).map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="card-hover group relative cursor-pointer"
                      onClick={() => handleStartLearning(song)}
                    >
                      {/* FIXED: Three-dot menu button */}
                      <div className="absolute right-2 top-2 z-10" ref={openMenuId === song.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(song.id);
                          }}
                          className="rounded-lg bg-white/90 p-2 opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                          title={t('common.options')}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                          {openMenuId === song.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLyrics(song);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit3 className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">{t('pages.dashboard.change_lyrics')}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setSongToDelete(song);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-600 dark:text-red-400">{t('buttons.remove')}</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-200">
                        <img
                          src={`https://img.youtube.com/vi/${song.youtubeVideoId}/mqdefault.jpg`}
                          alt={song.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2">
                          <span className="badge-primary">{song.language.toUpperCase()}</span>
                        </div>
                      </div>

                      <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">{song.title}</h3>
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{song.artist}</p>

                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartLearning(song);
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {inProgressMap[song.id] ? t('buttons.keep_playing') : t('buttons.start_learning')}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeTab === 'discover' ? (
        <Discover onSongAdded={loadData} />
      ) : activeTab === 'reviewwords' ? (
        <ReviewWords onBackToLibrary={() => setActiveTab('library')} />
      ) : activeTab === 'upgrade' ? (
        <Upgrade />
      ) : activeTab === 'premium' ? (
        <Premium />
        ) : (
         <HowToPlay />
       )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!songToDelete}
        onClose={() => !isDeleting && setSongToDelete(null)}
        title={t('pages.dashboard.remove_song_title')}
      >
        {songToDelete && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t('pages.dashboard.remove_song_confirm', { title: songToDelete.title, artist: songToDelete.artist })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('pages.dashboard.remove_song_note')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSongToDelete(null)}
                disabled={isDeleting}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleDeleteSong}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.removing')}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('buttons.remove')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </div>
  );
};