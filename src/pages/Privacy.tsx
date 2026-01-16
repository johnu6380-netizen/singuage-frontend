import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/AnimatedText';
import { PageReveal, Reveal } from '@/components/PageReveal';
import { useTranslation } from 'react-i18next';

export const Privacy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg border border-black dark:border-white bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('buttons.return_to_library')}
          </button>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-2">
          <AnimatedText text={t('pages.privacy.title')} className="text-3xl font-bold text-gray-900 dark:text-gray-100" />
        </h1>

        <PageReveal className="flex flex-col gap-6">
          <Reveal>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('pages.privacy.last_updated', { date: '2026-01-07' })}</p>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.introduction.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.introduction.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.introduction.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.purpose.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.purpose.p1')}</p>

              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.purpose.p2')}</p>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.privacy.sections.purpose.list.li1')}</li>
                <li>{t('pages.privacy.sections.purpose.list.li2')}</li>
                <li>{t('pages.privacy.sections.purpose.list.li3')}</li>
                <li>{t('pages.privacy.sections.purpose.list.li4')}</li>
                <li>{t('pages.privacy.sections.purpose.list.li5')}</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mt-2">{t('pages.privacy.sections.purpose.p3')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.information.title')}</h2>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.privacy.sections.information.you_provide.title')}</h3>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.privacy.sections.information.you_provide.li1')}</li>
                <li>{t('pages.privacy.sections.information.you_provide.li2')}</li>
                <li>{t('pages.privacy.sections.information.you_provide.li3')}</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.privacy.sections.information.automatic.title')}</h3>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li>{t('pages.privacy.sections.information.automatic.li1')}</li>
                <li>{t('pages.privacy.sections.information.automatic.li2')}</li>
                <li>{t('pages.privacy.sections.information.automatic.li3')}</li>
                <li>{t('pages.privacy.sections.information.automatic.li4')}</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.privacy.sections.information.auth.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.information.auth.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.lyrics.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.lyrics.p1')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.privacy.sections.lyrics.retention_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.lyrics.retention_p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.use.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.use.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.third_party.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.third_party.p1')}</p>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>{t('pages.privacy.sections.third_party.payment_label')}</strong> {t('pages.privacy.sections.third_party.payment_p1')}</li>
                <li><strong>{t('pages.privacy.sections.third_party.analytics_label')}</strong> {t('pages.privacy.sections.third_party.analytics_p1')}</li>
                <li><strong>{t('pages.privacy.sections.third_party.infrastructure_label')}</strong> {t('pages.privacy.sections.third_party.infrastructure_p1')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{t('pages.privacy.sections.third_party.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.cookies.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.cookies.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.email.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.email.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.retention.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.retention.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.security.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.security.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.rights.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.rights.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{t('pages.privacy.sections.rights.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.international.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.international.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.changes.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.privacy.sections.changes.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.privacy.sections.contact.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.privacy.contact.email_label')}</strong> singuage.contact@gmail.com</p>
            </section>
          </Reveal>
        </PageReveal>
      </main>

      <Footer />
    </div>
  );
};