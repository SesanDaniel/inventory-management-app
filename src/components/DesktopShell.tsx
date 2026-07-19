import React from 'react';

interface DesktopShellProps {
  listPane: React.ReactNode;
  detailPane: React.ReactNode;
  hasSelection: boolean;
}

export default function DesktopShell({ listPane, detailPane, hasSelection }: DesktopShellProps) {
  return (
    <div className="h-screen w-full flex bg-slate-950 text-slate-100">
      {/* Left: list sidebar, fixed width */}
      <div className="w-[420px] shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        {listPane}
      </div>

      {/* Right: detail / form / active content pane */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[45%] bg-indigo-600/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[45%] bg-purple-600/10 rounded-full blur-[70px]" />
        </div>
        <div
          key={hasSelection ? 'selected' : 'empty'}
          className="animate-fade-in flex-1 z-10 flex flex-col overflow-hidden min-h-0"
        >
          {hasSelection ? (
            detailPane
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              Select an item from the list to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
