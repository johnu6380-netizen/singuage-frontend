// src/App.tsx
// Main application with routing - UPDATED for Premium Upgrade page stub
// NOTE: Only change here is adding the /upgrade route.

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, usePreferencesStore } from './store/useStore';
import { CookieConsent } from '@/components/CookieConsent';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { LearningSession } from './pages/LearningSession';
import { AddSong } from './pages/AddSong';
import { AccountInfo } from './pages/AccountInfo';
import { Achievements } from './pages/Achievements';
import { Progress } from './pages/Progress';
import { Congratulations } from './pages/Congratulations';
import { Upgrade } from './pages/Upgrade'; // ✅ NEW
import { UpgradeSuccess } from './pages/UpgradeSuccess';
import { UpgradeCancel } from './pages/UpgradeCancel';
import { Settings } from './pages/Settings';
import { AdBreak } from './pages/AdBreak';
import { About } from './pages/About';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { CookiePolicy } from './pages/CookiePolicy';
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { loadPreferences } = usePreferencesStore();

  // Check authentication status on mount
  useEffect(() => {
    // Always call checkAuth so the store can update isLoading=false even when
    // there is no access token. Previously we only called checkAuth when an
    // access token existed which left isLoading=true indefinitely for new or
    // logged-out users and caused the UI to show a permanent spinner.
    checkAuth();
    loadPreferences();
  }, [checkAuth, loadPreferences]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CookieConsent />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          {/* Password reset page (public) */}
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          {/* Forgot password request page (public) */}
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-song/:videoId"
            element={
              <ProtectedRoute>
                <AddSong />
              </ProtectedRoute>
            }
          />

          <Route
            path="/learn/:songId"
            element={
              <ProtectedRoute>
                <LearningSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ad-break"
            element={
              <ProtectedRoute>
                <AdBreak />
              </ProtectedRoute>
            }
          />

          <Route
            path="/congratulations"
            element={
              <ProtectedRoute>
                <Congratulations />
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: Upgrade page stub */}
          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <Upgrade />
              </ProtectedRoute>
            }
          />

          {/* Public pages shown after Stripe Checkout redirects */}
          <Route path="/upgrade/success" element={<UpgradeSuccess />} />
          <Route path="/upgrade/cancel" element={<UpgradeCancel />} />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountInfo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Informational pages accessible from dashboard footer */}
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />
          <Route
            path="/terms"
            element={
              <ProtectedRoute>
                <Terms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <ProtectedRoute>
                <Privacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cookie-policy"
            element={
              <ProtectedRoute>
                <CookiePolicy />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;