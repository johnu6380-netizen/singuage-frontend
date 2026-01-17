// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

// Build a robust API base URL that always points to the backend root (no trailing /api duplication).
// If VITE_API_URL is provided by the environment it may include or omit /api — normalize it so
// the axios baseURL always ends with a single /api segment.
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_ORIGIN = rawBase.replace(/\/$/, '').endsWith('/api')
  ? rawBase.replace(/\/$/, '')
  : `${rawBase.replace(/\/$/, '')}/api`;

// Create axios instance
const api = axios.create({
  baseURL: `${API_ORIGIN}`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never refresh for auth endpoints
    if (originalRequest.url?.includes('/auth')) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      // Rely on HttpOnly refresh cookie being sent automatically (withCredentials=true)
      await api.post('/auth/refresh');
      return api(originalRequest);
    } catch (err) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(err);
    }
  }
);

// ==================== AUTH API ====================
export const authApi = {
  register: async (data: any) => (await api.post('/auth/register', data)).data,
  login: async (data: any) => (await api.post('/auth/login', data)).data,
  getCurrentUser: async () => (await api.get('/auth/me')).data,
  updateProfile: async (data: any) => (await api.put('/auth/profile', data)).data,
  logout: async () => {
    // Rely on cookie for refresh token; backend will clear cookie
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  deleteAccount: async () => (await api.delete('/auth/delete')).data,
  // Forgot password request (sends reset link to email)
  forgotPassword: async (data: { email: string }) => {
    try {
      const csrfResp = await api.get('/csrf-token');
      const csrfToken = csrfResp.data?.csrfToken;
      return (await api.post('/auth/forgot-password', data, { headers: { 'X-CSRF-Token': csrfToken } })).data;
    } catch (err) {
      return (await api.post('/auth/forgot-password', data)).data;
    }
  },
  // Reset password endpoint (called from reset password page)
  resetPassword: async (data: { token: string; newPassword: string }) => {
    // Fetch CSRF token first (sets csrf cookie) and include it in header for the POST
    try {
      const csrfResp = await api.get('/csrf-token');
      const csrfToken = csrfResp.data?.csrfToken;
      return (await api.post('/auth/reset-password', data, { headers: { 'X-CSRF-Token': csrfToken } })).data;
    } catch (err) {
      // If fetching CSRF fails, still attempt the POST without token (server will reject if required)
      return (await api.post('/auth/reset-password', data)).data;
    }
  },
};

// ==================== SONGS API ====================
export const songApi = {
  create: async (data: any) => (await api.post('/songs', data)).data,
  getAll: async () => (await api.get('/songs')).data,
  getById: async (id: string) => (await api.get(`/songs/${id}`)).data,
  getByVideoId: async (videoId: string) => (await api.get(`/songs/video/${videoId}`)).data,
  // Get the authenticated user's song by YouTube video id (returns null if user hasn't added it)
  getUserByVideoId: async (videoId: string) => (await api.get(`/songs/video/${videoId}/me`)).data,
  update: async (id: string, data: any) => (await api.put(`/songs/${id}`, data)).data,
  delete: async (id: string) => (await api.delete(`/songs/${id}`)).data,
  checkExists: async (videoId: string) => {
    try {
      const response = await api.get(`/songs/video/${videoId}`);
      return response.data.song !== null;
    } catch {
      return false;
    }
  },
};

// ==================== PROGRESS API ====================
export const progressApi = {
  recordSession: async (data: {
    songId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    accuracy: number;
    completedLines: number;
    totalLines: number;
    timeSpentMs: number;
  }) => (await api.post('/progress/session', data)).data,

  getProgress: async () => (await api.get('/progress')).data,
  getSongProgress: async (songId: string) => (await api.get(`/progress/song/${songId}`)).data,
  getStreakCalendar: async () => (await api.get('/progress/streak-calendar')).data,
  // Get today's vocabulary review count for the authenticated user
  getVocabCount: async () => (await api.get('/progress/vocab-count')).data,

  // Get total XP earned grouped by song language for the authenticated user
  getXpByLanguage: async () => (await api.get('/progress/by-language')).data,

  // PREMIUM/FREEMIUM:
  // Call this whenever the user completes typing a lyric line.
  // If the daily free limit is reached for this song, the backend returns 402
  // with code "PREMIUM_LINE_LIMIT_REACHED" so the UI can show an upgrade modal.
  consumeLines: async (data: { songId: string; lines?: number }) =>
    (await api.post('/progress/consume-lines', data)).data,
};

// ==================== VOCABULARY API ====================
export const vocabularyApi = {
  addWord: async (data: {
    word: string;
    language: string;
    context?: string;
    translation?: string;
  }) => (await api.post('/vocabulary/add', data)).data,

  getWords: async (filters?: {
    status?: 'learning' | 'learned';
    language?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.language) params.append('language', filters.language);

    const query = params.toString();
    return (await api.get(`/vocabulary${query ? '?' + query : ''}`)).data;
  },

  getStats: async () => (await api.get('/vocabulary/stats')).data,

  updateWord: async (
    wordId: string,
    data: {
      translation?: string;
      status?: 'learning' | 'learned';
    }
  ) => (await api.put(`/vocabulary/${wordId}`, data)).data,

  testWord: async (wordId: string, userAnswer: string) =>
    (await api.post(`/vocabulary/${wordId}/test`, { userAnswer })).data,

  deleteWord: async (wordId: string) =>
    (await api.delete(`/vocabulary/${wordId}`)).data,
};

// ==================== ACHIEVEMENTS API ====================
export const achievementsApi = {
  getAchievements: async () => (await api.get('/achievements')).data,
};

// ==================== PAYMENTS API ====================
export const paymentsApi = {
  // Create a Stripe Checkout session for the logged-in user.
  // This calls a backend route which uses the secret STRIPE_SECRET_KEY —
  // the secret key must never be exposed to the browser or frontend code.
  createCheckoutSession: async () => {
    // Primary request uses the axios instance baseURL which is normalized to include a single /api.
    // This avoids accidental double-/api paths.
    return (await api.post('/create-checkout-session')).data;
  },
};

// ==================== SUBSCRIPTIONS API ====================
export const subscriptionsApi = {
  // Create a Stripe billing portal session (server creates a portal session and returns the URL)
  createBillingPortalSession: async () => (await api.post('/subscription/portal')).data,

  // Cancel the current user's subscription at period end (no refunds issued).
  // This calls the backend which updates the Stripe subscription to cancel_at_period_end.
  cancelSubscription: async () => (await api.post('/subscription/cancel')).data,
};

// ==================== DISCOVER API ====================
export const discoverApi = {
  // Fetch discover videos assembled by the backend. Optional query and limit.
  getDiscover: async (query?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (limit) params.append('limit', String(limit));
    const queryStr = params.toString();
    return (await api.get(`/discover${queryStr ? `?${queryStr}` : ''}`)).data;
  },
};

// ==================== ERROR HANDLER ====================
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) return error.response.data?.error || error.response.data?.message || 'An error occurred';
    if (error.request) return 'No response from server. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
};

export default api;
