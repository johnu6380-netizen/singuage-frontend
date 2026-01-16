// src/pages/Settings.tsx
// Settings and preferences page - FEATURE 4

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuthStore, usePreferencesStore } from '@/store/useStore';
import { UserDropdown } from '@/components/UserDropdown';
import { authApi, subscriptionsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type NotificationPrefs = {
  email: boolean;
  push: boolean;
  streakReminders: boolean;
};

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = usePreferencesStore();
  const { t } = useTranslation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Localized theme label for interpolation
  const localizedTheme = t(`settings.appearance.theme_values.${theme}`);

  // Load notification preferences from localStorage so toggles persist
  const [notifications, setNotifications] = useState<NotificationPrefs>(() => {
    try {
      const raw = localStorage.getItem('notificationPreferences');
      if (raw) return JSON.parse(raw) as NotificationPrefs;
    } catch (e) {
      // ignore parse errors
    }
    return { email: true, push: false, streakReminders: true };
  });

  const saveNotifications = (next: NotificationPrefs) => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (!confirm(t('settings.confirm.logout'))) return;

    try {
      // Inform backend so refresh tokens are invalidated
      await authApi.logout();
    } catch (e) {
      // Even if backend logout fails, proceed to clear local auth state
      console.warn('Logout API failed:', e);
    }

    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('settings.confirm.delete_confirm_1'))) return;
    if (!confirm(t('settings.confirm.delete_confirm_2'))) return;

    try {
      await authApi.deleteAccount();
      // Clear local auth state and any stored prefs
      logout();
      localStorage.removeItem('notificationPreferences');
      navigate('/login');
    } catch (e: any) {
      console.error('Account deletion failed:', e);
      alert(e?.response?.data?.error || t('settings.delete_failed'));
    }
  };

  // Cookie preferences state (minimal, without using removed locale keys)
  const [cookiePrefs, setCookiePrefs] = useState<{ nonEssential: boolean }>({ nonEssential: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cookiePreferences');
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.nonEssential === 'boolean') {
          setCookiePrefs({ nonEssential: !!prefs.nonEssential });
        } else if (typeof prefs.functional === 'boolean' || typeof prefs.analytics === 'boolean') {
          setCookiePrefs({ nonEssential: !!(prefs.functional || prefs.analytics) });
        }
      }
    } catch (e) {
      // ignore
    }

    const onCookiePrefsChanged = (e: Event) => {
      try {
        const custom = e as CustomEvent;
        const prefs = custom?.detail;
        if (prefs && typeof prefs === 'object') {
          if (typeof prefs.nonEssential === 'boolean') setCookiePrefs({ nonEssential: !!prefs.nonEssential });
          else if (typeof prefs.functional === 'boolean' || typeof prefs.analytics === 'boolean') setCookiePrefs({ nonEssential: !!(prefs.functional || prefs.analytics) });
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('cookiePreferencesChanged', onCookiePrefsChanged as EventListener);
    return () => window.removeEventListener('cookiePreferencesChanged', onCookiePrefsChanged as EventListener);
  }, []);

  const saveCookiePrefs = (next: typeof cookiePrefs) => {
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', { detail: next }));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.appearance.title')}</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.appearance.theme_label')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.appearance.current_theme', { theme: localizedTheme })}</p>
                </div>
              </div>
              
              <button
                onClick={handleThemeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.notifications.title')}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.notifications.email.label')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.notifications.email.desc')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setNotifications((prev: NotificationPrefs) => {
                      const next = { ...prev, email: !prev.email };
                      saveNotifications(next);
                      return next;
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.notifications.push.label')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.notifications.push.desc')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setNotifications((prev: NotificationPrefs) => {
                      const next = { ...prev, push: !prev.push };
                      saveNotifications(next);
                      return next;
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.notifications.streak.label')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.notifications.streak.desc')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setNotifications((prev: NotificationPrefs) => {
                      const next = { ...prev, streakReminders: !prev.streakReminders };
                      saveNotifications(next);
                      return next;
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.streakReminders ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.streakReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Cookie Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.cookie.title')}</h2>
            
            {/* Cookie toggles (label text kept minimal to avoid referencing removed locale keys) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg aria-hidden className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12a9 9 0 11-9-9 9 9 0 019 9zM8.5 9.25a.75.75 0 100-1.5.75.75 0 000 1.5zM11.25 14a.75.75 0 100-1.5.75.75 0 000 1.5zM15 11.25a.6.6 0 100-1.2.6.6 0 000 1.2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Non-essential Cookies</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('cookie.message')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const next = { nonEssential: !cookiePrefs.nonEssential };
                    setCookiePrefs(next);
                    saveCookiePrefs(next);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cookiePrefs.nonEssential ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cookiePrefs.nonEssential ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Subscription */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="card"
           >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.subscription.title')}</h2>
            
            <div className="flex items-center justify-between">
              <div>
                {((user as any)?.hasPremium || (user as any)?.isPremium) ? (
                  <>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.subscription.premium_active')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.subscription.premium_active_desc')}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.subscription.no_active')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.subscription.no_active_desc')}</p>
                  </>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {((user as any)?.hasPremium || (user as any)?.isPremium) ? (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm(t('settings.subscription.cancel_confirm'))) return;
                      try {
                        setIsRedirecting(true);
                        const resp = await subscriptionsApi.createBillingPortalSession();
                        // backend returns { url }
                        const portalUrl = resp?.url || resp?.sessionUrl || resp?.portalUrl;
                        if (!portalUrl) throw new Error('No billing portal URL returned');
                        // Redirect browser to Stripe Billing Portal
                        window.location.href = portalUrl;
                      } catch (err: any) {
                        console.error('Failed to open billing portal', err);
                        alert(err?.response?.data?.error || err?.message || t('settings.subscription.portal_failed') || 'Failed to open billing portal.');
                      } finally {
                        setIsRedirecting(false);
                      }
                    }}
                    className="text-red-600"
                  >
                    {isRedirecting ? t('buttons.redirecting') || 'Opening…' : t('settings.subscription.cancel_cta')}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/upgrade')}
                  >
                    {t('settings.subscription.upgrade_cta')}
                  </Button>
                )}
              </div>
            </div>
           </motion.div>

           {/* Account Actions */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="card"
           >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.account.title')}</h2>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleLogout}
              >
                {t('settings.actions.logout')}
              </Button>
              
              <Button
                variant="ghost"
                fullWidth
                onClick={handleDeleteAccount}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('settings.actions.delete_account')}
              </Button>
             </div>
           </motion.div>

           {/* App Info */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="card"
           >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.app_info.title')}</h2>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t('settings.app_info.version')}</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.app_info.build')}</span>
                <span className="font-medium">2024.12</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.app_info.account_created')}</span>
                <span className="font-medium">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : t('settings.app_info.unknown')}
                </span>
              </div>
            </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};