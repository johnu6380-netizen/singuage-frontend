// frontend/src/pages/Upgrade.tsx
// NEW (Upgrade page stub):
// - Explains premium access.
// - Includes placeholder button for future payment integration.
// - No payment processing is implemented.

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Unlock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PREMIUM_MONTHLY_DISPLAY } from '@/lib/pricing';

import { Button } from '@/components/ui/Button';
import { paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';

export const Upgrade = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  return (
    // Render only content — Dashboard provides the page header/tabs
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('pages.upgrade.title', { price: PREMIUM_MONTHLY_DISPLAY })}
        </h2>

        <p className="mt-3 text-gray-700 dark:text-gray-300">
          {t('pages.upgrade.description')}
        </p>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('pages.premium.benefits_heading') || t('pages.premium.benefits_heading', { defaultValue: 'What you get' })}</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
              <li>{t('pages.premium.benefits.1')}</li>
              <li>{t('pages.premium.benefits.2')}</li>
              <li>{t('pages.premium.benefits.3')}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('pages.upgrade.payment_heading')}
            </h3>

            {/* Placeholder button for future integration */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <Button
                  variant="primary"
                  className="flex items-center justify-center gap-2"
                  onClick={async () => {
                    // Important: The checkout flow is initiated by calling a backend API
                    // route. This keeps STRIPE_SECRET_KEY on the server where it belongs
                    // and prevents secrets from being exposed to the browser.
                    
                    // Authentication is required so we can associate the Stripe session
                    // with a user in our system (and to prevent anonymous session creation).
                    const { isAuthenticated } = useAuthStore.getState();
                    if (!isAuthenticated) {
                      // Redirect users to login if they're not signed in.
                      // This ensures the backend can link the Stripe session to a user.
                      navigate('/login');
                      return;
                    }

                    try {
                      // Disable double-clicks / show loading state
                      // The paymentsApi.createCheckoutSession calls our backend (POST /api/create-checkout-session)
                      // which uses STRIPE_SECRET_KEY to create a Checkout Session and returns the session URL.
                      // We then redirect the browser to the Stripe-hosted checkout page.
                      
                      // Show a quick loading indicator by updating local component state
                      setIsProcessing(true);

                      const response = await paymentsApi.createCheckoutSession();
                      const checkoutUrl = response.url || response.sessionUrl || response.checkoutUrl;
                      if (!checkoutUrl) throw new Error('No checkout URL returned from server');

                      // Redirect the user's browser to the Stripe Checkout page.
                      window.location.href = checkoutUrl;
                    } catch (err) {
                      console.error('Checkout initiation failed', err);
                      alert(t('pages.upgrade.checkout_failed') || 'Failed to start checkout. Please try again or contact support.');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  <Unlock className="h-4 w-4" />
                  {isProcessing ? t('buttons.redirecting') : t('pages.upgrade.cta_continue')}
                </Button>
              </div>

              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard?tab=library')}
                >
                  {t('pages.upgrade.cta_return')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Upgrade;