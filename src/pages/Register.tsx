// src/pages/Register.tsx
// Registration page with Adult/Minor selection - FEATURE 1

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music2, Mail, Lock, User, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
];

// Only allow these languages for the native language field on registration
const NATIVE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'pt', name: 'Portuguese (Português)' },
];

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    nativeLanguage: '',
    targetLanguages: [] as string[],
    isAdult: true, // FEATURE 1: Default to adult
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError('');

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username is required';
    // basic username format: no spaces
    if (formData.username && /\s/.test(formData.username)) newErrors.username = 'Username cannot contain spaces';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.displayName) newErrors.displayName = 'Display name is required';
    if (!formData.nativeLanguage)
      newErrors.nativeLanguage = 'Native language is required';
    if (formData.targetLanguages.length === 0)
      newErrors.targetLanguages = 'Select at least one target language';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        username: formData.username,
        // only send email when provided to avoid storing empty string
        ...(formData.email ? { email: formData.email } : {}),
        password: formData.password,
        displayName: formData.displayName,
        nativeLanguage: formData.nativeLanguage,
        targetLanguages: formData.targetLanguages,
        isAdult: formData.isAdult, // FEATURE 1: Send age verification
      });

      // Show cookie consent banner on first successful login after account creation
      try {
        localStorage.setItem('show_cookie_consent_on_first_login', '1');
      } catch (e) {
        // ignore localStorage failures
      }
      // login signature: (accessToken, user, refreshToken?)
      login(response.accessToken, response.user, response.refreshToken);
      navigate('/dashboard');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTargetLanguage = (langCode: string) => {
    if (langCode === formData.nativeLanguage) return;
    
    setFormData(prev => ({
      ...prev,
      targetLanguages: prev.targetLanguages.includes(langCode)
        ? prev.targetLanguages.filter(l => l !== langCode)
        : [...prev.targetLanguages, langCode],
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-lg">
            <Music2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
            {t('pages.register.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('pages.register.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FEATURE 1: Age Verification */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Shield className="mr-2 inline h-4 w-4" />
                {t('pages.register.age_verification_label')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAdult: true })}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    formData.isAdult
                      ? 'border-primary-600 bg-primary-50 shadow-md dark:bg-primary-900/20'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="mb-2 text-2xl">👤</div>
                  <div className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('pages.register.adult_label')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('pages.register.adult_note')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAdult: false })}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    !formData.isAdult
                      ? 'border-primary-600 bg-primary-50 shadow-md dark:bg-primary-900/20'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="mb-2 text-2xl">🛡️</div>
                  <div className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('pages.register.minor_label')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('pages.register.minor_note')}
                  </div>
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {formData.isAdult ? t('pages.register.confirm_adult') : t('pages.register.confirm_minor')}
              </p>
            </div>

            {/* Email (optional) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-baseline gap-2">
                <span>{t('pages.register.email_label')}</span>
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{t('pages.register.email_helper')}</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder={t('pages.register.email_placeholder')}
                  error={errors.email}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('pages.register.email_later_note')}</p>
            </div>
            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('pages.register.username_label')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10"
                  placeholder={t('pages.register.username_placeholder')}
                  error={errors.username}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('pages.register.display_name_label')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="pl-10"
                  placeholder={t('pages.register.display_name_placeholder')}
                  error={errors.displayName}
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('pages.register.password_label')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    placeholder={t('pages.register.password_placeholder')}
                    error={errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('pages.register.confirm_password_label')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="pl-10"
                    placeholder={t('pages.register.confirm_password_placeholder')}
                    error={errors.confirmPassword}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Native Language */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Globe className="mr-2 inline h-4 w-4" />
                {t('pages.register.native_language_label')}
              </label>
              <select
                value={formData.nativeLanguage}
                onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                className="input w-full"
              >
                <option value="">{t('pages.register.select_native_language')}</option>
                {NATIVE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.nativeLanguage && (
                <p className="mt-1 text-sm text-red-600">{errors.nativeLanguage}</p>
              )}
            </div>

            {/* Target Languages */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('pages.register.target_languages_label')}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LANGUAGES.filter(l => l.code !== formData.nativeLanguage).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleTargetLanguage(lang.code)}
                    disabled={lang.code === formData.nativeLanguage}
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${
                      formData.targetLanguages.includes(lang.code)
                        ? 'border-primary-600 bg-primary-50 font-semibold text-primary-900 shadow-sm dark:bg-primary-900/20 dark:text-primary-100'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500'
                    } ${lang.code === formData.nativeLanguage ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
              {errors.targetLanguages && (
                <p className="mt-2 text-sm text-red-600">{errors.targetLanguages}</p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('pages.register.selected_count', { count: formData.targetLanguages.length })}
              </p>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                {apiError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('pages.register.creating_account')}
                </div>
              ) : (
                t('pages.register.create_account')
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('pages.register.already_have_account')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('pages.register.sign_in')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};