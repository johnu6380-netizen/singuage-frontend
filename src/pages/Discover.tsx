// frontend/src/pages/Discover.tsx
// FIXED: Removed quick add - users must always paste lyrics in AddSong page

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { YouTubeVideo } from '@/types';
import { discoverApi } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { songApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface Props {
  onSongAdded?: () => Promise<void>;
}

export const Discover = ({ onSongAdded }: Props) => {
  const { t } = useTranslation();
  // reference onSongAdded so TS doesn't mark it as unused (it's optional)
  // keep a harmless reference to the prop to avoid unused variable warnings
  void (onSongAdded as any);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [alreadyAddedMap, setAlreadyAddedMap] = useState<Record<string, boolean>>({});

  const userTargetLanguages = useMemo(() => {
    if (!user) return ['en'];
    const t = user.targetLanguages || [];
    return (Array.isArray(t) ? t : []).map((tl: any) => (typeof tl === 'string' ? tl : tl.code || 'en')) || ['en'];
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Use backend Discover endpoint which assembles and deduplicates videos server-side.
      const resp = await discoverApi.getDiscover(query || undefined, 24);
      const serverVideos: any[] = resp?.videos || [];

      // Map backend shape to frontend expected YouTubeVideo shape. Use channelTitle as artist so AddSong prefill works.
      const mapped: YouTubeVideo[] = serverVideos.map((v: any) => ({
        // Provide id and language fields expected by the front-end types.
        id: v.id || v.videoId || String(v.videoId || ''),
        videoId: v.videoId,
        title: v.title,
        artist: v.channelTitle || '',
        channelTitle: v.channelTitle || '',
        thumbnail: v.thumbnail || '',
        publishedAt: v.publishedAt || null,
        language: v.language || 'en',
      }));

      setVideos(mapped.slice(0, 24));
     
       // Check which videos are already added by user
       const checkMap: Record<string, boolean> = {};
       await Promise.all(mapped.map(async (v) => {
         try {
           if (user) {
             // Authenticated: use user-scoped endpoint so we only mark songs the current user added
             const res = await songApi.getUserByVideoId(v.videoId);
             checkMap[v.videoId] = !!(res?.song);
           } else {
             // Not authenticated: fall back to public existence check
             const exists = await songApi.checkExists(v.videoId);
             checkMap[v.videoId] = exists;
           }
         } catch {
           checkMap[v.videoId] = false;
         }
       }));
       setAlreadyAddedMap(checkMap);

    } catch (error) {
       console.error('Discover load error:', error);
     } finally {
       setLoading(false);
     }
   }, [userTargetLanguages, query, user?.preferredArtists, user]);

  // Helper: decode basic HTML entities returned by the YouTube API (e.g., &#39; -> ')
  const decodeHtml = (input: string | undefined) => {
    if (!input) return '';
    try {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      return txt.value;
    } catch {
      return input;
    }
  };

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // effect will run because query state is same; to force reload just keep same
  };

  const handleOpenAddSong = (video: YouTubeVideo) => {
    navigate(`/add-song/${video.videoId}`, { state: { video } });
  };

  const handleRefresh = async () => {
    // force reload from APIs
    await load();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('pages.discover.title')}</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('pages.discover.search_placeholder')}
              className="rounded-lg border-2 border-gray-200 px-3 py-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
              {t('common.search')}
            </button>
          </form>
          <button 
            onClick={handleRefresh} 
            className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('pages.discover.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map(video => (
            <div 
              key={video.videoId} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={decodeHtml(video.title)}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleOpenAddSong(video)}
                />
                <div className="absolute left-2 top-2">
                  <span className="badge-primary">{(video.language || 'en').toUpperCase()}</span>
                </div>
                {alreadyAddedMap[video.videoId] && (
                  <div className="absolute right-2 top-2">
                    <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                      ✓ Added
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                  {decodeHtml(video.title)}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-1">
                  {video.artist}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleOpenAddSong(video)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      alreadyAddedMap[video.videoId]
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {alreadyAddedMap[video.videoId] ? t('actions.view_song') : t('actions.add_song')}
                  </button>

                  {(video as any).viewCount && !alreadyAddedMap[video.videoId] && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {((video as any).viewCount as number).toLocaleString()} {t('common.views')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-20">
          <div className="mb-4 text-6xl">🎵</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('pages.discover.no_songs_found')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('pages.discover.try_different_search')}
          </p>
        </div>
      )}
    </div>
  );
};