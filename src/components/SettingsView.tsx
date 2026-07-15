import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, Database, RefreshCw, Layers, CheckCircle2, AlertCircle, Link } from 'lucide-react';
import { SpreadsheetMetadata, SheetInfo } from '../types';

interface SettingsViewProps {
  user: User | null;
  spreadsheetId: string;
  spreadsheetMetadata: SpreadsheetMetadata | null;
  selectedSheetName: string;
  onUpdateSpreadsheetId: (newId: string) => void;
  onSelectSheet: (sheetName: string) => void;
  onLogout: () => void;
  isUpdatingMetadata: boolean;
  metadataError: string | null;
}

export default function SettingsView({
  user,
  spreadsheetId,
  spreadsheetMetadata,
  selectedSheetName,
  onUpdateSpreadsheetId,
  onSelectSheet,
  onLogout,
  isUpdatingMetadata,
  metadataError,
}: SettingsViewProps) {
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(spreadsheetId);

  const handleUpdateIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSpreadsheetId.trim() === '') return;
    // Extract ID if a full URL was pasted
    let id = tempSpreadsheetId.trim();
    if (id.includes('docs.google.com/spreadsheets')) {
      const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        id = match[1];
      }
    }
    setTempSpreadsheetId(id);
    onUpdateSpreadsheetId(id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 h-full">
      {/* Header Panel */}
      <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg shrink-0">
        <h2 className="text-sm font-bold text-white">App Settings</h2>
        <p className="text-[10px] text-indigo-200 mt-0.5 font-medium">Configure sheet integrations</p>
      </div>

      {/* Settings Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* User Account Card */}
        {user && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-white/25 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-200 rounded-full flex items-center justify-center border border-indigo-500/30 font-bold text-sm">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-white">
                  {user.displayName || 'Authorized Account'}
                </h3>
                <p className="text-[10px] text-indigo-200/60 mt-0.5 truncate max-w-[180px]">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-white/10 rounded-xl transition-all active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Database Spreadsheet Connection Config */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Database Connection</h3>
          </div>

          <form onSubmit={handleUpdateIdSubmit} className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">
              Google Spreadsheet ID or URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempSpreadsheetId}
                onChange={e => setTempSpreadsheetId(e.target.value)}
                placeholder="Spreadsheet ID or URL"
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400 placeholder-slate-500 font-mono transition-all"
              />
              <button
                type="submit"
                disabled={isUpdatingMetadata || tempSpreadsheetId === spreadsheetId}
                className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl transition-all active:scale-95 disabled:opacity-40 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingMetadata ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </form>

          {/* Connection Status Message */}
          {metadataError ? (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] rounded-xl flex items-start gap-2 backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
              <span>{metadataError}</span>
            </div>
          ) : spreadsheetMetadata ? (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] rounded-xl flex items-start gap-2 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Connected Successfully</span>
                <p className="text-indigo-200/80 leading-normal line-clamp-1">
                  Spreadsheet: "{spreadsheetMetadata.title}"
                </p>
              </div>
            </div>
          ) : null}

          {/* Direct Sheets Link Helper */}
          <div className="pt-2 border-t border-white/10">
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-indigo-300 hover:text-indigo-200 font-medium hover:underline"
            >
              <Link className="w-3 h-3 text-indigo-400" />
              <span>Open Sheet in Google Drive</span>
            </a>
          </div>
        </div>

        {/* Dynamic Sheet Tabs Select (AppSheet Sub-tables) */}
        {spreadsheetMetadata && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white">Active Tables</h3>
            </div>
            
            <p className="text-[10px] text-indigo-200/85 leading-normal">
              Select the active Google Sheets tab/table to browse and track columns:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {spreadsheetMetadata.sheets.map(sheet => {
                const isActive = sheet.name === selectedSheetName;
                return (
                  <button
                    key={sheet.name}
                    onClick={() => onSelectSheet(sheet.name)}
                    className={`w-full flex items-center justify-between text-xs py-2.5 px-3 rounded-xl border text-left font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 border-indigo-500/35 text-indigo-200 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{sheet.name}</span>
                    {isActive && (
                      <span className="text-[8px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded-lg border border-indigo-500/35 font-mono uppercase font-bold tracking-wider shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
