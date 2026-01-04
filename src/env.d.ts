// frontend/src/env.d.ts
// Vite import.meta.env typings used across the frontend
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_YOUTUBE_API_KEY?: string;
  readonly DEV?: boolean;
  // add other VITE_ env vars if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
