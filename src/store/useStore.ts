// src/store/useStore.ts
// Global state management using Zustand - FIXED: Proper user data persistence

import { create } from 'zustand';
import { User, Song, DifficultyMode, UserPreferences } from '@/types';
import { authApi } from '@/lib/api';

// ============================================================================
// Auth Store - FIXED
// ============================================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  updateUser: async (updates) => {
    try {
      // Update backend
      await authApi.updateProfile(updates);
      
      // Update local state
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      }));
    } catch (error) {
      console.error('Failed to update user:', error);
      // Still update local state optimistically
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      }));
    }
  },

  // FIXED: Properly extract user data from API response
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      
      // CRITICAL FIX: The API returns { user: {...} }, not just the user object
      const userData = response.user || response;
      
      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// ============================================================================
// Learning Session Store
// ============================================================================

interface SessionState {
  currentSong: Song | null;
  difficultyMode: DifficultyMode;
  currentLine: number;
  currentInput: string;
  linesCompleted: number;
  accuracy: number;
  isPlaying: boolean;
  startSession: (song: Song, difficulty: DifficultyMode) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSong: null,
  difficultyMode: 'easy',
  currentLine: 0,
  currentInput: '',
  linesCompleted: 0,
  accuracy: 0,
  isPlaying: false,

  startSession: (song, difficulty) => {
    set({
      currentSong: song,
      difficultyMode: difficulty,
      currentLine: 0,
      currentInput: '',
      linesCompleted: 0,
      accuracy: 0,
      isPlaying: false,
    });
  },
}));

// ============================================================================
// Preferences Store
// ============================================================================

interface PreferencesState extends UserPreferences {
  setTheme: (theme: 'light' | 'dark') => void;
  loadPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  autoPauseThresholdMs: 3000,
  rewindAmountMs: 5000,
  autoResume: true,
  typoTolerance: false,
  showTranslations: true,

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  loadPreferences: () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      set({ theme: savedTheme });
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  },
}));
