// filepath: c:\singuage_V1\singuage-frontend\src\components\CookieConsent.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

export const CookieConsent = () => {
  const { isAuthenticated } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const shouldShow = localStorage.getItem('show_cookie_consent_on_first_login') === '1';
    const seen = localStorage.getItem('cookie_consent_seen') === '1';

    if (isAuthenticated && shouldShow && !seen) {
      setVisible(true);
    }
  }, [isAuthenticated]);

  if (!visible) return null;

  const handleChoice = (choice: string) => {
    // Persist the user's cookie preferences using the new shape { nonEssential }
    const prefs = choice === 'accept' ? { nonEssential: true } : { nonEssential: false };
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
    } catch (e) {
      // ignore storage errors
    }

    // Mark that the user has made a choice and clear the first-login flag.
    localStorage.setItem('cookie_consent_seen', '1');
    localStorage.removeItem('show_cookie_consent_on_first_login');

    // Notify other parts of the app (e.g., Settings) that preferences changed.
    try {
      window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', { detail: prefs }));
    } catch (e) {
      // ignore
    }

    setVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cookie.title')}</h3>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{t('cookie.message')}</p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => handleChoice('reject')}
          className="rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t('cookie.decline')}
        </button>

        <button
          onClick={() => handleChoice('accept')}
          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 dark:bg-primary-500"
        >
          {t('cookie.accept')}
        </button>
      </div>
    </div>
  );
};