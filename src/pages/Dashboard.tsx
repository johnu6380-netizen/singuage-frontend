// frontend/src/pages/Dashboard.tsx
// FIXED: Added three-dot menu with "Change Lyrics" and "Remove" options
// Removed standalone trash icon in favor of dropdown menu

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, TrendingUp, Plus, Play, Flame, Loader, Trash2, Edit3, MoreVertical, HelpCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { UserDropdown } from '@/components/UserDropdown';
import { Modal } from '@/components/ui/Modal';
import { Discover } from './Discover';
import { HowToPlay } from './HowToPlay';
import { ReviewWords } from './ReviewWords';
import { useAuthStore } from '@/store/useStore';
import { songApi, progressApi, handleApiError } from '@/lib/api';
import { Song } from '@/types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'library' | 'discover' | 'reviewwords' | 'howtoplay'>('library');
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Track which menu is open
  const menuRef = useRef<HTMLDivElement>(null);

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
      setSavedSongs(Object.values(uniqueByVideoId));

      const progressResponse = await progressApi.getProgress();
      setProgress(progressResponse);

      updateUser({
        totalXp: progressResponse.totalXp,
        currentStreak: progressResponse.currentStreak,
        longestStreak: progressResponse.longestStreak,
      });
    } catch (error) {
      console.error('Error loading data:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = (song: Song) => {
    navigate(`/learn/${song.youtubeVideoId}`, { state: { song } });
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Singuage</h1>
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
              My Library
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
              Discover
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
              Review Words
            </button>
            <button
              onClick={() => setActiveTab('howtoplay')}
              className={`border-b-2 py-4 font-medium transition-colors ${
                activeTab === 'howtoplay'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <HelpCircle className="mr-2 inline h-5 w-5" />
              How to Play
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Songs</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Songs */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">My Songs</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-12 w-12 animate-spin text-primary-600" />
              </div>
            ) : savedSongs.length === 0 ? (
              <div className="card text-center py-12">
                <Music2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold">No songs yet</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">Add your first song from the Discover tab!</p>
                <Button variant="primary" onClick={() => setActiveTab('discover')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Browse Songs
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedSongs.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-hover group relative"
                  >
                    {/* FIXED: Three-dot menu button */}
                    <div className="absolute right-2 top-2 z-10" ref={openMenuId === song.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(song.id);
                        }}
                        className="rounded-lg bg-white/90 p-2 opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                        title="Options"
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
                              <span className="font-medium text-gray-900 dark:text-gray-100">Change Lyrics</span>
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
                              <span className="font-medium text-red-600 dark:text-red-400">Remove</span>
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

                    <Button variant="primary" size="sm" fullWidth onClick={() => handleStartLearning(song)}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Learning
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'discover' ? (
        <Discover onSongAdded={loadData} />
      ) : activeTab === 'reviewwords' ? (
        <ReviewWords onBackToLibrary={() => setActiveTab('library')} />
      ) : (
        <HowToPlay />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!songToDelete}
        onClose={() => !isDeleting && setSongToDelete(null)}
        title="Remove Song?"
      >
        {songToDelete && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to remove <strong>"{songToDelete.title}"</strong> by {songToDelete.artist} from your library?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This song will be moved back to the Discover tab. Your progress data will be kept.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSongToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
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
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
