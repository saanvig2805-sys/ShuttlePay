import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bus, Mail, Lock, ArrowRight, Loader2, GraduationCap, Presentation } from 'lucide-react';
import type { UserRole } from '@/types';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setLoading(false);
      }
    } else {
      const { error: err } = await signUp(email, password, selectedRole);
      if (err) {
        setError(err);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg shadow-red-500/30">
            <Bus className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Shuttle</h1>
          <p className="text-slate-400 mt-1 text-sm">Campus bus, simplified.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
          <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Role selector - only on signup */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedRole('student')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    selectedRole === 'student'
                      ? 'bg-red-500/10 border-red-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 ${selectedRole === 'student' ? 'text-red-400' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <div className="text-sm font-medium">Student</div>
                    <div className="text-[10px] text-slate-500">20 credits/ride</div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedRole('teacher')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    selectedRole === 'teacher'
                      ? 'bg-blue-500/10 border-blue-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Presentation className={`w-5 h-5 ${selectedRole === 'teacher' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <div className="text-sm font-medium">Teacher</div>
                    <div className="text-[10px] text-slate-500">Free rides</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          {mode === 'signup' && selectedRole === 'student'
            ? 'New student accounts start with 100 credits. Each ride costs 20.'
            : mode === 'signup' && selectedRole === 'teacher'
            ? 'Teachers ride free with unlimited access.'
            : 'Students: 100 credits to start, 20 per ride. Teachers ride free.'}
        </p>
      </div>
    </div>
  );
}
