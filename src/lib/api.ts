// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

// Default API URL points to backend at port 3000 (backend default). If VITE_API_URL is provided, use it.
const API_ORIGIN = 
	import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('401 error encountered. Attempting to refresh token...');
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  register: async (data: any) => (await api.post('/auth/register', data)).data,
  login: async (data: any) => (await api.post('/auth/login', data)).data,
  getCurrentUser: async () => (await api.get('/auth/me')).data,
  updateProfile: async (data: any) => (await api.put('/auth/profile', data)).data,
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  deleteAccount: async () => (await api.delete('/auth/delete')).data,
};

// ==================== SONGS API ====================
export const songApi = {
  create: async (data: any) => (await api.post('/songs', data)).data,
  getAll: async () => (await api.get('/songs')).data,
  getById: async (id: string) => (await api.get(`/songs/${id}`)).data,
  getByVideoId: async (videoId: string) => (await api.get(`/songs/video/${videoId}`)).data,
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

// ==================== ERROR HANDLER ====================
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) return error.response.data?.error || error.response.data?.message || 'An error occurred';
    if (error.request) return 'No response from server. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
};

export default api;