// frontend/src/pages/UpgradeCancel.tsx
// Page shown when a user cancels Stripe Checkout and is redirected back

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

// This page is purely informational. We do NOT change subscription state here.
// Subscription state is managed by Stripe and updated on the backend via webhooks.

export const UpgradeCancel = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // No-op: do not perform any subscription updates.
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="card">
        <h2 className="text-2xl font-bold">{t('pages.upgrade_cancel.title')}</h2>
        <p className="mt-4 text-gray-700">{t('pages.upgrade_cancel.message')}</p>

        <p className="mt-2 text-gray-600 text-sm">{t('pages.upgrade_cancel.try_again')}</p>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => navigate('/upgrade')}>{t('pages.upgrade_cancel.cta_return')}</Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>{t('pages.upgrade_cancel.cta_dashboard')}</Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeCancel;