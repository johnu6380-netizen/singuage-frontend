import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800 mt-8">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.copyright_full', { year: new Date().getFullYear() })}</p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/about')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {t('footer.links.about')}
            </button>

            <button
              onClick={() => navigate('/terms')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {t('footer.links.terms')}
            </button>

            <button
              onClick={() => navigate('/privacy')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {t('footer.links.privacy')}
            </button>

            <button
              onClick={() => navigate('/cookie-policy')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {t('footer.links.cookie')}
            </button>

            {/* language switcher moved to Account Info page */}
          </div>
        </div>
      </div>
    </footer>
  );
};