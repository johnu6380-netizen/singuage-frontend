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

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
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
    if (!formData.email) newErrors.email = 'Email is required';
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
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        nativeLanguage: formData.nativeLanguage,
        targetLanguages: formData.targetLanguages,
        isAdult: formData.isAdult, // FEATURE 1: Send age verification
      });

      login(response.accessToken, response.refreshToken, response.user);
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
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start learning languages through music
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FEATURE 1: Age Verification */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Shield className="mr-2 inline h-4 w-4" />
                Age Verification *
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
                    Adult (18+)
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    All content available
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
                    Minor (Under 18)
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Explicit content filtered
                  </div>
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {formData.isAdult
                  ? '✓ You confirm that you are 18 years or older'
                  : '✓ Songs with explicit content will be automatically hidden'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="your@email.com"
                  error={errors.email}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Display Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="pl-10"
                  placeholder="How should we call you?"
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
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    placeholder="Min. 8 characters"
                    error={errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Confirm Password *
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
                    placeholder="Confirm password"
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
                Native Language * (Your first language)
              </label>
              <select
                value={formData.nativeLanguage}
                onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                className="input w-full"
              >
                <option value="">Select your native language</option>
                {LANGUAGES.map((lang) => (
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
                Target Languages * (Languages you want to learn)
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
                Selected: {formData.targetLanguages.length} language(s)
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
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
