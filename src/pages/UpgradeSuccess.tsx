// frontend/src/pages/UpgradeSuccess.tsx
// Simple page shown after Stripe Checkout redirects on success

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

// NOTE: Do NOT update subscription state on the client. The webhook is the
// authoritative source of truth and will update the user's hasPremium flag in
// the backend when Stripe confirms the payment/subscription. The client can
// display friendly messaging while the webhook processes the event.

export const UpgradeSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Optionally, you could poll the server or refresh the user profile here to
    // detect when hasPremium becomes true. For simplicity we do not auto-update
    // state here — rely on a manual refresh or a subsequent authenticated API
    // call to see the updated premium status.
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="card">
        <h2 className="text-2xl font-bold">{t('pages.upgrade_success.title')}</h2>
        <p className="mt-4 text-gray-700">{t('pages.upgrade_success.processing')}</p>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>{t('pages.upgrade_success.cta_dashboard')}</Button>
          <Button variant="secondary" onClick={() => navigate('/upgrade')}>{t('pages.upgrade_success.cta_back_to_upgrade')}</Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSuccess;