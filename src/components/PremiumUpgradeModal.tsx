// frontend/src/components/PremiumUpgradeModal.tsx
// NEW (Premium modal feature):
// - Friendly, centered, mobile-responsive modal.
// - Blocks interaction with the underlying learning session (overlay + focus).
// - Accessible: role="dialog", aria-modal, labelled title/description.
// - Dismissible via "Return to My Library" (as required).
// - "Keep Playing!" navigates to /upgrade page stub.

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;

  /**
   * Where to return the user if they choose to exit the session.
   * Defaults to /dashboard (library).
   */
  returnTo?: string;
  // Optional short name of the premium feature being blocked (displayed in the modal)
  feature?: string;
}

export const PremiumUpgradeModal = ({ isOpen, onClose, returnTo = '/dashboard', feature }: Props) => {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElRef = useRef<HTMLElement | null>(null);
  const { t } = useTranslation();

  // Focus management (accessibility):
  // - Save previous focus when opening
  // - Focus the dialog container
  // - Restore focus when closing
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElRef.current = document.activeElement as HTMLElement | null;

    // Prevent background scrolling while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog
    setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocusedElRef.current?.focus?.();
    };
  }, [isOpen]);

  // Trap Escape key? Requirement only says dismissible via "Return to My Library".
  // We'll *not* allow Escape-to-close to ensure user explicitly chooses.
  // Still, we prevent ESC from leaking to underlying UI.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [isOpen]);

  const handleKeepPlaying = () => {
    // Navigate to upgrade page stub (future payment integration lives there)
    navigate('/upgrade');
  };

  const handleReturnToLibrary = () => {
    onClose();
    navigate(returnTo);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay: blocks clicks and typing behind the modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            // Intentionally NOT closable by clicking overlay to avoid accidental dismiss;
            // requirement says dismissible via "Return to My Library".
            onClick={(e) => e.preventDefault()}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="premium-upgrade-title"
            aria-describedby="premium-upgrade-description"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            {/* Header */}
            <div className="flex items-start justify-start gap-4">
              <div>
                <h2
                  id="premium-upgrade-title"
                  className="text-xl font-bold text-gray-900 dark:text-gray-100"
                >
                  {t('modals.premium_upgrade.title')}
                </h2>
                <p
                  id="premium-upgrade-description"
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  // Render the description as HTML so the interpolated <strong> tag is applied.
                  dangerouslySetInnerHTML={{ __html: t('modals.premium_upgrade.description', { price: '$2.99', interpolation: { escapeValue: false } }) }}
                />
              </div>

              {/* top-right close icon removed per request */}
            </div>

            {/* Actions */}
            <div className="mt-6">
              {feature && (
                <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/10">
                  {feature}
                </div>
              )}
              {/* Large green primary button -- increased vertical padding for greater height */}
              <div className="mb-3">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleKeepPlaying}
                  className="!bg-green-600 !text-white hover:!bg-green-700 focus:!ring-green-400 !py-4"
                >
                  {t('modals.premium_upgrade.keep_playing_cta')}
                </Button>
              </div>

              {/* Secondary button: auto-width (only as wide as text) and right-aligned */}
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={handleReturnToLibrary}
                  className="!text-[0.525rem] !px-[0.6rem] !py-[0.375rem]"
                >
                  {t('modals.premium_upgrade.return_to_library')}
                </Button>
              </div>
            </div>

            {/* Small helper text (reduced to 0.5x size) */}
            <p className="mt-4 text-[0.375rem] text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t('modals.premium_upgrade.helper_note') }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PremiumUpgradeModal;