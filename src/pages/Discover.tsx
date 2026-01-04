// frontend/src/pages/Discover.tsx
// FIXED: Removed quick add - users must always paste lyrics in AddSong page

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { YouTubeVideo } from '@/types';
import { searchMusicVideos, searchMusicByQuery, fetchVideoDetails } from '@/lib/youtubeApi';
import { useAuthStore } from '@/store/useStore';
import { songApi } from '@/lib/api';

interface Props {
  onSongAdded?: () => Promise<void>;
}

export const Discover = ({ onSongAdded }: Props) => {
  // reference onSongAdded so TS doesn't mark it as unused (it's optional)
  if (onSongAdded) void onSongAdded;
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
      let combined: YouTubeVideo[] = [];

      if (query && query.trim().length > 0) {
        const res = await searchMusicByQuery(query, 24);
        combined = res.videos;
      } else if (user?.preferredArtists && user.preferredArtists.length > 0) {
        // PERSONALIZED: User has preferred artists
        const preferredArtists = user.preferredArtists;
        
        // Fetch songs from preferred artists (60% of results)
        const songsPerArtist = Math.max(2, Math.floor(14 / preferredArtists.length));
        for (const artist of preferredArtists.slice(0, 7)) {
          try {
            const res = await searchMusicByQuery(`${artist} songs`, songsPerArtist);
            combined = combined.concat(res.videos.map(v => ({ ...v, source: 'preferred' })));
          } catch (err) {
            console.warn(`Failed to fetch songs for ${artist}:`, err);
          }
        }

        // Fetch similar artists / discovery (40% of results)
        const discoveryArtist = preferredArtists[0];
        try {
          const res = await searchMusicByQuery(`similar to ${discoveryArtist}`, 10);
          combined = combined.concat(res.videos.map(v => ({ ...v, source: 'discovery' })));
        } catch (err) {
          console.warn('Failed to fetch similar artists:', err);
        }

        // If we don't have enough results, fall back to language-based discovery
        if (combined.length < 12) {
          const perLang = Math.max(3, Math.floor((24 - combined.length) / Math.max(1, userTargetLanguages.length)));
          for (const lang of userTargetLanguages) {
            const res = await searchMusicVideos(lang, perLang);
            combined = combined.concat(res.videos.map(v => ({ ...v, language: lang, source: 'fallback' })));
          }
        }
      } else {
        // FALLBACK: No preferred artists - use original behavior
        const perLang = Math.max(6, Math.floor(24 / Math.max(1, userTargetLanguages.length)));
        for (const lang of userTargetLanguages) {
          const res = await searchMusicVideos(lang, perLang);
          combined = combined.concat(res.videos.map(v => ({ ...v, language: lang })));
        }
      }

      // Remove duplicates by videoId
      const unique = Object.values(
        combined.reduce((acc: Record<string, YouTubeVideo>, v) => {
          acc[v.videoId] = acc[v.videoId] || v;
          return acc;
        }, {})
      );

      // Fetch view counts and sort by popularity
      const ids = unique.map(v => v.videoId).slice(0, 50);
      const details = await fetchVideoDetails(ids);
      unique.forEach(v => {
        (v as any).viewCount = details[v.videoId]?.viewCount ?? 0;
      });

      unique.sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0));

      setVideos(unique);

      // Check which videos are already added by user
      const checkMap: Record<string, boolean> = {};
      await Promise.all(unique.map(async (v) => {
        try {
          const exists = await songApi.checkExists(v.videoId);
          checkMap[v.videoId] = exists;
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
  }, [userTargetLanguages, query, user?.preferredArtists]);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Discover Music</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists..."
              className="rounded-lg border-2 border-gray-200 px-3 py-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
              Search
            </button>
          </form>
          <button 
            onClick={handleRefresh} 
            className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading songs...</p>
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
                  alt={video.title}
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
                  {video.title}
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
                    {alreadyAddedMap[video.videoId] ? 'View Song' : '+ Add Song'}
                  </button>

                  {(video as any).viewCount && !alreadyAddedMap[video.videoId] && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {((video as any).viewCount as number).toLocaleString()} views
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
            No songs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try a different search or refresh to see more songs
          </p>
        </div>
      )}
    </div>
  );
};
