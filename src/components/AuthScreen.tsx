import React, { useState } from 'react';
import { 
  signInWithPopup,
  GoogleAuthProvider,
  auth,
  setCachedAccessToken
} from '../lib/firebase';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Chrome,
  User,
  ShieldCheck
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

export function AuthScreen({ onSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
      setSuccess('Logged in with Google successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Google authentication failed.';
      if (err.code === 'auth/popup-blocked') {
        errMsg = 'The sign-in popup was blocked by your browser. Please allow popups or try opening the app in a new tab.';
      } else if (err.code === 'auth/closed-by-user') {
        errMsg = 'The sign-in popup was closed before completing the authentication.';
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Floating Sparkles decorative element */}
      <div className="absolute top-10 left-10 text-emerald-500/20 pointer-events-none animate-pulse">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute bottom-10 right-10 text-indigo-500/20 pointer-events-none animate-pulse">
        <Sparkles className="w-12 h-12" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* App Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center border border-white/10 shadow-lg shadow-emerald-500/10 mb-4">
            <span className="text-xl">⚡</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            TaskPulse AI
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium max-w-xs">
            Your intelligent personal productivity engine and schedule optimizer.
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 text-slate-300 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-4 h-4" /> Secure Cloud Vault
          </div>
          <p className="leading-relaxed text-slate-400">
            Sign in to instantly backup, sync, and access your daily schedule, AI chats, and breakdown tasks across all your devices.
          </p>
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

        {/* Google Sign In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full mb-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider py-4 px-4 rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </>
          )}
        </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-850/60"></div>
          <span className="flex-shrink mx-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-slate-850/60"></div>
        </div>

        {/* Guest Continue */}
        <button
          type="button"
          disabled={loading}
          onClick={onContinueAsGuest}
          className="w-full bg-slate-950/40 hover:bg-slate-850/60 text-slate-300 hover:text-white border border-slate-850 text-xs font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4 text-slate-400" />
          Continue as Guest (Offline)
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-5 leading-relaxed">
          🔒 Secure authentication. Your database connections are managed fully securely.
        </p>
      </div>
    </div>
  );
}
