import React, { useState } from 'react';
import { 
  loginVirtualUser,
  registerVirtualUser
} from '../lib/firebase';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  User,
  ShieldCheck,
  Loader2,
  Calendar,
  CloudLightning,
  Mail,
  Lock,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user?: any) => void;
  onContinueAsGuest: () => void;
}

export function AuthScreen({ onSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Secure Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const virtualUser = await loginVirtualUser(email, password);
      setSuccess('Successfully authenticated! Loading your personal workspace...');
      localStorage.setItem('tp_virtual_user', JSON.stringify(virtualUser));
      setTimeout(() => {
        onSuccess(virtualUser);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Account not found. Please verify the email or click the "Register" tab to create your account first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please verify your password and try again.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Secure Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!registerEmail || !registerPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters long for security.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await registerVirtualUser(registerEmail, registerPassword);
      setSuccess('Account successfully registered! Logging you in...');
      
      // Auto-sign in the user after successful registration
      localStorage.setItem('tp_virtual_user', JSON.stringify(newUser));
      setTimeout(() => {
        onSuccess(newUser);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('already registered'))) {
        setError('This email is already registered. Please go to the "Sign In" tab to log in.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Decorative sparkles */}
      <div className="absolute top-10 left-10 text-emerald-500/20 pointer-events-none animate-pulse">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute bottom-10 right-10 text-indigo-500/20 pointer-events-none animate-pulse">
        <Sparkles className="w-12 h-12" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-fadeIn">
        
        {/* App Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center border border-white/10 shadow-lg shadow-emerald-500/10 mb-4 animate-pulse">
            <span className="text-xl">⚡</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            TaskPulse AI
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium max-w-xs">
            Your secure personal task planner and schedule optimizer.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-850/60 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{success}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4 mb-6 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Gmail / Google Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850/80 text-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850/80 text-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 mb-6 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Choose Gmail / Google Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850/80 text-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Choose Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850/80 text-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Repeat selected password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850/80 text-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest Fallback Options */}
        <div className="border-t border-slate-850/60 pt-5">
          <button
            type="button"
            disabled={loading}
            onClick={onContinueAsGuest}
            className="w-full bg-slate-950/40 hover:bg-slate-850/60 text-slate-300 hover:text-white border border-slate-850 text-xs font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <User className="w-4 h-4 text-slate-400" />
            Continue as Guest (Offline Mode)
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-5 leading-relaxed">
          🔒 Secure local authentication. Your personal password details are verified 100% on the server and are never shared.
        </p>
      </div>
    </div>
  );
}
