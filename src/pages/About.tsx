import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { AnimatedText } from '@/components/AnimatedText';
import { PageReveal, Reveal } from '@/components/PageReveal';
import { useTranslation } from 'react-i18next';

export const About = () => {
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
            {t('pages.about.back_to_library')}
          </button>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-4">
          <AnimatedText text={t('pages.about.title')} className="text-3xl font-bold text-gray-900 dark:text-gray-100" />
        </h1>

        <PageReveal className="flex flex-col gap-6">
          <Reveal>
            <p className="mb-4 text-gray-700 dark:text-gray-300">{t('pages.about.vision_body')}</p>
          </Reveal>

          <Reveal>
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.about.vision_heading')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.about.vision_body')}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.about.what_we_offer_heading')}</h2>
              <ul className="list-inside list-disc text-gray-700 dark:text-gray-300">
                <li>{t('pages.about.offers.1')}</li>
                <li>{t('pages.about.offers.2')}</li>
                <li>{t('pages.about.offers.3')}</li>
                <li>{t('pages.about.offers.4')}</li>
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pages.about.contact_heading')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('pages.about.contact_body')}</p>
            </section>
          </Reveal>
        </PageReveal>
      </main>

      <Footer />
    </div>
  );
};