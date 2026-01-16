import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/AnimatedText';
import { PageReveal, Reveal } from '@/components/PageReveal';
import { useTranslation } from 'react-i18next';

export const CookiePolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg border border-black dark:border-white bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('buttons.return_to_library')}
          </button>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-2">
          <AnimatedText text={t('pages.cookie.title')} className="text-3xl font-bold text-gray-900 dark:text-gray-100" />
        </h1>

        <PageReveal className="flex flex-col gap-6">
          <Reveal>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('pages.cookie.last_updated', { date: '2026-01-07' })}</p>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.introduction.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.introduction.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.introduction.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.what_are_cookies.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.what_are_cookies.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.what_are_cookies.p2')}</p>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.cookie.sections.what_are_cookies.list.session')}</li>
                <li>{t('pages.cookie.sections.what_are_cookies.list.persistent')}</li>
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.commitment.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.commitment.p1')}</p>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.cookie.sections.commitment.list.1')}</li>
                <li>{t('pages.cookie.sections.commitment.list.2')}</li>
                <li>{t('pages.cookie.sections.commitment.list.3')}</li>
                <li>{t('pages.cookie.sections.commitment.list.4')}</li>
                <li>{t('pages.cookie.sections.commitment.list.5')}</li>
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.types.title')}</h2>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.cookie.sections.types.necessary.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.types.necessary.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.cookie.sections.types.necessary.retention_label')}</strong> {t('pages.cookie.sections.types.necessary.retention')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.cookie.sections.types.functional.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.types.functional.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.cookie.sections.types.functional.retention_label')}</strong> {t('pages.cookie.sections.types.functional.retention')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.cookie.sections.types.analytics.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.types.analytics.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.cookie.sections.types.analytics.retention_label')}</strong> {t('pages.cookie.sections.types.analytics.retention')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.cookie.sections.types.advertising.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.types.advertising.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.third_party.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.third_party.p1')}</p>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.cookie.sections.third_party.list.google_analytics')}</li>
                <li>{t('pages.cookie.sections.third_party.list.stripe')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{t('pages.cookie.sections.third_party.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.consent.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.consent.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.browser.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.browser.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.legal_basis.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.legal_basis.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.california.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.california.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.data_security.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.data_security.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.changes.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.cookie.sections.changes.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.cookie.sections.contact.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.cookie.sections.contact.email_label')}</strong> {t('pages.cookie.sections.contact.email')}</p>
            </section>
          </Reveal>
        </PageReveal>
      </main>

      <Footer />
    </div>
  );
};