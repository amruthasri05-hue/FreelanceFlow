import React, { useState } from 'react';
import { useRouter } from '../../contexts/RouterContext';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Reset your password</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Enter your registered email to receive a recovery link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-950/80 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-indigo-950/20">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Reset instructions sent</h3>
              <p className="text-xs text-slate-400 mt-2">
                If an account exists for <span className="text-slate-200 font-semibold">{email}</span>, you will receive instructions shortly.
              </p>
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
                  className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 text-sm font-semibold"
              >
                Send Reset Link
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
          )}
        </div>
      </div>
    </div>
  );
};
