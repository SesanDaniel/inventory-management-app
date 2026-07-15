import React from 'react';
import { Database, Smartphone, BarChart3, RefreshCw, KeyRound } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  error: string | null;
}

export default function AuthScreen({ onSignIn, isLoggingIn, error }: AuthScreenProps) {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-transparent text-slate-100">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mt-8">
        <div className="relative mb-4">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-40 animate-pulse" />
          <div className="relative w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Database className="w-8 h-8 text-indigo-300" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
          SheetTracker
        </h1>
        <p className="text-xs text-indigo-200 mt-1.5 max-w-[260px] leading-relaxed">
          The instant AppSheet companion. Read, input, and analyze your Google Sheets data in real-time.
        </p>
      </div>

      {/* Feature Stack */}
      <div className="space-y-3.5 my-6">
        <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Mobile First Interface</h3>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-normal">
              AppSheet-like grid layout, touch-friendly scrolling, and seamless transitions.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Real-Time Syncing</h3>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-normal">
              Direct live reads and writes with instant reflecting on your sheet rows.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-300">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Automated Visual Analytics</h3>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-normal">
              Discovers numeric columns automatically to build gorgeous interactive charts.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Interaction Area */}
      <div className="flex flex-col gap-4 mb-8">
        {error && (
          <div className="text-center p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={onSignIn}
          disabled={isLoggingIn}
          className="relative group w-full flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white font-semibold py-3 px-4 rounded-xl border border-white/20 shadow-md transition-all active:scale-[0.98] hover:bg-white/20 hover:border-white/30 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          <span className="text-sm font-sans text-white">Sign in with Google</span>
        </button>

        <p className="text-[9px] text-center text-slate-400 leading-normal max-w-[280px] mx-auto">
          Secure, direct client-side integration using official Google API protocols. Your spreadsheet secrets are never shared.
        </p>
      </div>
    </div>
  );
}
