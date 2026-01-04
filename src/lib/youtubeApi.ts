// frontend/src/lib/youtubeApi.ts
import { YouTubeVideo } from '@/types';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
console.debug('YouTube API Key present:', Boolean(YOUTUBE_API_KEY));
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const EXPLICIT_KEYWORDS = ['explicit', 'uncensored', 'nsfw', 'dirty'];

const checkIfExplicit = (title: string, description: string) =>
  EXPLICIT_KEYWORDS.some(word => `${title} ${description}`.toLowerCase().includes(word));

// Small inline SVG data URI as placeholder (no external network required)
const fallbackPlaceholder = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial, Helvetica, sans-serif' font-size='16'>No Thumbnail</text></svg>`
)} `;
const fallbackVideos: YouTubeVideo[] = [
  { id: '1', title: 'Cruel Summer', artist: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/ic8j13piAhQ/mqdefault.jpg', videoId: 'ic8j13piAhQ', language: 'en', isExplicit: false },
  { id: '2', title: 'Anti-Hero', artist: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/b1kbLwvqugk/mqdefault.jpg', videoId: 'b1kbLwvqugk', language: 'en', isExplicit: false },
  { id: '3', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg', videoId: 'JGwWNGJdvx8', language: 'en', isExplicit: false },
  { id: '4', title: 'Despacito', artist: 'Luis Fonsi', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', videoId: 'kJQP7kiw5Fk', language: 'es', isExplicit: false },
  { id: '5', title: 'La Camisa Negra', artist: 'Juanes', thumbnail: 'https://img.youtube.com/vi/7K8GU6ZsR8Y/mqdefault.jpg', videoId: '7K8GU6ZsR8Y', language: 'es', isExplicit: false },
  { id: '6', title: 'Alors on danse', artist: 'Stromae', thumbnail: 'https://img.youtube.com/vi/6A3X7O0n9b0/mqdefault.jpg', videoId: '6A3X7O0n9b0', language: 'fr', isExplicit: false },
  { id: '7', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluQ/mqdefault.jpg', videoId: 'fHI8X4OXluQ', language: 'en', isExplicit: false },
  { id: '8', title: 'Sakura', artist: 'Ikimono-gakari', thumbnail: fallbackPlaceholder, videoId: 'dQw4w9WgXcQ', language: 'ja', isExplicit: false },
  { id: '9', title: 'Für Elise (Piano)', artist: 'Classical', thumbnail: fallbackPlaceholder, videoId: 'video-classical-1', language: 'de', isExplicit: false },
  { id: '10', title: 'Volare', artist: 'Domenico Modugno', thumbnail: fallbackPlaceholder, videoId: 'video-italian-1', language: 'it', isExplicit: false },
  { id: '11', title: 'Hips Don\'t Lie', artist: 'Shakira', thumbnail: fallbackPlaceholder, videoId: 'video-multi-1', language: 'es', isExplicit: false },
  { id: '12', title: 'Gangnam Style', artist: 'PSY', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg', videoId: '9bZkp7q19f0', language: 'ko', isExplicit: false },
];

const shuffle = <T,>(arr: T[]) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ==================== SEARCH BY LANGUAGE ====================
export const searchMusicVideos = async (
  language: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> => {
  if (!YOUTUBE_API_KEY) {
    // Try to return varied fallback results matching the language when possible
    const matches = fallbackVideos.filter(v => v.language === language || v.language === 'en');
    const pool = matches.length ? matches : fallbackVideos;
    return { videos: shuffle(pool).slice(0, maxResults), nextPageToken: undefined };
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', `${language} music`);
    url.searchParams.append('type', 'video');
    url.searchParams.append('videoCategoryId', '10');
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('safeSearch', 'strict');
    url.searchParams.append('key', YOUTUBE_API_KEY);
    if (pageToken) url.searchParams.append('pageToken', pageToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      console.error('YouTube API returned non-OK status', res.status, data);
      throw new Error((data && (data.error?.message || data.error)) || `YouTube API error ${res.status}`);
    }

    if (!data.items) return { videos: fallbackVideos, nextPageToken: undefined };

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: (item.id && (item.id.videoId || item.id)) || item.id || item.snippet?.resourceId?.videoId || '',
      videoId: item.id?.videoId || item.id || item.snippet?.resourceId?.videoId || '',
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      language,
      isExplicit: checkIfExplicit(item.snippet.title, item.snippet.description),
    }));

    return { videos, nextPageToken: data.nextPageToken };
  } catch (error) {
    console.error('YouTube API error:', error);
    return { videos: fallbackVideos, nextPageToken: undefined };
  }
};

// ==================== SEARCH BY QUERY ====================
export const searchMusicByQuery = async (
  query: string,
  maxResults: number = 25,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> => {
  if (!YOUTUBE_API_KEY) {
    // Filter fallbackVideos by matching title/artist or return shuffled selection
    const q = query.trim().toLowerCase();
    const matches = fallbackVideos.filter(v => (
      v.title.toLowerCase().includes(q) || v.artist.toLowerCase().includes(q) || v.language.toLowerCase() === q
    ));
    const pool = matches.length ? matches : fallbackVideos;
    return { videos: shuffle(pool).slice(0, maxResults), nextPageToken: undefined };
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', query);
    url.searchParams.append('type', 'video');
    url.searchParams.append('videoCategoryId', '10');
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('safeSearch', 'strict');
    url.searchParams.append('key', YOUTUBE_API_KEY);
    if (pageToken) url.searchParams.append('pageToken', pageToken);

    console.debug('YouTube search URL:', url.toString().slice(0, 200));

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      console.error('YouTube API returned non-OK status', res.status, data);
      throw new Error((data && (data.error?.message || data.error)) || `YouTube API error ${res.status}`);
    }

    console.debug('YouTube API response items:', (data && data.items && data.items.length) || 0);

    if (!data.items) return { videos: fallbackVideos, nextPageToken: undefined };

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: (item.id && (item.id.videoId || item.id)) || item.id || item.snippet?.resourceId?.videoId || '',
      videoId: item.id?.videoId || item.id || item.snippet?.resourceId?.videoId || '',
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      language: 'unknown',
      isExplicit: checkIfExplicit(item.snippet.title, item.snippet.description),
    }));

    return { videos, nextPageToken: data.nextPageToken };
  } catch (error) {
    console.error('YouTube API error:', error);
    return { videos: fallbackVideos, nextPageToken: undefined };
  }
};

// ==================== REFRESH FUNCTION ====================
export const refreshSongs = async (
  language: string,
  currentPageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> => {
  return searchMusicVideos(language, 20, currentPageToken);
};

// Fetch video details (statistics) for a list of video IDs
export const fetchVideoDetails = async (
  videoIds: string[]
): Promise<Record<string, { viewCount?: number }>> => {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) return {};

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.append('part', 'statistics');
    url.searchParams.append('id', videoIds.join(','));
    url.searchParams.append('key', YOUTUBE_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.items) return {};

    const map: Record<string, { viewCount?: number }> = {};
    data.items.forEach((item: any) => {
      map[item.id] = {
        viewCount: item.statistics ? Number(item.statistics.viewCount || 0) : undefined,
      };
    });

    return map;
  } catch (error) {
    console.error('YouTube videos API error:', error);
    return {};
  }
};