import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, handleApiError } from '@/lib/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setInfo('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-gray-900 dark:text-white">Forgot your password?</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter the email for your account and we'll send a reset link.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          {info && <div className="mb-4 text-sm text-green-600">{info}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={undefined}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                Send reset link
              </Button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            If you don't receive an email, check your spam folder or try again later.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
