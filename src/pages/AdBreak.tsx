import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

export const AdBreak = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showClose, setShowClose] = useState(false);

  useEffect(() => {
    // If user is premium, they should not see this page
    if (user?.hasPremium) {
      navigate('/dashboard');
      return;
    }

    const t = setTimeout(() => setShowClose(true), 2000);
    return () => clearTimeout(t);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{t('buttons.take_a_break')}</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{t('adbreak.message')}</p>

        <div className="mb-6 flex items-center justify-center">
          <div className="w-full h-64 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            {/* Subtle Singuage Premium ad (low-key) */}
            <div className="w-11/12 max-w-lg rounded-lg bg-white dark:bg-gray-800/60 p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-left">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white">
                  <Music2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('modals.premium_upgrade.title') || 'Singuage Premium'}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('modals.premium_upgrade.description', { price: '$2.99' })}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {/* Center the single purple CTA (moved from left). Removed the duplicate right-side "keep playing" button. */}
                <div className="w-full flex justify-center">
                  <button
                    onClick={() => navigate('/upgrade')}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    aria-label="Upgrade to Premium"
                  >
                    {t('modals.premium_upgrade.keep_playing_cta') || t('buttons.continue_to_payment') || 'Upgrade'}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">{t('modals.premium_upgrade.helper_note') || 'Remove daily limits and support development.'}</p>
            </div>
          </div>
        </div>

        {/* Render the Close button immediately but keep it hidden & non-interactive until timer fires; fade in when showClose becomes true */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            aria-hidden={!showClose}
            className={`mx-auto inline-block rounded-lg border-2 border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors transition-opacity duration-500 ${showClose ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {t('buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
};