// src/main.tsx
// Application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { setNativeLanguage } from './i18n';

// If a native language preference is cached in localStorage, apply it immediately
try {
  const cached = localStorage.getItem('native_language');
  if (cached) setNativeLanguage(cached);
} catch (e) {
  // ignore storage errors
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);