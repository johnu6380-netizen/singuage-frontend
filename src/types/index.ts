// frontend/src/types/index.ts
// UPDATED: Added vocabulary types

// ==================== USER TYPES ====================

export interface TargetLanguage {
  code: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  addedAt: string;
}

export interface User {
  id: string;
  email?: string | null; // made optional and nullable to match backend nullable email
  username?: string; // optional username field
  displayName: string;
  nativeLanguage: string;
  targetLanguages: TargetLanguage[] | string[];
  preferredArtists?: string[]; // List of favorite/preferred artist names
  hasPremium?: boolean;
  totalXp?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastPracticeDate?: string | Date | null;
  isAdult?: boolean;
  createdAt?: Date | string;
}

// ==================== SONG TYPES ====================

export interface LyricLine {
  id: string;
  lineNumber: number;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  isChorus?: boolean;
  difficulty?: {
    wpm: number;
    complexity: number;
    hasSpecialChars: boolean;
  };
}

export interface LyricsParsed {
  metadata: {
    lineCount: number;
    totalDurationMs: number;
    syncQuality: 'low' | 'medium' | 'high';
    offsetMs: number;
  };
  lines: LyricLine[];
}

export interface Song {
  id: string;
  userId?: string;
  youtubeVideoId: string;
  title: string;
  artist: string;
  language: string;
  difficultyRating: number;
  isExplicit?: boolean;
  contentRating?: string;
  lyricsParsed: LyricsParsed;
  addedAt?: Date | string;
}

export interface CreateSongDTO {
  youtubeVideoId: string;
  title: string;
  artist: string;
  language: string;
  difficultyRating?: number;
  isExplicit?: boolean;
  contentRating?: string;
  lyricsParsed: LyricsParsed;
}

// ==================== PROGRESS TYPES ====================

export interface LearningSession {
  id: string;
  userId: string;
  songId: string;
  difficulty: DifficultyMode;
  accuracy: number;
  completedLines: number;
  totalLines: number;
  timeSpentMs: number;
  xpEarned: number;
  completedAt: Date | string;
}

export interface UserProgress {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | string | null;
  totalSessions: number;
  recentSessions: LearningSession[];
  averageAccuracy: number;
}

export interface SongProgress {
  timesCompleted: number;
  bestAccuracy: number;
  avgAccuracy: number;
  totalXpEarned: number;
  lastCompleted: Date | string | null;
}

// ==================== DIFFICULTY ====================

export type DifficultyMode = 'easy' | 'medium' | 'hard';

// ==================== FILTERS ====================

export interface SongFilters {
  language?: string;
  minDifficulty?: number;
  maxDifficulty?: number;
  isAdult?: boolean;
  excludeExplicit?: boolean;
}

// ==================== GRAMMAR ====================

export interface GrammarConcept {
  id: string;
  name: string;
  category: string;
  description: string;
  examples: string[];
  lesson: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DetectedGrammar {
  concept: GrammarConcept;
  matches: string[];
  lineNumbers: number[];
}

// ==================== TRANSLATION ====================

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  success: boolean;
  error?: string;
}

export interface WordTranslation {
  word: string;
  translation: string;
  definition?: string;
  exampleSentence?: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// ==================== YOUTUBE ====================

export interface YouTubeVideo {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
  language: string;
  isExplicit?: boolean;
}

// ==================== ACHIEVEMENTS ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date | string;
  progress?: number;
  target?: number;
}

// ==================== USER PREFERENCES ====================

export interface UserPreferences {
  theme: 'light' | 'dark';
  autoPauseThresholdMs: number;
  rewindAmountMs: number;
  autoResume: boolean;
  typoTolerance: boolean;
  showTranslations: boolean;
}

// ==================== VOCABULARY ====================

export interface VocabularyWord {
  id: string;
  userId: string;
  word: string;
  translation: string | null;
  language: string;
  context: string | null;
  status: 'learning' | 'learned';
  createdAt: string | Date;
  learnedAt: string | Date | null;
}

export interface VocabularyStats {
  total: number;
  learning: number;
  learned: number;
  byLanguage: {
    language: string;
    count: number;
  }[];
}

export interface AddVocabularyWordRequest {
  word: string;
  language: string;
  context?: string;
  translation?: string;
}

export interface UpdateVocabularyWordRequest {
  translation?: string;
  status?: 'learning' | 'learned';
}

export interface TestWordRequest {
  userAnswer: string;
}

export interface TestWordResponse {
  correct: boolean;
  word: VocabularyWord;
}