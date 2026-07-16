import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none hidden lg:block" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none hidden lg:block" />

      <div className="relative w-full h-screen lg:max-w-[480px] lg:h-[880px] bg-slate-950 lg:rounded-[32px] shadow-none lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-0 lg:border lg:border-slate-800 flex flex-col overflow-hidden transition-all duration-300">

        {/* Notch — phone-only, hidden on desktop */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-1.5 border-x border-b border-slate-700 lg:hidden">
          <div className="w-12 h-1 bg-slate-900 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
        </div>

        {/* Status bar — phone-only, hidden on desktop */}
        <div className="h-12 bg-slate-900 px-6 pt-3 flex items-center justify-between text-slate-300 text-xs font-semibold select-none z-40 border-b border-slate-800/40 lg:hidden">
          <span className="pl-2">{time}</span>
          <div className="flex items-center gap-1.5 pr-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          </div>
        </div>

        {/* Desktop-only simple header, replaces the fake status bar above lg */}
        <div className="hidden lg:flex h-14 bg-slate-900 px-5 items-center border-b border-slate-800/60 z-40">
          <span className="text-slate-300 text-sm font-semibold tracking-wide">SheetTracker</span>
        </div>

        <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[45%] bg-indigo-600/25 rounded-full blur-[60px]" />
            <div className="absolute bottom-[15%] -right-[15%] w-[60%] h-[45%] bg-purple-600/20 rounded-full blur-[50px]" />
            <div className="absolute top-[40%] left-[10%] w-[50%] h-[35%] bg-emerald-500/10 rounded-full blur-[40px]" />
          </div>
          <div className="flex-1 z-10 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </div>

        {/* Home indicator — phone-only, hidden on desktop */}
        <div className="h-5 bg-slate-900 flex items-center justify-center select-none z-40 border-t border-slate-800/40 lg:hidden">
          <div className="w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
