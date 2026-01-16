import { useState, FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, handleApiError } from '@/lib/api';

export const ResetPassword = () => {
  // i18n not used on this page
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialToken = params.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    // Keep token in sync if the URL changes
    setToken(initialToken);
  }, [initialToken]);

  const validatePassword = (pw: string) => {
    const errs: string[] = [];
    if (!pw || pw.length < 8) errs.push('Password must be at least 8 characters');
    if (pw.length > 128) errs.push('Password must be 128 characters or fewer');
    // character variety suggestion (not strictly required, but recommended)
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    if (!(hasLower && hasUpper && hasNumber && hasSpecial)) {
      errs.push('Use a mix of uppercase, lowercase, numbers and symbols for a stronger password');
    }
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError('');

    const newErrors: Record<string, string> = {};
    if (!token) newErrors.token = 'Reset token is required';

    const pwErrs = validatePassword(password);
    if (pwErrs.length > 0) newErrors.password = pwErrs.join('. ');

    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      // On success, redirect to login with a success message
      navigate('/login', { state: { info: 'Password reset successful. Please sign in with your new password.' } });
    } catch (err) {
      setApiError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter a new password for your account. The link expires in 30 minutes.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          {apiError && <div className="mb-4 text-sm text-red-600">{apiError}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Token (hidden) */}
            <input type="hidden" name="token" value={token} />

            <div>
              <Input
                label="New password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              <p className="mt-2 text-xs text-gray-500">Minimum 8 characters. We recommend using a mix of uppercase, lowercase, numbers and symbols.</p>
            </div>

            <div>
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                Reset password
              </Button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            If you didn't request this, you can safely ignore this email or contact support.
          </div>
        </div>
      </motion.div>
    </div>
  );
};