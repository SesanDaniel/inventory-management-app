import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 lg:p-6 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full h-screen lg:max-w-[520px] lg:h-[880px] bg-slate-950 lg:rounded-3xl shadow-none lg:shadow-2xl border-0 lg:border lg:border-slate-800 flex flex-col overflow-hidden">
        <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[45%] bg-indigo-600/20 rounded-full blur-[60px]" />
            <div className="absolute bottom-[15%] -right-[15%] w-[60%] h-[45%] bg-purple-600/15 rounded-full blur-[50px]" />
          </div>
          <div className="animate-fade-in flex-1 z-10 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
