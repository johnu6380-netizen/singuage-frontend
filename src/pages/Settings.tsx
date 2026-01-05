// src/pages/Settings.tsx
// Settings and preferences page - FEATURE 4

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Volume2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuthStore, usePreferencesStore } from '@/store/useStore';
import { UserDropdown } from '@/components/UserDropdown';
import { authApi } from '@/lib/api';

type NotificationPrefs = {
  email: boolean;
  push: boolean;
  streakReminders: boolean;
};

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = usePreferencesStore();
  
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
    if (!confirm('Are you sure you want to log out?')) return;

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
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) return;

    try {
      await authApi.deleteAccount();
      // Clear local auth state and any stored prefs
      logout();
      localStorage.removeItem('notificationPreferences');
      navigate('/login');
    } catch (e: any) {
      console.error('Account deletion failed:', e);
      alert(e?.response?.data?.error || 'Failed to delete account. Please try again.');
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Settings
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your preferences and account
                </p>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Appearance
            </h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Currently using {theme} mode
                  </p>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive updates via email
                    </p>
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
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive push notifications
                    </p>
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
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Streak Reminders
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Daily reminder to maintain streak
                    </p>
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

          {/* Audio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Audio
            </h2>
            
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  Sound Effects
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="w-full"
                />
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Account
            </h2>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleLogout}
              >
                Log Out
              </Button>
              
              <Button
                variant="ghost"
                fullWidth
                onClick={handleDeleteAccount}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              About
            </h2>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span className="font-medium">2024.12</span>
              </div>
              <div className="flex justify-between">
                <span>Account Created</span>
                <span className="font-medium">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};