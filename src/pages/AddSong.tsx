// frontend/src/pages/AddSong.tsx
// FIXED: YouTube video now properly formatted to container
// Added better aspect ratio handling and responsive sizing

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import YouTube from 'react-youtube';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useStore';
import { songApi } from '@/lib/api';
import { YouTubeVideo } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';

export const AddSong = () => {
  const { t } = useTranslation();
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoInfo = (location.state as any)?.video as YouTubeVideo | undefined;
  const { user } = useAuthStore();

  // Helper: decode HTML entities (e.g., &#39;) so titles/artists display correctly
  const decodeHtml = (input?: string) => {
    if (!input) return '';
    try {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      return txt.value;
    } catch {
      return input;
    }
  };

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
  const lyricsRef = useRef<HTMLTextAreaElement | null>(null);

  // Remove bracketed content like [Chorus] or [Verse 1] and drop empty lines
  const sanitizeLyrics = (text: string) => {
    if (!text) return '';
    // Remove bracketed content (non-greedy)
    const noBrackets = text.replace(/\[.*?\]/gs, '');
    // Split into lines, trim, filter out empty lines
    const lines = noBrackets.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    return lines.join('\n');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Intercept paste, sanitize pasted text, and insert at cursor position
    const clipboard = e.clipboardData || (window as any).clipboardData;
    const pasteText = clipboard.getData('text');
    if (!pasteText) return;

    e.preventDefault();

    const cleaned = sanitizeLyrics(pasteText);

    const el = lyricsRef.current;
    if (!el) {
      setLyrics(cleaned);
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);

    // If existing lyrics present, we should also sanitize the whole resulting text to remove bracket leftovers and empty lines
    const combined = before + cleaned + after;
    const result = sanitizeLyrics(combined);
    setLyrics(result);

    // Update cursor after paste (set timeout to wait for state update)
    setTimeout(() => {
      const pos = (before + cleaned).length;
      if (lyricsRef.current) {
        lyricsRef.current.selectionStart = lyricsRef.current.selectionEnd = pos;
        lyricsRef.current.focus();
      }
    }, 0);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSongId, setExistingSongId] = useState<string | null>(null);
  const [forceLanguage, setForceLanguage] = useState(false);

  useEffect(() => {
    if (videoInfo) {
      setTitle(decodeHtml(videoInfo.title));
      setArtist(decodeHtml(videoInfo.artist));
      if (videoInfo.language && videoInfo.language !== 'unknown') {
        setLanguage(videoInfo.language);
      }
    }

    const checkExisting = async () => {
      if (!videoId) return;
      try {
        // If user is authenticated, prefer the user-scoped endpoint so we only load this user's song (lyrics/etc).
        // Fall back to public lookup when not authenticated.
        const res = user ? await songApi.getUserByVideoId(videoId) : await songApi.getByVideoId(videoId);
        const existing = res?.song ?? null;
        if (existing) {
          setExistingSongId(existing.id);
          setTitle(decodeHtml(existing.title) || decodeHtml(videoInfo?.title) || '');
          setArtist(decodeHtml(existing.artist) || decodeHtml(videoInfo?.artist) || '');
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
      setError(t('pages.addsong.error_lyrics_required'));
      return;
    }

    if (!title.trim()) {
      setError(t('pages.addsong.error_title_required'));
      return;
    }

    if (!artist.trim()) {
      setError(t('pages.addsong.error_artist_required'));
      return;
    }

    setLoading(true);
    try {
      // Convert raw lyrics text into the expected lyricsParsed structure
      const lines = lyrics
        .split('\n')
        .map((l) => ({ text: l.trim() }))
        .filter((l) => l.text.length > 0);

      const lyricsParsed = { lines };

      const payload: any = {
        youtubeVideoId: videoId,
        title: title.trim(),
        artist: artist.trim(),
        // Only send an explicit language when the user forces it; otherwise let the backend auto-detect
        ...(forceLanguage ? { language } : {}),
        lyricsParsed,
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
      setError(err?.response?.data?.error || err?.message || t('pages.addsong.save_failed'));
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
                {existingSongId ? t('pages.addsong.title_edit') : t('pages.addsong.title_add')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {existingSongId ? t('pages.addsong.subtitle_edit') : t('pages.addsong.subtitle_add')}
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
              label={t('pages.addsong.song_title_label')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('pages.addsong.placeholder_song_title')}
              required
            />

            {/* Artist */}
            <Input
              label={t('pages.addsong.artist_label')}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder={t('pages.addsong.placeholder_artist')}
              required
            />

            {/* Language Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('pages.addsong.language_label')}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={forceLanguage}
                    onChange={(e) => setForceLanguage(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{t('pages.addsong.manual_set_label')}</span>
                </label>
              </div>
              
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!forceLanguage}
                className={`input w-full ${!forceLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="en">{t('languages.en')}</option>
                <option value="es">{t('languages.es')}</option>
                <option value="fr">{t('languages.fr')}</option>
                <option value="de">{t('languages.de')}</option>
                <option value="it">{t('languages.it')}</option>
                <option value="pt">{t('languages.pt')}</option>
                <option value="ja">{t('languages.ja')}</option>
                <option value="ko">{t('languages.ko')}</option>
                <option value="zh">{t('languages.zh')}</option>
                <option value="ar">{t('languages.ar') || 'Arabic'}</option>
                <option value="ru">{t('languages.ru') || 'Russian'}</option>
                <option value="hi">{t('languages.hi') || 'Hindi'}</option>
              </select>
              
              {!forceLanguage && (
                <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">{t('pages.addsong.detect_note')}</p>
              )}
            </div>

            {/* Lyrics - REQUIRED */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>{t('pages.addsong.lyrics_label')}</span>
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-black dark:border-white"
                    onClick={() => {
                      // Prefill Genius search with decoded Title + Artist so the Genius search input contains the readable query.
                      const decodedTitle = decodeHtml(title);
                      // Only use the song title for the Genius search query (do not include artist)
                      const query = encodeURIComponent((decodedTitle || '').trim());
                       const url = 'https://genius.com/search?q=' + query;
                       // Open in a new tab. We cannot programmatically focus a cross-origin input, but Genius will receive the query param and often focuses the search box on load.
                       const w = window.open(url, '_blank', 'noopener,noreferrer');
                       if (w) w.opener = null;
                     }}
                   >
                     {t('pages.addsong.search_genius')}
                   </Button>
                 </div>
              </div>
              <textarea
                ref={lyricsRef}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                onPaste={handlePaste}
                rows={12}
                className="input w-full font-mono text-sm"
                placeholder={t('pages.addsong.placeholder_lyrics')}
                required
              />
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">{t('pages.addsong.required_note')}</p>
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
                  existingSongId ? t('pages.addsong.updating') : t('pages.addsong.adding')
                ) : (
                  existingSongId ? t('pages.addsong.update_and_learn') : t('pages.addsong.add_and_start')
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                {t('buttons.cancel')}
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
            {t('pages.addsong.tips_title')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('pages.addsong.tips.paste_lines')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('pages.addsong.tips.auto_detect')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('pages.addsong.tips.manual_set')}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t('pages.addsong.tips.edit_anytime')}
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
