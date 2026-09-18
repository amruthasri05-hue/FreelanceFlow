import React, { useState, useEffect } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useRouter();
  const { resetPassword, updatePassword, isSupabaseLive } = useAuth();

  // Mode: 'request' (enter email to receive link) or 'update' (set new password after clicking recovery link)
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);

  // Request form state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Detect recovery tokens in URL hash/query or active recovery session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Check if URL indicates a recovery flow (e.g. #type=recovery or ?type=recovery)
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');
    const isRecoveryQuery = search.includes('type=recovery');

    if (isRecoveryHash || isRecoveryQuery) {
      setIsUpdateMode(true);
    }

    // Also check if Supabase session is available
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // If session exists and user navigated to /reset-password, offer update mode
          setIsUpdateMode(true);
        }
      });
    }
  }, []);

  // Handler to request a password reset email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const res = await resetPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || 'Failed to send reset link. Please verify your email.');
    }
  };

  // Handler to set the new password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setUpdateError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match.');
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);

    const res = await updatePassword(newPassword);
    setUpdateLoading(false);

    if (res.success) {
      setUpdateSuccess(true);
    } else {
      setUpdateError(res.error || 'Failed to update password. Please try again or request a new reset link.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 cursor-pointer mb-4"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">FreelanceFlow</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isUpdateMode ? 'Set new password' : 'Reset your password'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {isUpdateMode
            ? 'Enter your new credentials to secure your workspace account'
            : 'Enter your registered email to receive a recovery link'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-950/80 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-indigo-950/20">
          {isUpdateMode ? (
            /* Mode 2: Updating password after clicking recovery link */
            updateSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Password Updated Successfully</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Your password has been changed. You can now sign in to your FreelanceFlow workspace.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="md"
                  className="mt-6 w-full"
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {updateError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={updateLoading}
                  className="w-full mt-2 text-sm font-semibold"
                >
                  {updateLoading ? 'Updating Password...' : 'Save New Password'}
                </Button>

                <div className="pt-2 text-center flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsUpdateMode(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Request new link
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Mode 1: Requesting reset link */
            submitted ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Reset instructions sent</h3>
                <p className="text-xs text-slate-400 mt-2">
                  If an account exists for <span className="text-slate-200 font-semibold">{email}</span>, you will receive instructions shortly.
                </p>
                {isSupabaseLive && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Click the recovery link in the email to return to FreelanceFlow and set a new password.
                  </p>
                )}
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="md"
                  className="mt-6 w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full mt-2 text-sm font-semibold"
                >
                  {loading ? 'Sending Recovery Link...' : 'Send Reset Link'}
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};
