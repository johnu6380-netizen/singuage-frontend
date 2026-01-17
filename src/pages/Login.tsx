// src/pages/Login.tsx
// Login page with form validation

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError('');

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = t('pages.login.error_username_required');
    if (!formData.password) newErrors.password = t('pages.login.error_password_required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // send username + password to login endpoint
      const response = await authApi.login(formData);
      // login signature: (accessToken, user, refreshToken?)
      login(response.accessToken, response.user, response.refreshToken);
      navigate('/dashboard');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-lg"
          >
            <Music2 className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="mb-2 font-display text-3xl font-bold text-gray-900 dark:text-white">
            {t('pages.login.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('pages.login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
        >
          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                type="text"
                label={t('pages.login.username_label')}
                placeholder={t('pages.login.username_placeholder')}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                error={errors.username}
                required
              />
            </div>

            <div>
              <Input
                type="password"
                label={t('pages.login.password_label')}
                placeholder={t('pages.login.password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">{t('pages.login.remember_me')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {t('pages.login.forgot_password')}
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              {t('pages.login.sign_in')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('pages.login.no_account')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('pages.login.sign_up')}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};