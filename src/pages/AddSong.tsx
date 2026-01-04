// frontend/src/pages/AddSong.tsx
// FIXED: YouTube video now properly formatted to container
// Added better aspect ratio handling and responsive sizing

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import YouTube from 'react-youtube';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useStore';
import { songApi } from '@/lib/api';
import { YouTubeVideo } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const AddSong = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoInfo = (location.state as any)?.video as YouTubeVideo | undefined;
  const { user } = useAuthStore();

  const [title, setTitle] = useState(videoInfo?.title || '');
  const [artist, setArtist] = useState(videoInfo?.artist || '');
  const initialLang: string = (() => {
    if (videoInfo?.language && videoInfo.language !== 'unknown') return String(videoInfo.language);
    const first = Array.isArray(user?.targetLanguages) ? user!.targetLanguages[0] : undefined;
    if (!first) return 'en';
    return typeof first === 'string' ? first : String((first as any).code || 'en');
  })();
  const [language, setLanguage] = useState<string>(initialLang);
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSongId, setExistingSongId] = useState<string | null>(null);
  const [forceLanguage, setForceLanguage] = useState(false);

  useEffect(() => {
    if (videoInfo) {
      setTitle(videoInfo.title);
      setArtist(videoInfo.artist);
      if (videoInfo.language && videoInfo.language !== 'unknown') {
        setLanguage(videoInfo.language);
      }
    }

    const checkExisting = async () => {
      if (!videoId) return;
      try {
        const res = await songApi.getByVideoId(videoId);
        const existing = res?.song ?? null;
        if (existing) {
          setExistingSongId(existing.id);
          setTitle(existing.title || videoInfo?.title || '');
          setArtist(existing.artist || videoInfo?.artist || '');
          setLanguage(existing.language || initialLang);
          
          if (existing.lyricsParsed && existing.lyricsParsed.lines) {
            const lyricsText = existing.lyricsParsed.lines
              .map((line: any) => line.text)
              .join('\n');
            setLyrics(lyricsText);
          }
        }
      } catch (err) {
        console.warn('Error checking existing song:', err);
      }
    };

    checkExisting();
  }, [videoInfo, videoId, initialLang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lyrics.trim()) {
      setError('Lyrics are required! Please paste the song lyrics to continue.');
      return;
    }

    if (!title.trim()) {
      setError('Song title is required');
      return;
    }

    if (!artist.trim()) {
      setError('Artist name is required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        youtubeVideoId: videoId,
        title: title.trim(),
        artist: artist.trim(),
        language: forceLanguage ? language : 'auto',
        lyrics: lyrics.trim(),
        forceLanguage,
      };

      if (existingSongId) {
        const res = await songApi.update(existingSongId, payload);
        const updated = res.song || res;
        navigate(`/learn/${updated.youtubeVideoId}`, { state: { song: updated } });
      } else {
        const res = await songApi.create(payload);
        const created = res.song || res;
        navigate(`/learn/${created.youtubeVideoId}`, { state: { song: created } });
      }
    } catch (err: any) {
      console.error('Add/Update song failed', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to save song');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {existingSongId ? 'Edit Song' : 'Add Song'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {existingSongId ? 'Update song details and lyrics' : 'Add lyrics to start learning'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Video Preview - FIXED: Proper aspect ratio and sizing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-xl" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0">
              <YouTube
                videoId={videoId || ''}
                opts={{ 
                  width: '100%',
                  height: '100%',
                  playerVars: { 
                    autoplay: 0, 
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                  } 
                }}
                className="h-full w-full"
                iframeClassName="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <Input
              label="Song Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              required
            />

            {/* Artist */}
            <Input
              label="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              required
            />

            {/* Language Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={forceLanguage}
                    onChange={(e) => setForceLanguage(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Manually set language</span>
                </label>
              </div>
              
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!forceLanguage}
                className={`input w-full ${!forceLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="ar">Arabic</option>
                <option value="ru">Russian</option>
                <option value="hi">Hindi</option>
              </select>
              
              {!forceLanguage && (
                <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                  ✨ Language will be automatically detected from lyrics
                </p>
              )}
            </div>

            {/* Lyrics - REQUIRED */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lyrics <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={12}
                className="input w-full font-mono text-sm"
                placeholder="Paste the song lyrics here, one line per lyric line...&#10;&#10;Example:&#10;Hello, it's me&#10;I was wondering if after all these years&#10;You'd like to meet..."
                required
              />
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Required:</strong> Lyrics are needed to accurately detect the song's language 
                  and provide the best learning experience. Paste one lyric line per line of text.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
              >
                {loading ? (
                  existingSongId ? 'Updating...' : 'Adding...'
                ) : (
                  existingSongId ? '💾 Update & Learn' : '✨ Add & Start Learning'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Help Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mt-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/10 dark:to-accent-900/10"
        >
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
            💡 Tips for Adding Songs
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary-600">•</span>
              <span>Paste lyrics with one line per lyric phrase for best synchronization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600">•</span>
              <span>Language will be automatically detected from your lyrics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600">•</span>
              <span>Check "Manually set language" if auto-detection is incorrect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600">•</span>
              <span>You can edit the song details anytime after adding it</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
