// src/store/useStore.ts
// Global state management using Zustand - FIXED: Proper user data persistence

import { create } from 'zustand';
import { User, Song, DifficultyMode, UserPreferences } from '@/types';
import { authApi } from '@/lib/api';
import { setNativeLanguage } from '@/i18n';

// ============================================================================
// Auth Store - FIXED
// ============================================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // refreshToken is optional because we rely on HttpOnly cookie in production
  // place optional parameter last to satisfy TS function signature rules
  login: (accessToken: string, user: User, refreshToken?: string | null) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setUserLocal: (user: User) => void; // Added setUserLocal
  updateUser: (updates: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Note: _refreshToken is intentionally unused because refresh tokens are stored in HttpOnly cookies.
  // order: accessToken, user, refreshToken (optional)
  login: (accessToken, user, _refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
    // If the user has a native language preference saved on their profile, apply it
    const lang = (user as any)?.nativeLanguage || (user as any)?.preferredLanguage || (user as any)?.native_language || (user as any)?.preferred_language;
    if (lang) setNativeLanguage(lang);
    // If the user hasn't previously set cookie preferences, ensure the CookieConsent popup
    // is shown on first login by setting the first-login flag.
    try {
      const seen = localStorage.getItem('cookie_consent_seen') === '1';
      if (!seen) localStorage.setItem('show_cookie_consent_on_first_login', '1');
    } catch (e) {
      // ignore storage errors
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    const lang = (user as any)?.nativeLanguage || (user as any)?.preferredLanguage || (user as any)?.native_language || (user as any)?.preferred_language;
    if (lang) setNativeLanguage(lang);
  },

  // Update local user state without making a backend API call
  setUserLocal: (user) => {
    set({ user, isAuthenticated: true });
    const lang = (user as any)?.nativeLanguage || (user as any)?.preferredLanguage || (user as any)?.native_language || (user as any)?.preferred_language;
    if (lang) setNativeLanguage(lang);
  },

  updateUser: async (updates) => {
    try {
      // Update backend
      const response = await authApi.updateProfile(updates);
      // authApi returns { message, user } from the backend; prefer the returned user object
      const returnedUser = response?.user || response;
      if (returnedUser) {
        set({ user: returnedUser });
      } else {
        // Fallback: merge updates into local state
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      }
      // If the update included a native language change, apply it
      const lang = (updates as any)?.nativeLanguage || (updates as any)?.preferredLanguage || (updates as any)?.native_language || (updates as any)?.preferred_language;
      if (lang) setNativeLanguage(lang);
    } catch (error) {
      console.error('Failed to update user:', error);
      // Still update local state optimistically as a fallback
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      }));
      const lang = (updates as any)?.nativeLanguage || (updates as any)?.preferredLanguage || (updates as any)?.native_language || (updates as any)?.preferred_language;
      if (lang) setNativeLanguage(lang);
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
      // Apply native language preference from the fetched user if present
      const lang = (userData as any)?.nativeLanguage || (userData as any)?.preferredLanguage || (userData as any)?.native_language || (userData as any)?.preferred_language;
      if (lang) setNativeLanguage(lang);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
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
