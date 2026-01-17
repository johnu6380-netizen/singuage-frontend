// frontend/src/pages/LearningSession.tsx
// Reimplemented LearningSession with full features + PremiumUpgradeModal integration

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Keyboard } from 'lucide-react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WordTranslationModal } from '@/components/WordTranslationModal';
import { GrammarDropdown } from '@/components/GrammarDropdown';
import { useAuthStore } from '@/store/useStore';
import { songApi, progressApi } from '@/lib/api';
import { analyzeGrammar } from '@/lib/grammar';
import { Song, DifficultyMode, LyricLine } from '@/types';
import { detectLanguage } from '@/lib/translator';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import { useTranslation } from 'react-i18next';

const XP_REWARDS = { easy: 10, medium: 20, hard: 30 };

export const LearningSession = () => {
  const { t } = useTranslation();
  const { songId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserLocal, isLoading } = useAuthStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const songFromState = (location.state as any)?.song as Song | undefined;
  const [song, setSong] = useState<Song | null>(songFromState || null);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('easy');
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState<{ word: string | null; context: string } | null>(null);
  const [completedLines, setCompletedLines] = useState(0);
  const [initialCompletedLines, setInitialCompletedLines] = useState(0); // number of lines completed before this session (from saved progress)
  const [linesReported, setLinesReported] = useState(0); // how many completed lines we've already reported to backend
  const [sessionXp, setSessionXp] = useState(0); // xp accumulated from incremental reports in this session
  const [lineAccuracies, setLineAccuracies] = useState<number[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [grammarAnalysis, setGrammarAnalysis] = useState<any[]>([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isGrammarOpen, setIsGrammarOpen] = useState(false);
  const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);

  // Premium modal state
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const consumeInFlightRef = useRef(false);
  const isTypingBlocked = premiumModalOpen;

  // Load song from backend if not in state
  useEffect(() => {
    const loadSong = async () => {
      if (!songFromState && songId) {
        try {
          // We expect songId to be DB id
          const response = await songApi.getById(songId);
          const s = response?.song || response;
          if (s) setSong(s as Song);
        } catch (error) {
          console.error('Failed to load song by id:', error);
        }
      }
    };
    loadSong();
  }, [songId, songFromState]);

  // Resume saved progress (same logic as provided)
  useEffect(() => {
    if (song && song.youtubeVideoId) {
      // Check progress saved under multiple possible keys (youtubeVideoId and DB id)
      const keysToCheck: string[] = [];
      if (song.youtubeVideoId) keysToCheck.push(`session_progress_${song.youtubeVideoId}`);
      if (song.id) keysToCheck.push(`session_progress_id_${song.id}`);

      let found: any = null;
      let foundKey: string | null = null;
      for (const k of keysToCheck) {
        const str = localStorage.getItem(k);
        if (!str) continue;
        try {
          const parsed = JSON.parse(str);
          if (!parsed) continue;
          // prefer the most recent savedAt
          if (!found || (parsed.savedAt && new Date(parsed.savedAt).getTime() > new Date(found.savedAt || 0).getTime())) {
            found = parsed;
            foundKey = k;
          }
        } catch (e) {
          localStorage.removeItem(k);
        }
      }

      if (found) {
        try {
          const savedDate = new Date(found.savedAt);
          const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 7) {
            const maxLine = (song.lyricsParsed?.lines || []).length - 1;
            const restoredLine = typeof found.currentLine === 'number' ? Math.max(0, Math.min(found.currentLine, Math.max(0, maxLine))) : 0;
            setCurrentLine(restoredLine);
            setDifficulty(found.difficulty || 'easy');
            const restoredCompleted = typeof found.completedLines === 'number' ? Math.max(0, Math.min(found.completedLines, (song.lyricsParsed?.lines || []).length)) : 0;
            setCompletedLines(restoredCompleted);
            setInitialCompletedLines(restoredCompleted);
            setLineAccuracies(Array.isArray(found.lineAccuracies) ? found.lineAccuracies : []);
            // If user already progressed past the first line, don't show the difficulty modal again
            if (restoredLine > 0 || restoredCompleted > 0) {
              setShowDifficultyModal(false);
            }
          } else if (foundKey) {
            localStorage.removeItem(foundKey);
          }
        } catch (e) {
          // if anything goes wrong, remove any invalid saved entries
          if (foundKey) localStorage.removeItem(foundKey);
        }
      }
    }
  }, [song]);

  const analyzeSongGrammar = async (forceSong?: Song) => {
    const s = forceSong || song;
    if (!s) return setGrammarAnalysis([]);
    if (!s.lyricsParsed?.lines || !Array.isArray(s.lyricsParsed.lines) || s.lyricsParsed.lines.length === 0) {
      setGrammarAnalysis([]);
      return;
    }

    const lyricsText = s.lyricsParsed.lines
      .map((line: LyricLine) => (typeof line === 'object' && line.text ? line.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!lyricsText.trim()) return setGrammarAnalysis([]);

    let languageForAnalysis = (!s.language || s.language === 'unknown') ? undefined : s.language;
    if (!languageForAnalysis) {
      try {
        const detected = await detectLanguage(lyricsText);
        languageForAnalysis = detected as any;
        setSong(prev => prev ? { ...prev, language: detected as any } : prev);
      } catch (e) {
        languageForAnalysis = 'en';
      }
    }

    const analysis = analyzeGrammar(lyricsText, languageForAnalysis || 'en');
    setGrammarAnalysis(analysis);
  };

  useEffect(() => { analyzeSongGrammar(); }, [song]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Previously this returned early when selectedTranslation was truthy which
      // prevented the ArrowDown key from closing the modal. We now allow the
      // handler to run so ArrowDown can toggle the modal. For other keys, if
      // a translation modal is open we ignore them.
      if (!inputRef.current || showDifficultyModal || !song) return;

      // If a translation modal is open, only allow ArrowDown to be handled
      // (so users can close it with ArrowDown). All other keys are ignored.
      if (selectedTranslation && e.key !== 'ArrowDown') return;

      const lines = song.lyricsParsed?.lines || [];
      const currentLyricLine = lines[currentLine] || lines[0];

      // Open translation modal with ArrowDown
      // (behaves like clicking the current line/previous line logic)

      if (e.target === inputRef.current && e.key.length === 1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Toggle the translation modal: close if open, otherwise open for the current line.
          if (selectedTranslation) {
            setSelectedTranslation(null);
            break;
          }

          if (difficulty === 'hard') {
            if (currentLine === 0) setSelectedTranslation({ word: null, context: '' });
            else setSelectedTranslation({ word: null, context: lines[currentLine - 1].text });
          } else {
            setSelectedTranslation({ word: null, context: currentLyricLine.text });
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (player) {
            safePlayerCall(() => {
              const currentTime = player.getCurrentTime();
              player.seekTo(Math.max(0, currentTime - 5), true);
            });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (player) {
            safePlayerCall(() => {
              const currentTime = player.getCurrentTime();
              player.seekTo(currentTime + 5, true);
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (player) {
            safePlayerCall(() => {
              if (isPlaying) player.pauseVideo(); else player.playVideo();
            });
          }
          break;
        case 'r':
        case 'R':
          if (e.target !== inputRef.current) {
            e.preventDefault();
            if (player) safePlayerCall(() => player.seekTo(Math.max(0, (currentLyricLine?.startTimeMs || 0) / 1000 - 2), true));
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, isPlaying, selectedTranslation, showDifficultyModal, showKeyboardHelp, song, currentLine]);

  // Auto-pause logic
  useEffect(() => {
    if (!player || !isPlaying || !song) return;
    const lines = song.lyricsParsed?.lines || [];
    const currentLyricLine = lines[currentLine] || lines[0];
    if (!currentLyricLine) return;
    if (!currentLyricLine.endTimeMs || currentLyricLine.endTimeMs <= 0) return;

    const checkTime = setInterval(() => {
      const currentTime = player.getCurrentTime();
      const lineStartTime = currentLyricLine.startTimeMs / 1000;
      const lineEndTime = currentLyricLine.endTimeMs / 1000;
      if (currentTime > lineStartTime && currentTime >= lineEndTime) {
        safePlayerCall(() => player.pauseVideo());
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(checkTime);
  }, [player, isPlaying, song, currentLine]);

  const handleTakeBreak = () => {
    if (!song) return;
    const progressData = {
      songId: song.id,
      youtubeVideoId: song.youtubeVideoId,
      currentLine,
      difficulty,
      completedLines,
      lineAccuracies,
      savedAt: new Date().toISOString(),
    };
    // Save under both the YouTube video id and the DB id (if available) so resume works regardless of route used to re-open song
    if (song.youtubeVideoId) localStorage.setItem(`session_progress_${song.youtubeVideoId}`, JSON.stringify(progressData));
    if (song.id) localStorage.setItem(`session_progress_id_${song.id}`, JSON.stringify(progressData));
    // Redirect premium users straight back to dashboard; non-premium users see the ad break page
    const authState: any = (useAuthStore as any).getState();
    const isPremium = !!(authState && authState.user && authState.user.hasPremium);
    if (isPremium) navigate('/dashboard');
    else navigate('/ad-break');
  };

  if (!song) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-900 dark:text-white">{t('pages.learning_session.loading_song')}</div>
      </div>
    );
  }

  const lines = song.lyricsParsed?.lines || [];
  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-900 dark:text-white">
          <p className="mb-4">{t('pages.learning_session.no_lyrics')}</p>
          <Button onClick={() => navigate(-1)}>{t('buttons.go_back')}</Button>
        </div>
      </div>
    );
  }

  const currentLyricLine = lines[currentLine] || lines[0];

  const onPlayerReady = (event: { target: YouTubePlayer }) => setPlayer(event.target);
  const onPlayerStateChange = (event: { data: number }) => setIsPlaying(event.data === 1);

  // Safely call YouTube player methods (protects against cross-origin iframe timing issues)
  const safePlayerCall = (cb: () => void) => {
    try {
      cb();
    } catch (e) {
      // Swallow and log to avoid React cross-origin errors leaking into the app
      console.warn('YouTube player call failed (ignored):', e);
    }
  };

  const normalizeText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      // Remove only combining diacritical marks (common accent marks) after NFD
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  const consumeLineAllowance = async (linesToConsume = 1) => {
    if (!song?.id) return { allowed: true };
    if (consumeInFlightRef.current) return { allowed: true };
    // If the auth store is still loading, wait briefly for it to finish so
    // we don't mistakenly treat a premium user as non-premium while fetching
    // their profile. Use the store's getState() to avoid stale closures.
    const authState: any = (useAuthStore as any).getState();
    if (authState.isLoading) {
      const POLL = 100;
      const MAX_WAIT = 2000;
      let waited = 0;
      await new Promise<void>((resolve) => {
        const iv = setInterval(() => {
          waited += POLL;
          const s: any = (useAuthStore as any).getState();
          if (!s.isLoading || waited >= MAX_WAIT) {
            clearInterval(iv);
            resolve();
          }
        }, POLL);
      });
    }

    // Re-read user state from the store (defensive; avoids stale closure over user prop)
    const latestAuth: any = (useAuthStore as any).getState();
    const userHasPremium = Boolean(latestAuth.user?.isPremium || latestAuth.user?.hasPremium);
    if (userHasPremium) return { allowed: true };
    consumeInFlightRef.current = true;
    try {
      const res = await progressApi.consumeLines({ songId: song.id, lines: linesToConsume });

      // If this call consumed the user's last free lines for this song (and it's not the first song),
      // allow the current line but show the premium modal so further typing is blocked.
      // Backend returns isFirstSong, remainingToday, usedToday, limit, date.
      if (!userHasPremium && !res?.isFirstSong && typeof res?.remainingToday === 'number' && res.remainingToday <= 0) {
        // open modal but still allow current consumption
        setPremiumModalOpen(true);
      }

      return { allowed: true };
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 402 && code === 'PREMIUM_LINE_LIMIT_REACHED') {
        // If auth is still loading, wait briefly for the auth check to finish
        // before deciding whether to show the modal. This prevents showing the
        // premium modal for users who actually have premium but whose user
        // state hasn't been populated yet.
        if (isLoading) {
          // Poll the auth store for up to 2000ms
          const MAX_WAIT = 2000;
          const POLL = 100;
          let waited = 0;
          // Access store state directly to avoid stale closures
          return await new Promise<{ allowed: boolean }>((resolve) => {
            const iv = setInterval(() => {
              waited += POLL;
              const authState: any = (useAuthStore as any).getState();
              const finished = !authState.isLoading;
              const nowHasPremium = Boolean(authState.user?.isPremium || authState.user?.hasPremium);
              if (finished || waited >= MAX_WAIT) {
                clearInterval(iv);
                if (nowHasPremium) {
                  resolve({ allowed: true });
                } else {
                  setPremiumModalOpen(true);
                  resolve({ allowed: false });
                }
              }
            }, POLL);
          });
        }

        // Auth isn't loading; show modal only for non-premium users
        if (!userHasPremium) setPremiumModalOpen(true);
        return { allowed: false };
      }
      console.error('consumeLines failed:', err);
      return { allowed: true };
    } finally {
      consumeInFlightRef.current = false;
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isTypingBlocked) return;
    const input = e.target.value;
    setCurrentInput(input);

    // Center the caret vertically in the fixed-height textarea.
    if (inputRef.current && mirrorRef.current) {
      requestAnimationFrame(() => {
        try {
          const ta = inputRef.current!;
          const mr = mirrorRef.current!;

          // Copy key computed styles from textarea to mirror for accurate measurement
          const cs = window.getComputedStyle(ta);
          mr.style.width = `${ta.clientWidth}px`;
          mr.style.fontSize = cs.fontSize;
          mr.style.fontFamily = cs.fontFamily;
          mr.style.fontWeight = cs.fontWeight;
          mr.style.lineHeight = cs.lineHeight;
          mr.style.padding = cs.padding;
          mr.style.border = cs.border;

          const selStart = ta.selectionStart ?? input.length;
          const before = input.substring(0, selStart);
          const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          mr.innerHTML = escapeHtml(before).replace(/ /g, '&nbsp;').replace(/\n/g, '<br/>') + '<span id="caret-marker">&#8203;</span>';

          const marker = mr.querySelector('#caret-marker') as HTMLElement | null;
          if (marker) {
            const markerTop = marker.offsetTop + marker.offsetHeight / 2;
            const target = Math.max(0, Math.min(markerTop - ta.clientHeight / 2, ta.scrollHeight - ta.clientHeight));
            ta.scrollTop = target;
          }
        } catch (err) {
          // ignore measurement errors; fallback will keep behavior safe
        }
      });
    }

    const targetNormalized = normalizeText((currentLyricLine as any).text || '');
    const typedNormalized = normalizeText(input);

    const targetLen = targetNormalized.length;
    const typedLen = typedNormalized.length;

    if (targetLen === 0) return;

    if (typedLen >= targetLen) {
      // Compare up to targetLen
      const compareStr = typedNormalized.slice(0, targetLen);
      let matchCount = 0;
      for (let i = 0; i < targetLen; i++) {
        if (compareStr[i] === targetNormalized[i]) matchCount++;
      }
      const accuracy = Math.round((matchCount / targetLen) * 100);

      // Ask backend for allowance
      const allowed = await consumeLineAllowance(1);
      if (!allowed.allowed) {
        // Backend blocked — do not advance nor count this line
        return;
      }

      const newLineAccuracies = [...lineAccuracies, accuracy];
      const newCompletedLines = completedLines + 1;

      setLineAccuracies(newLineAccuracies);
      setCompletedLines(newCompletedLines);

      // Report this single-line completion immediately so the user earns XP throughout the session.
      // Use the per-line accuracy as the chunk accuracy (reasonable approximation).
      reportChunk(1, accuracy).catch(() => {});

      if (currentLine < lines.length - 1) {
        setCurrentLine(currentLine + 1);
        setCurrentInput('');
      } else {
        // Last line completed
        await completeSession(newCompletedLines, newLineAccuracies);
      }
    }
  };

  const completeSession = async (finalCompletedLines: number, finalLineAccuracies: number[]) => {
    const avgAccuracy = finalLineAccuracies.length > 0
      ? Math.round(finalLineAccuracies.reduce((a, b) => a + b, 0) / finalLineAccuracies.length)
      : 0;
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const timeSpentMs = Date.now() - sessionStartTime;

    try {
      // If we've been reporting incrementally, only send any remaining unreported lines now
      const prevTotalXp = (user as any)?.totalXp ?? 0;
      const sessionCompletedLines = Math.max(0, finalCompletedLines - (initialCompletedLines || 0));
      const unreported = Math.max(0, sessionCompletedLines - linesReported);

      if (unreported > 0) {
        // Report any remaining lines as one final chunk so the backend awards the remaining XP
        const sessionResponse = await progressApi.recordSession({
          songId: song.id,
          difficulty,
          accuracy: avgAccuracy,
          completedLines: unreported,
          totalLines: lines.length,
          timeSpentMs,
        });

        const serverXp = typeof sessionResponse.xpEarned === 'number' ? sessionResponse.xpEarned : (typeof sessionResponse.xp === 'number' ? sessionResponse.xp : 0);
        setSessionXp(prev => prev + (serverXp || 0));

        // Update local total xp from authoritative response if provided and refresh full progress
        if (typeof sessionResponse.newTotalXp === 'number') {
          setUserLocal({ ...(user as any), totalXp: sessionResponse.newTotalXp, currentStreak: sessionResponse.newStreak ?? (user?.currentStreak ?? 0) });
          try {
            const full = await progressApi.getProgress();
            setUserLocal({ ...(user as any), totalXp: full.totalXp ?? sessionResponse.newTotalXp, currentStreak: full.currentStreak ?? sessionResponse.newStreak, longestStreak: full.longestStreak, lastPracticeDate: full.lastPracticeDate });
          } catch (e) { console.warn('Failed to refresh progress after session', e); }
        } else if (typeof serverXp === 'number') {
          setUserLocal({ ...(user as any), totalXp: prevTotalXp + serverXp, currentStreak: sessionResponse.newStreak ?? (user?.currentStreak ?? 0) });
          try {
            const full = await progressApi.getProgress();
            setUserLocal({ ...(user as any), totalXp: full.totalXp ?? (prevTotalXp + serverXp), currentStreak: full.currentStreak ?? sessionResponse.newStreak, longestStreak: full.longestStreak, lastPracticeDate: full.lastPracticeDate });
          } catch (e) { console.warn('Failed to refresh progress after session', e); }
        }
      }

      // Now compute final xp to show using authoritative server-supplied increments we've accumulated
      const xpToShow = sessionXp;

      try {
        // Clear saved progress and navigate showing the xp we computed from authoritative source
        localStorage.removeItem(`session_progress_${song.youtubeVideoId}`);

        navigate('/congratulations', {
          state: {
            stats: {
              accuracy: avgAccuracy,
              linesCompleted: finalCompletedLines,
              totalLines: lines.length,
              durationSeconds,
              songTitle: song.title,
              difficulty,
              xpEarned: xpToShow,
            },
          },
        });
      } catch (err) {
        throw err;
      }
    } catch (error) {
      console.error('Failed to record session:', error);

      // On error, compute a conservative fallback XP using base rewards (no accuracy bonus)
      const fallbackXp = Math.max(0, finalCompletedLines - (initialCompletedLines || 0)) * XP_REWARDS[difficulty];

      // Apply the same fallback locally so totals match the congratulations page
      const prevTotalXp = (user as any)?.totalXp ?? 0;
      setUserLocal({ ...(user as any), totalXp: prevTotalXp + fallbackXp });

      localStorage.removeItem(`session_progress_${song.youtubeVideoId}`);
      navigate('/congratulations', {
        state: {
          stats: {
            accuracy: avgAccuracy,
            linesCompleted: finalCompletedLines,
            totalLines: lines.length,
            durationSeconds,
            songTitle: song.title,
            difficulty,
            xpEarned: fallbackXp,
          },
        },
      });
    }
  };

  // Report small chunk(s) of completed lines to backend immediately to award incremental XP.
  const reportChunk = async (linesCount: number, accuracyForChunk: number) => {
    if (!song?.id) return;
    try {
      const sessionResponse = await progressApi.recordSession({
        songId: song.id,
        difficulty,
        accuracy: accuracyForChunk,
        completedLines: linesCount,
        totalLines: lines.length,
        timeSpentMs: Date.now() - sessionStartTime,
      });

      const serverXp = typeof sessionResponse.xpEarned === 'number' ? sessionResponse.xpEarned : (typeof sessionResponse.xp === 'number' ? sessionResponse.xp : 0);
      const serverNewTotal = typeof sessionResponse.newTotalXp === 'number' ? sessionResponse.newTotalXp : undefined;

      // Update accumulated session xp and mark lines as reported
      setSessionXp(prev => prev + (serverXp || 0));
      setLinesReported(prev => prev + linesCount);

      // Update local user totals using authoritative response when available
      if (typeof serverNewTotal === 'number') {
        setUserLocal({ ...(user as any), totalXp: serverNewTotal, currentStreak: sessionResponse.newStreak ?? (user?.currentStreak ?? 0) });
        try {
          const full = await progressApi.getProgress();
          setUserLocal({ ...(user as any), totalXp: full.totalXp ?? serverNewTotal, currentStreak: full.currentStreak ?? sessionResponse.newStreak, longestStreak: full.longestStreak, lastPracticeDate: full.lastPracticeDate });
        } catch (e) { console.warn('Failed to refresh progress after chunk', e); }
      } else if (typeof serverXp === 'number') {
        const prevTotal = (user as any)?.totalXp ?? 0;
        setUserLocal({ ...(user as any), totalXp: prevTotal + serverXp, currentStreak: sessionResponse.newStreak ?? (user?.currentStreak ?? 0) });
        try {
          const full = await progressApi.getProgress();
          setUserLocal({ ...(user as any), totalXp: full.totalXp ?? (prevTotal + serverXp), currentStreak: full.currentStreak ?? sessionResponse.newStreak, longestStreak: full.longestStreak, lastPracticeDate: full.lastPracticeDate });
        } catch (e) { console.warn('Failed to refresh progress after chunk', e); }
      }
    } catch (err) {
      console.error('Failed to report chunk XP:', err);
      // Do not block the user; we'll attempt to record remaining lines at session end.
    }
  };

  const handleWordClick = (word: string) => {
    if (difficulty === 'easy') setSelectedTranslation({ word, context: currentLyricLine.text });
    else if (difficulty === 'medium') setSelectedTranslation({ word, context: currentLyricLine.text });
    else {
      if (currentLine === 0) setSelectedTranslation({ word, context: '' });
      else setSelectedTranslation({ word, context: lines[currentLine - 1].text });
    }
  };

  const handleLineClick = (lineText: string) => {
    if (difficulty === 'hard') {
      // In hard mode, show translation of previous line (or nothing for first line)
      if (currentLine === 0) setSelectedTranslation({ word: null, context: '' });
      else setSelectedTranslation({ word: null, context: lines[currentLine - 1].text });
    } else {
      setSelectedTranslation({ word: null, context: lineText });
    }
  };

  const renderLine = (line: LyricLine) => {
    const text = line.text || '';
    const typedNormalized = normalizeText(currentInput);
    const words = text.split(/(\s+)/);
    let charsSoFar = 0;

    return (
      <div className="flex flex-wrap items-center justify-center text-3xl font-bold leading-relaxed">
        {words.map((word, wordIdx) => {
          if (/^\s+$/.test(word)) {
            const spaceStart = charsSoFar;
            charsSoFar += word.length;
            return (
              <span key={wordIdx} className="mx-1">
                {word.split('').map((char, charIdx) => {
                  const normalizedTargetUpToHere = normalizeText(text.substring(0, spaceStart + charIdx + 1));
                  const isTyped = normalizedTargetUpToHere.length <= typedNormalized.length;
                  const isCorrect = isTyped && typedNormalized[normalizedTargetUpToHere.length - 1] === normalizeText(char)[0];
                  return (
                    <span key={charIdx} className={isTyped ? (isCorrect ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}>{char}</span>
                  );
                })}
              </span>
            );
          }

          const wordStart = charsSoFar;
          charsSoFar += word.length;

          return (
            <span key={wordIdx} className="cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap" onClick={(e) => { e.stopPropagation(); if (word.trim()) handleWordClick(word.trim()); }}>
              {word.split('').map((char, charIdx) => {
                const originalUpToHere = text.substring(0, wordStart + charIdx + 1);
                const normalizedUpToHere = normalizeText(originalUpToHere);
                const normalizedPos = normalizedUpToHere.length - 1;
                const isTyped = normalizedPos < typedNormalized.length;
                const isCorrect = isTyped && typedNormalized[normalizedPos] === normalizeText(char)[0];

                let displayChar = char;
                if (difficulty === 'medium' && !isTyped) {
                  if (/[aeiouAEIOU]/.test(char)) displayChar = '_';
                } else if (difficulty === 'hard' && !isTyped) {
                  if (/[A-Za-zÀ-ÿ]/.test(char)) displayChar = '•';
                }

                const charClass = isTyped ? (isCorrect ? 'text-green-400' : 'text-red-400') : 'text-gray-400';

                return (
                  <span key={charIdx} className={charClass}>{displayChar}</span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${showKeyboardHelp ? 'overflow-hidden' : ''}`}>
      <div className="w-full max-w-6xl p-6 max-h-[calc(100vh-2rem)] overflow-auto">

        <AnimatePresence>
          {showKeyboardHelp && (
            <motion.div key="keyboard-help" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={() => setShowKeyboardHelp(false)}>
              <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                  <Keyboard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('modals.shortcuts.title')}</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('modals.shortcuts.play_pause')}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">↑</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('modals.shortcuts.rewind')}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">←</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('modals.shortcuts.forward')}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">→</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('modals.shortcuts.open_translation')}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">↓</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('modals.shortcuts.show_help')}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">?</kbd>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setShowKeyboardHelp(false)} className="w-full">{t('buttons.got_it')}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed top-4 left-4 z-50">
          <Button variant="ghost" onClick={handleTakeBreak} className="flex items-center gap-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 text-gray-900 dark:text-white transition-all hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('buttons.take_a_break')}</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
          <div className="w-full lg:w-1/2 space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`relative w-full rounded-xl overflow-hidden bg-white dark:bg-black shadow-lg transition-opacity duration-300 ${isGrammarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0">
                <YouTube
                  videoId={song.youtubeVideoId}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, enablejsapi: 1, iv_load_policy: 3 } }}
                  className="absolute top-0 left-0 w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            </motion.div>

            <div className={isGrammarOpen ? 'relative -mt-4 z-10' : ''}>
              {grammarAnalysis.length > 0 ? (
                <GrammarDropdown grammarAnalysis={grammarAnalysis} language={song.language} onOpenChange={setIsGrammarOpen} />
              ) : (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4 text-sm text-gray-700 dark:text-gray-400">{t('grammar.header.none')}</div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{song.title}</h1>
              <div className="space-y-1">
                <span className="block text-sm font-medium text-gray-400">{t('pages.learning_session.artist_label')} {song.artist}</span>
                <span className="block text-sm font-medium text-gray-400">{t('pages.learning_session.language_label')} {song.language}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`line-${currentLine}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-8 min-h-[120px] flex items-center justify-center" onClick={() => handleLineClick(currentLyricLine.text)}>
                {renderLine(currentLyricLine)}
              </motion.div>
            </AnimatePresence>

            <div className="relative">
              {/* Hide the native scrollbar for this textarea; keep scrolling behavior programmatic only */}
              <style>{`textarea[data-hide-scroll]::-webkit-scrollbar{display:none} textarea[data-hide-scroll]{-ms-overflow-style:none; scrollbar-width:none;}`}</style>
              <textarea
                data-hide-scroll
                ref={inputRef}
                rows={1}
                value={currentInput}
                onChange={handleTyping}
                onWheel={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
                onTouchMove={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
                onScroll={() => {
                  // Prevent manual scrolling by resetting to caret-centered position
                  if (inputRef.current && mirrorRef.current) {
                    const evTa = inputRef.current;
                    // simple reset: keep scrollTop as computed by caret measurement
                    // trigger the same measurement used after typing
                    const selStart = evTa.selectionStart ?? evTa.value.length;
                    const before = evTa.value.substring(0, selStart);
                    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const mr = mirrorRef.current;
                    const cs = window.getComputedStyle(evTa);
                    mr.style.width = `${evTa.clientWidth}px`;
                    mr.style.fontSize = cs.fontSize;
                    mr.style.fontFamily = cs.fontFamily;
                    mr.style.fontWeight = cs.fontWeight;
                    mr.style.lineHeight = cs.lineHeight;
                    mr.style.padding = cs.padding;
                    mr.style.border = cs.border;
                    mr.innerHTML = escapeHtml(before).replace(/ /g, '&nbsp;').replace(/\n/g, '<br/>') + '<span id="caret-marker">&#8203;</span>';
                    const marker = mr.querySelector('#caret-marker') as HTMLElement | null;
                    if (marker) {
                      const markerTop = marker.offsetTop + marker.offsetHeight / 2;
                      const target = Math.max(0, Math.min(markerTop - evTa.clientHeight / 2, evTa.scrollHeight - evTa.clientHeight));
                      evTa.scrollTop = target;
                    }
                  }
                }}
                className="w-full h-12 resize-none rounded-lg border-2 border-gray-200 bg-white dark:bg-gray-900 px-4 py-3 text-xl text-gray-900 dark:text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:outline-none overflow-auto"
                placeholder={t('pages.learning_session.placeholder_type_lyrics')}
                 autoComplete="off"
              />
              {/* Hidden mirror element used to compute caret vertical position */}
              <div ref={mirrorRef} aria-hidden style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400 flex items-center gap-2"><Keyboard className="h-4 w-4" />
                {(() => {
                  const parts = (t('pages.learning_session.press_shortcuts') || 'Press ? for shortcuts').split('?');
                  return (<span>{parts[0]} <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 font-mono text-xs">?</kbd> {parts[1]}</span>);
                })()}
              </div>
               <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-4 text-right text-sm text-gray-900 dark:text-gray-200">
                 <div className="font-semibold">{t('pages.learning_session.stats_box.lines')}: <span className="text-primary-400">{completedLines}/{lines.length}</span></div>
                 <div className="font-semibold">{t('pages.learning_session.stats_box.accuracy')}: <span className="text-accent-400">{lineAccuracies.length > 0 ? Math.round(lineAccuracies.reduce((a,b)=>a+b,0)/lineAccuracies.length) : 0}%</span></div>
                 <div className="text-xs text-gray-400 mt-1">{t('pages.learning_session.stats_box.mode')}: {t(`pages.learning_session.modes.${difficulty}`)}</div>
               </div>
             </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => { if (currentLine === 0 && completedLines === 0) setShowDifficultyModal(true); else setShowDifficultyConfirm(true); }} className="rounded-lg border-2 border-primary-500 bg-white/80 dark:bg-gray-900/80 px-6 py-2.5 text-base font-bold text-primary-600 dark:text-primary-300 transition-all hover:bg-primary-50 dark:hover:bg-primary-500/30 hover:text-primary-700 dark:hover:text-primary-200 hover:border-primary-400">{t('buttons.change_difficulty')}</Button>
            </div>
          </div>
        </div>

        {/* Difficulty Modal & Confirm... (omitted unchanged modal internals for brevity) */}

        {/* Difficulty Selection Modal */}
        <AnimatePresence>
          {showDifficultyModal && (
            <motion.div key="difficulty-modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Modal isOpen={showDifficultyModal} onClose={() => {}} title={t('modals.select_difficulty.title')} showCloseButton={false}>
                <div className="space-y-3">
                  {(['easy', 'medium', 'hard'] as DifficultyMode[]).map(mode => (
                    <button key={mode} onClick={() => { setDifficulty(mode); setShowDifficultyModal(false); setCurrentLine(0); setCurrentInput(''); setCompletedLines(0); setLineAccuracies([]); if (player) { player.seekTo(0, true); player.pauseVideo(); } }} className="w-full rounded-lg border-2 border-gray-300 p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/20">
                      <div className="mb-1 font-semibold capitalize text-gray-900 dark:text-gray-100">{t(`pages.learning_session.modes.${mode}`)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">+{XP_REWARDS[mode]} XP per line</div>
                    </button>
                  ))}
                </div>
              </Modal>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty change confirm */}
        <AnimatePresence>
          {showDifficultyConfirm && (
            <motion.div key="difficulty-confirm-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Modal isOpen={showDifficultyConfirm} onClose={() => setShowDifficultyConfirm(false)} title={t('modals.change_difficulty_confirm.title')}>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">{t('modals.change_difficulty_confirm.message')}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('modals.change_difficulty_confirm.title')}</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setShowDifficultyConfirm(false)}>{t('modals.change_difficulty_confirm.cta_cancel')}</Button>
                    <Button variant="primary" fullWidth onClick={() => { setShowDifficultyConfirm(false); setShowDifficultyModal(true); }}>{t('modals.change_difficulty_confirm.cta_continue')}</Button>
                  </div>
                </div>
              </Modal>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word/Line Translation Modal */}
        {selectedTranslation && (
          <WordTranslationModal
            word={selectedTranslation.word}
            sourceLanguage={song.language}
            targetLanguage={user?.nativeLanguage || 'en'}
            context={selectedTranslation.context}
            difficulty={difficulty}
            onClose={() => setSelectedTranslation(null)}
          />
        )}

        {/* Premium modal */}
        <PremiumUpgradeModal isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} returnTo="/dashboard" />

      </div>
    </div>
  );
};

export default LearningSession;
