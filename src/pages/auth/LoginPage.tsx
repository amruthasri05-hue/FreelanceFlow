import React, { useState } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from '../../lib/validations';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { login, isSupabaseLive } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (email.includes('client') || email.includes('novalabs')) {
        navigate('/client/dashboard');
      } else if (email.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail: string, targetPath: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    const res = await login(demoEmail, 'password123');
    setLoading(false);
    if (res.success) {
      navigate(targetPath);
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Sign in to your client or freelancer workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-950/80 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-indigo-950/20">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 text-sm font-semibold"
            >
              Sign In
            </Button>
          </form>

          {/* 1-Click Role Quick Logins for Instant Demonstration (fallback when live Supabase is not configured) */}
          {!isSupabaseLive && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 text-center mb-3">
                1-Click Demo Accounts
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sarah.jenkins@freelanceflow.dev', '/dashboard')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-indigo-400">Freelancer</span>
                    <span className="text-slate-400 ml-2">Sarah Jenkins</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('marcus@novalabs.ai', '/client/dashboard')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-emerald-400">Client</span>
                    <span className="text-slate-400 ml-2">Marcus Vance (Nova Labs)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('elena.rostova@freelanceflow.dev', '/admin')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-amber-400">Admin</span>
                    <span className="text-slate-400 ml-2">Elena Rostova</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
