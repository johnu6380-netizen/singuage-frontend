import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/AnimatedText';
import { PageReveal, Reveal } from '@/components/PageReveal';
import { useTranslation } from 'react-i18next';

export const Terms = () => {
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
          <AnimatedText text={t('pages.terms.title')} className="text-3xl font-bold text-gray-900 dark:text-gray-100" />
        </h1>
        <PageReveal className="flex flex-col gap-6">
          <Reveal>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('pages.terms.last_updated', { date: '2026-01-07' })}</p>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.acceptance.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.acceptance.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.acceptance.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.eligibility.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.eligibility.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.eligibility.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.accounts.title')}</h2>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300">
                <li>{t('pages.terms.sections.accounts.li1')}</li>
                <li>{t('pages.terms.sections.accounts.li2')}</li>
                <li>{t('pages.terms.sections.accounts.li3')}</li>
                <li>{t('pages.terms.sections.accounts.li4')}</li>
                <li>{t('pages.terms.sections.accounts.li5')}</li>
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.purpose.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.purpose.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.purpose.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.user_content.title')}</h2>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.terms.sections.user_content.user_submitted_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.user_content.user_submitted.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.user_content.user_submitted.p2')}</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.user_content.user_submitted.p3')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.terms.sections.user_content.lyrics_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.user_content.lyrics.p1')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4 mb-1">{t('pages.terms.sections.user_content.license_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.user_content.license.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.embedded.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.embedded.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.acceptable_use.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.acceptable_use.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.subscriptions.title')}</h2>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.terms.sections.subscriptions.plans_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.subscriptions.plans.p1')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.terms.sections.subscriptions.billing_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.subscriptions.billing.p1')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.terms.sections.subscriptions.refund_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.subscriptions.refund.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.termination.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.termination.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.dmca.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.dmca.p1')}</p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2 mb-1">{t('pages.terms.sections.dmca.takedown_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.dmca.takedown.p1')}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.terms.contact.email_label')}</strong> singuage.contact@gmail.com</p>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.dmca.takedown.p2')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.disclaimer.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.disclaimer.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.limitation.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.limitation.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.indemnification.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.indemnification.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.arbitration.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.arbitration.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.sections.governing_law.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.terms.sections.governing_law.p1')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.terms.contact.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300"><strong>{t('pages.terms.contact.email_label')}</strong> singuage.contact@gmail.com</p>
            </section>
          </Reveal>
        </PageReveal>
      </main>

      <Footer />
    </div>
  );
};