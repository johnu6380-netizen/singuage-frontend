// src/components/UserDropdown.tsx
// Dropdown menu for user account options

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Trophy, TrendingUp, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';
import { setNativeLanguage } from '@/i18n';

export const UserDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userHasPremium = Boolean((user as any)?.hasPremium || (user as any)?.isPremium);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure i18n language follows the user's saved nativeLanguage (keeps dropdown translations in sync)
  useEffect(() => {
    if ((user as any)?.nativeLanguage) {
      try {
        setNativeLanguage((user as any).nativeLanguage);
      } catch (e) {
        // ignore
      }
    }
  }, [user?.nativeLanguage]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: User,
      label: t('user.dropdown.account'),
      onClick: () => {
        navigate('/account');
        setIsOpen(false);
      },
    },
    {
      icon: Trophy,
      label: t('user.dropdown.achievements'),
      onClick: () => {
        navigate('/achievements');
        setIsOpen(false);
      },
    },
    {
      icon: TrendingUp,
      label: t('user.dropdown.progress'),
      onClick: () => {
        navigate('/progress');
        setIsOpen(false);
      },
    },
    {
      icon: Settings,
      label: t('user.dropdown.settings'),
      onClick: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
    {
      icon: LogOut,
      label: t('user.dropdown.logout'),
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="text-right">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.displayName || t('user.default')}
            </p>
            {userHasPremium && (
              <Crown className="h-4 w-4 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{`🔥 ${t('user.streak', { count: user?.currentStreak || 0 })}`}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-white font-semibold">
          {user?.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
          >
            {/* User Info Header */}
            <div className="border-b border-gray-100 p-4 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {user?.displayName}
              </p>
              {userHasPremium && (
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-yellow-400">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  {t('user.premium')}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
              <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {t('user.xp', { count: user?.totalXp || 0 })}
                </span>
                <span className="flex items-center gap-1">
                  {`🔥 ${t('user.streak_short', { count: user?.currentStreak || 0 })}`}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};