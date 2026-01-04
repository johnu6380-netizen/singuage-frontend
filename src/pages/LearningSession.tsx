// frontend/src/pages/LearningSession.tsx
// COMPLETELY FIXED: Proper space handling + video hiding + button visibility

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Keyboard } from 'lucide-react';
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

const XP_REWARDS = { easy: 10, medium: 20, hard: 30 };

export const LearningSession = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const songFromState = location.state?.song;
  const [song, setSong] = useState<Song | null>(songFromState);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('easy');
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState<{ word: string | null; context: string } | null>(null);
  const [completedLines, setCompletedLines] = useState(0);
  const [lineAccuracies, setLineAccuracies] = useState<number[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [grammarAnalysis, setGrammarAnalysis] = useState<any[]>([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isGrammarOpen, setIsGrammarOpen] = useState(false);
  const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);

  // Load song from backend if not in state
  useEffect(() => {
    const loadSong = async () => {
      if (!songFromState && songId) {
        try {
          console.log('🔵 Loading song from backend:', songId);
          const response = await songApi.getByVideoId(songId);
          console.log('✅ Song loaded:', response.song);
          if (response.song) {
            setSong(response.song);
          }
        } catch (error) {
          console.error('❌ Error loading song:', error);
        }
      } else if (songFromState) {
        console.log('✅ Song loaded from state:', songFromState);
      }
    };
    loadSong();
  }, [songId, songFromState]);

  // Check for and resume saved progress
  useEffect(() => {
    if (song && song.youtubeVideoId) {
      const savedProgressKey = `session_progress_${song.youtubeVideoId}`;
      const savedProgressStr = localStorage.getItem(savedProgressKey);
      
      if (savedProgressStr) {
        try {
          const savedProgress = JSON.parse(savedProgressStr);
          
          const savedDate = new Date(savedProgress.savedAt);
          const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSince < 7) {
            setCurrentLine(savedProgress.currentLine || 0);
            setDifficulty(savedProgress.difficulty || 'easy');
            setCompletedLines(savedProgress.completedLines || 0);
            setLineAccuracies(savedProgress.lineAccuracies || []);
            
            console.log('✅ Resumed from saved progress:', savedProgress);
          } else {
            localStorage.removeItem(savedProgressKey);
          }
        } catch (e) {
          console.warn('Failed to parse saved progress:', e);
          localStorage.removeItem(savedProgressKey);
        }
      }
    }
  }, [song]);

  const analyzeSongGrammar = async (forceSong?: Song) => {
    const s = forceSong || song;
    if (!s) {
      console.log('⏳ No song yet, waiting...');
      return;
    }

    if (!s.lyricsParsed?.lines || !Array.isArray(s.lyricsParsed.lines) || s.lyricsParsed.lines.length === 0) {
      console.warn('❌ Invalid song structure for grammar analysis');
      setGrammarAnalysis([]);
      return;
    }

    const lyricsText = s.lyricsParsed.lines
      .map((line: LyricLine) => (typeof line === 'object' && line.text ? line.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!lyricsText.trim()) {
      setGrammarAnalysis([]);
      return;
    }

    let languageForAnalysis = (!s.language || s.language === 'unknown') ? undefined : s.language;
    if (!languageForAnalysis) {
      try {
        const detected = await detectLanguage(lyricsText);
        languageForAnalysis = detected;
        setSong(prev => prev ? { ...prev, language: detected } : prev);
      } catch (e) {
        languageForAnalysis = 'en';
      }
    }

    const analysis = analyzeGrammar(lyricsText, languageForAnalysis || 'en');
    setGrammarAnalysis(analysis);
  };

  useEffect(() => {
    analyzeSongGrammar();
  }, [song]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inputRef.current || selectedTranslation || showDifficultyModal || !song) return;
      
      const lines = song.lyricsParsed?.lines || [];
      const currentLyricLine = lines[currentLine] || lines[0];
      
      // Allow Down Arrow to work even in input field for line restart
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (player && currentLyricLine?.startTimeMs !== undefined) {
          player.seekTo(Math.max(0, currentLyricLine.startTimeMs / 1000), true);
          player.playVideo();
          setIsPlaying(true);
        }
        return;
      }
      
      // For other keys, don't interfere with typing in input
      if (e.target === inputRef.current && e.key.length === 1) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (player) {
            const currentTime = player.getCurrentTime();
            player.seekTo(Math.max(0, currentTime - 5), true);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (player) {
            const currentTime = player.getCurrentTime();
            player.seekTo(currentTime + 5, true);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (player) {
            if (isPlaying) {
              player.pauseVideo();
            } else {
              player.playVideo();
            }
          }
          break;
        case 'r':
        case 'R':
          if (e.target !== inputRef.current) {
            e.preventDefault();
            if (player) {
              player.seekTo(Math.max(0, currentLyricLine.startTimeMs / 1000 - 2), true);
            }
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

  // Auto-pause video when current line ends (only if line has valid timing data)
  useEffect(() => {
    if (!player || !isPlaying || !song) return;

    const lines = song.lyricsParsed?.lines || [];
    const currentLyricLine = lines[currentLine] || lines[0];
    
    if (!currentLyricLine) return;
    
    // Only enable auto-pause if line has valid timing data (endTimeMs > 0)
    // This prevents pausing on songs where users just pasted plain text lyrics
    if (!currentLyricLine.endTimeMs || currentLyricLine.endTimeMs <= 0) return;

    const checkTime = setInterval(() => {
      const currentTime = player.getCurrentTime();
      const lineStartTime = currentLyricLine.startTimeMs / 1000;
      const lineEndTime = currentLyricLine.endTimeMs / 1000;

      // Only pause if we're past the start AND reached the end
      // This prevents false positives when line timing is 0
      if (currentTime > lineStartTime && currentTime >= lineEndTime) {
        player.pauseVideo();
        setIsPlaying(false);
      }
    }, 100); // Check every 100ms

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
    
    localStorage.setItem(`session_progress_${song.youtubeVideoId}`, JSON.stringify(progressData));
    console.log('✅ Progress saved:', progressData);
    
    navigate('/dashboard');
  };

  if (!song) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Loading song...</div>
      </div>
    );
  }

  const lines = song.lyricsParsed?.lines || [];
  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="mb-4">No lyrics available for this song</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentLyricLine = lines[currentLine] || lines[0];

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target);
  };

  const onPlayerStateChange = (event: { data: number }) => {
    // YouTube player states: 1 = playing, 2 = paused
    setIsPlaying(event.data === 1);
  };

  // FIXED: Normalize text for comparison (keeps spaces!)
  const normalizeText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setCurrentInput(input);

    const targetNormalized = normalizeText(currentLyricLine.text);
    const typedNormalized = normalizeText(input);

    // If user has typed at least the same number of normalized characters as the target,
    // treat the line as complete and advance. Compute accuracy based on matching chars.
    const targetLen = targetNormalized.length;
    const typedLen = typedNormalized.length;

    console.log('🔍 Comparing lengths:', { typedLen, targetLen });

    if (targetLen === 0) return; // nothing to type

    if (typedLen >= targetLen) {
      // Compare only up to target length
      const compareStr = typedNormalized.slice(0, targetLen);
      let matchCount = 0;
      for (let i = 0; i < targetLen; i++) {
        if (compareStr[i] === targetNormalized[i]) matchCount++;
      }

      const accuracy = Math.round((matchCount / targetLen) * 100);
      const newLineAccuracies = [...lineAccuracies, accuracy];
      const newCompletedLines = completedLines + 1;
      
      setLineAccuracies(newLineAccuracies);
      setCompletedLines(newCompletedLines);

      if (currentLine < lines.length - 1) {
        setCurrentLine(currentLine + 1);
        setCurrentInput('');
      } else {
        // Last line completed - call with updated values
        completeSession(newCompletedLines, newLineAccuracies);
      }
      return;
    }
  };

  const completeSession = async (finalCompletedLines: number, finalLineAccuracies: number[]) => {
    const avgAccuracy = finalLineAccuracies.length > 0 
      ? Math.round(finalLineAccuracies.reduce((a, b) => a + b, 0) / finalLineAccuracies.length)
      : 0;
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const timeSpentMs = Date.now() - sessionStartTime;

    try {
      // Record session and get response from backend
      const sessionResponse = await progressApi.recordSession({
        songId: song.id,
        difficulty,
        accuracy: avgAccuracy,
        completedLines: finalCompletedLines,
        totalLines: lines.length,
        timeSpentMs: timeSpentMs,
      });

      // Use backend's XP calculation (authoritative)
      const xpEarned = sessionResponse.xpEarned || sessionResponse.xp || (finalCompletedLines * XP_REWARDS[difficulty]);

      // Reload user progress from backend to get updated XP and streak
      const progressResponse = await progressApi.getProgress();
      updateUser({
        totalXp: progressResponse.totalXp,
        currentStreak: progressResponse.currentStreak,
        longestStreak: progressResponse.longestStreak,
      });

      localStorage.removeItem(`session_progress_${song.youtubeVideoId}`);

      // Navigate to Congratulations page with stats
      navigate('/congratulations', {
        state: {
          stats: {
            accuracy: avgAccuracy,
            linesCompleted: finalCompletedLines,
            totalLines: lines.length,
            durationSeconds,
            songTitle: song.title,
            difficulty,
            xpEarned,
          },
        },
      });
    } catch (error) {
      console.error('Failed to record session:', error);
      // On error, still show congratulations with calculated values
      const fallbackXp = finalCompletedLines * XP_REWARDS[difficulty];
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

  const handleWordClick = (word: string) => {
    if (difficulty === 'easy') {
      // Easy mode: show current line with word
      setSelectedTranslation({ word, context: currentLyricLine.text });
    } else if (difficulty === 'medium') {
      // Medium mode: show current line as it appears (with vowels hidden)
      setSelectedTranslation({ word, context: currentLyricLine.text });
    } else {
      // Hard mode: show previous line
      if (currentLine === 0) {
        // First line - show empty context
        setSelectedTranslation({ word, context: '' });
      } else {
        const previousLine = lines[currentLine - 1];
        setSelectedTranslation({ word, context: previousLine.text });
      }
    }
  };

  const handleLineClick = (lineText: string) => {
    setSelectedTranslation({ word: null, context: lineText });
  };

  // FIXED: Proper character-by-character comparison that INCLUDES SPACES
  const renderLine = (line: LyricLine) => {
    const text = line.text;
    const typedNormalized = normalizeText(currentInput);
    
    // Split into words but preserve spaces for clicking
    const words = text.split(/(\s+)/);
    let charsSoFar = 0;
    
    return (
      <div className="flex flex-wrap items-center justify-center text-3xl font-bold leading-relaxed">
        {words.map((word, wordIdx) => {
          // Handle spaces
          if (/^\s+$/.test(word)) {
            const spaceStart = charsSoFar;
            charsSoFar += word.length;
            
            return (
              <span key={wordIdx} className="mx-1">
                {word.split('').map((char, charIdx) => {
                  // Normalize and compare
                  const normalizedTargetUpToHere = normalizeText(text.substring(0, spaceStart + charIdx + 1));
                  const isTyped = normalizedTargetUpToHere.length <= typedNormalized.length;
                  const isCorrect = isTyped && typedNormalized[normalizedTargetUpToHere.length - 1] === normalizeText(char)[0];
                  
                  return (
                    <span
                      key={charIdx}
                      className={isTyped ? (isCorrect ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          }

          // Handle words
          const wordStart = charsSoFar;
          charsSoFar += word.length;
          
          return (
            <span
              key={wordIdx}
              className="cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                if (word.trim()) handleWordClick(word.trim());
              }}
            >
              {word.split('').map((char, charIdx) => {
                // Get normalized position
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

                const charClass = isTyped 
                  ? (isCorrect ? 'text-green-400' : 'text-red-400') 
                  : 'text-gray-400';

                return (
                  <span key={charIdx} className={charClass}>
                    {displayChar}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-900 ${showKeyboardHelp ? 'overflow-hidden' : ''}`}>
      <div className="w-full max-w-6xl p-6 max-h-[calc(100vh-2rem)] overflow-auto">

        <AnimatePresence>
          {showKeyboardHelp && (
            <motion.div
              key="keyboard-help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
              onClick={() => setShowKeyboardHelp(false)}
            >
              <div 
                className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Keyboard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Play/Pause</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">↑</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Restart Line</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">↓</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Rewind 5 seconds</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">←</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Forward 5 seconds</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">→</kbd>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Show this help</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm shadow-sm">?</kbd>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => setShowKeyboardHelp(false)} 
                  className="w-full"
                >
                  Got it!
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Take a Break button - Fixed to top left, above everything */}
        <div className="fixed top-4 left-4 z-50">
          <Button 
            variant="ghost" 
            onClick={handleTakeBreak}
            className="flex items-center gap-2 rounded-lg bg-gray-800/90 backdrop-blur-sm px-4 py-2 text-white transition-all hover:bg-gray-700 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Take a Break</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
          {/* Left column: Video + Grammar - Video stays mounted but hidden when grammar is open */}
          <div className="w-full lg:w-1/2 space-y-4">
            {/* Video (stays mounted, hidden with CSS when grammar is open) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`relative w-full rounded-xl overflow-hidden bg-black shadow-lg transition-opacity duration-300 ${
                isGrammarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ paddingBottom: '56.25%' }}
            >
              <div className="absolute inset-0">
                <YouTube
                  videoId={song.youtubeVideoId}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: { 
                      autoplay: 0, 
                      controls: 1, 
                      modestbranding: 1, 
                      rel: 0, 
                      enablejsapi: 1, 
                      iv_load_policy: 3 
                    }
                  }}
                  className="absolute top-0 left-0 w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            </motion.div>

            {/* Grammar Dropdown */}
            <div className={isGrammarOpen ? 'relative -mt-4 z-10' : ''}>
              {grammarAnalysis.length > 0 ? (
                <GrammarDropdown 
                  grammarAnalysis={grammarAnalysis} 
                  language={song.language} 
                  onOpenChange={setIsGrammarOpen} 
                />
              ) : (
                <div className="rounded-lg bg-gray-800 p-4 text-sm text-gray-400">
                  No grammar concepts detected
                </div>
              )}
            </div>
          </div>

          {/* Right column: Lyrics + Input */}
          <div className="w-full lg:w-1/2 space-y-4">
            {/* Title and info */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">{song.title}</h1>
              <div className="space-y-1">
                <span className="block text-sm font-medium text-gray-400">Artist: {song.artist}</span>
                <span className="block text-sm font-medium text-gray-400">Language: {song.language}</span>
              </div>
            </div>

            {/* Current Line Display */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={`line-${currentLine}`} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                className="rounded-xl bg-gray-800/50 p-8 min-h-[120px] flex items-center justify-center" 
                onClick={() => handleLineClick(currentLyricLine.text)}
              >
                {renderLine(currentLyricLine)}
              </motion.div>
            </AnimatePresence>

            {/* Input Field */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleTyping}
                className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-xl text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:outline-none"
                placeholder="Type the lyrics here..."
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCurrentInput('');
                    if (player) player.seekTo(0, true);
                  }}
                  className="rounded-full p-2 text-gray-400 transition-all hover:bg-gray-800"
                  title="Restart"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Hint and Progress Display */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <span>Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 font-mono text-xs">?</kbd> for shortcuts</span>
              </div>
              <div className="rounded-lg bg-gray-800/60 p-4 text-right text-sm text-gray-200">
                <div className="font-semibold">
                  Lines: <span className="text-primary-400">{completedLines}/{lines.length}</span>
                </div>
                <div className="font-semibold">
                  Accuracy: <span className="text-accent-400">
                    {lineAccuracies.length > 0 ? Math.round(lineAccuracies.reduce((a,b)=>a+b,0)/lineAccuracies.length) : 0}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Mode: {difficulty}</div>
              </div>
            </div>

            {/* Change Difficulty button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  // If already on first line, just show modal directly
                  if (currentLine === 0 && completedLines === 0) {
                    setShowDifficultyModal(true);
                  } else {
                    // Otherwise show confirmation
                    setShowDifficultyConfirm(true);
                  }
                }} 
                className="rounded-lg border-2 border-primary-500 bg-gray-900/80 px-6 py-2.5 text-base font-bold text-primary-300 transition-all hover:bg-primary-500/30 hover:text-primary-200 hover:border-primary-400"
              >
                Change Difficulty
              </Button>
            </div>
          </div>
        </div>

        {/* Difficulty Selection Modal */}
        <AnimatePresence>
          {showDifficultyModal && (
            <motion.div key="difficulty-modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Modal isOpen={showDifficultyModal} onClose={() => {}} title="Select Difficulty" showCloseButton={false}>
                <div className="space-y-3">
                  {(['easy', 'medium', 'hard'] as DifficultyMode[]).map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => { 
                        setDifficulty(mode); 
                        setShowDifficultyModal(false); 
                        // Reset progress when difficulty changes
                        setCurrentLine(0);
                        setCurrentInput('');
                        setCompletedLines(0);
                        setLineAccuracies([]);
                        // Restart video
                        if (player) {
                          player.seekTo(0, true);
                          player.pauseVideo();
                        }
                      }} 
                      className="w-full rounded-lg border-2 border-gray-300 p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/20"
                    >
                      <div className="mb-1 font-semibold capitalize text-gray-900 dark:text-gray-100">{mode}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">+{XP_REWARDS[mode]} XP per line</div>
                    </button>
                  ))}
                </div>
              </Modal>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty Change Confirmation Modal */}
        <AnimatePresence>
          {showDifficultyConfirm && (
            <motion.div key="difficulty-confirm-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Modal 
                isOpen={showDifficultyConfirm} 
                onClose={() => setShowDifficultyConfirm(false)} 
                title="Change Difficulty?"
              >
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Changing difficulty will restart your progress from the first line. Your current progress will not be saved.
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Would you like to continue?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setShowDifficultyConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setShowDifficultyConfirm(false);
                        setShowDifficultyModal(true);
                      }}
                    >
                      Continue
                    </Button>
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
            onClose={() => setSelectedTranslation(null)} 
          />
        )}

      </div>
    </div>
  );
};
