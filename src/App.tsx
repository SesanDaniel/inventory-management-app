import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Database, BarChart3, Settings, DatabaseBackup, Loader2, RefreshCw, Smartphone } from 'lucide-react';

import { initAuth, googleSignIn, logout } from './lib/firebase';
import { fetchSpreadsheetMetadata, fetchSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow, insertRowBeforeTotal } from './lib/sheets';
import { SpreadsheetMetadata, SheetRow, SheetColumn, AppTab, ViewMode } from './types';

import MobileFrame from './components/MobileFrame';
import AuthScreen from './components/AuthScreen';
import ListView from './components/ListView';
import DetailView from './components/DetailView';
import FormView from './components/FormView';
import ChartsView from './components/ChartsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Connection & Active spreadsheet states
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1Z0fTl4yXI4KfL7QsZXeuQFGoCERwHf7dOB5z5qGCRUk');
  const [spreadsheetMetadata, setSpreadsheetMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [columns, setColumns] = useState<SheetColumn[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);

  // Navigation and Interactive state
  const [activeTab, setActiveTab] = useState<AppTab>('data');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);

  // Fetch / Loading states
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Restore/Initialize Auth state
  useEffect(() => {
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
  }, []);

  // Sync Google Sheet Metadata once token or spreadsheetId changes
  useEffect(() => {
    if (!token) return;

    const loadMetadata = async () => {
      setIsUpdatingMetadata(true);
      setMetadataError(null);
      try {
        const metadata = await fetchSpreadsheetMetadata(spreadsheetId, token);
        setSpreadsheetMetadata(metadata);

        // Auto-select GID 1812382314 sheet or default to the first sheet
        const sheetGidMatch = metadata.sheets.find(s => s.sheetId === 1812382314);
        if (sheetGidMatch) {
          setSelectedSheetName(sheetGidMatch.name);
        } else if (metadata.sheets.length > 0) {
          setSelectedSheetName(metadata.sheets[0].name);
        }
      } catch (err: any) {
        console.error('Failed to load spreadsheet details:', err);
        setMetadataError(err.message || 'Make sure the Spreadsheet ID is valid and your account has read/write permission.');
      } finally {
        setIsUpdatingMetadata(false);
      }
    };

    loadMetadata();
  }, [token, spreadsheetId]);

  // Load Sheet Rows once selectedSheetName changes
  const loadRowsData = async (refreshing = false) => {
    if (!token || !selectedSheetName) return;

    if (refreshing) setIsRefreshing(true);
    else setIsLoadingRows(true);

    try {
      const result = await fetchSheetRows(spreadsheetId, selectedSheetName, token);
      setColumns(result.columns);
      setRows(result.rows);
      
      // Update selectedRow values if we are refreshing while inspecting a detail view
      if (selectedRow) {
        const updatedRow = result.rows.find(r => r.rowIndex === selectedRow.rowIndex);
        if (updatedRow) {
          setSelectedRow(updatedRow);
        } else {
          setSelectedRow(null);
          setViewMode('list');
        }
      }
    } catch (err: any) {
      console.error('Failed to load sheet rows:', err);
    } finally {
      setIsLoadingRows(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRowsData();
  }, [token, selectedSheetName, spreadsheetId]);

  // Sign In Handler
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Sign in process failed:', err);
      setAuthError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetMetadata(null);
      setSelectedSheetName('');
      setColumns([]);
      setRows([]);
      setSelectedRow(null);
      setViewMode('list');
      setActiveTab('data');
      setNeedsAuth(true);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Swap Sheets Handler
  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    setSelectedRow(null);
    setViewMode('list');
    setActiveTab('data');
  };

  // Append new row to Sheet
  const handleAddRowSubmit = async (values: Record<string, string>) => {
  if (!token || !spreadsheetMetadata) return;
  setIsSaving(true);
  try {
    const columnNames = columns.map(c => c.name);
    const activeSheetInfo = spreadsheetMetadata.sheets.find(s => s.name === selectedSheetName);
    if (!activeSheetInfo) throw new Error('Active sheet not found in metadata');

    // Find the TOTAL row among currently loaded rows (checks the first column's value)
    const totalRow = rows.find(r => String(Object.values(r.values)[0] || '').trim().toUpperCase() === 'TOTAL');

    if (totalRow) {
      const totalSheetRowNumber = totalRow.rowIndex + 2; // data rowIndex 0 = sheet row 2
      await insertRowBeforeTotal(spreadsheetId, activeSheetInfo.sheetId, selectedSheetName, totalSheetRowNumber, columnNames, values, token);
    } else {
      await appendSheetRow(spreadsheetId, selectedSheetName, columnNames, values, token);
    }

    await loadRowsData();
    setViewMode('list');
  } catch (err: any) {
    console.error('Add row failed:', err);
    throw err;
  } finally {
    setIsSaving(false);
  }
};
  
  // Update existing row in Sheet
  const handleEditRowSubmit = async (values: Record<string, string>) => {
    if (!token || !selectedRow) return;
    setIsSaving(true);
    try {
      const columnNames = columns.map(c => c.name);
      await updateSheetRow(spreadsheetId, selectedSheetName, selectedRow.rowIndex, columnNames, values, token);
      
      // Reload rows
      await loadRowsData();
      setViewMode('detail');
    } catch (err: any) {
      console.error('Update row failed:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete row from Sheet
  const handleDeleteRow = async () => {
    if (!token || !selectedRow || !spreadsheetMetadata) return;
    setIsSaving(true);
    try {
      const activeSheetInfo = spreadsheetMetadata.sheets.find(s => s.name === selectedSheetName);
      if (!activeSheetInfo) throw new Error('Active sheet not found in metadata');

      await deleteSheetRow(spreadsheetId, activeSheetInfo.sheetId, selectedRow.rowIndex, token);
      
      setSelectedRow(null);
      setViewMode('list');
      await loadRowsData();
    } catch (err: any) {
      console.error('Delete row failed:', err);
      alert(err.message || 'An error occurred while deleting the row.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers to select tabs
  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    // When changing tabs, clear detail views to keep the dashboard clean
    if (tab !== 'data') {
      setSelectedRow(null);
      setViewMode('list');
    }
  };

  // Render correct sub-view inside 'data' tab
  const renderDataView = () => {
    if (isLoadingRows) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
          <span className="text-xs font-semibold">Loading data cells...</span>
        </div>
      );
    }

    if (viewMode === 'detail' && selectedRow) {
      return (
        <DetailView
          row={selectedRow}
          columns={columns}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={handleDeleteRow}
          isDeleting={isSaving}
        />
      );
    }

    if (viewMode === 'add') {
      return (
        <FormView
          mode="add"
          columns={columns}
          onBack={() => setViewMode('list')}
          onSubmit={handleAddRowSubmit}
          isSubmitting={isSaving}
        />
      );
    }

    if (viewMode === 'edit' && selectedRow) {
      return (
        <FormView
          mode="edit"
          columns={columns}
          initialValues={selectedRow.values}
          onBack={() => setViewMode('detail')}
          onSubmit={handleEditRowSubmit}
          isSubmitting={isSaving}
        />
      );
    }

    return (
      <ListView
        columns={columns}
        rows={rows}
        onSelectRow={row => {
          setSelectedRow(row);
          setViewMode('detail');
        }}
        onAddRow={() => setViewMode('add')}
        sheetName={selectedSheetName}
        spreadsheetTitle={spreadsheetMetadata?.title || 'Spreadsheet'}
        onRefresh={() => loadRowsData(true)}
        isRefreshing={isRefreshing}
      />
    );
  };

  return (
    <MobileFrame>
      {/* Dynamic Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {needsAuth ? (
          <AuthScreen
            onSignIn={handleSignIn}
            isLoggingIn={isLoggingIn}
            error={authError}
          />
        ) : activeTab === 'data' ? (
          renderDataView()
        ) : activeTab === 'charts' ? (
          <ChartsView columns={columns} rows={rows} />
        ) : (
          <SettingsView
            user={user}
            spreadsheetId={spreadsheetId}
            spreadsheetMetadata={spreadsheetMetadata}
            selectedSheetName={selectedSheetName}
            onUpdateSpreadsheetId={newId => {
              setSpreadsheetId(newId);
              setViewMode('list');
              setSelectedRow(null);
              setActiveTab('data');
            }}
            onSelectSheet={handleSelectSheet}
            onLogout={handleLogout}
            isUpdatingMetadata={isUpdatingMetadata}
            metadataError={metadataError}
          />
        )}
      </div>

      {/* Persistent Bottom Mobile Navigation Tabs (visible only when authenticated) */}
      {!needsAuth && (
        <div className="h-18 bg-black/40 backdrop-blur-md border-t border-white/10 px-6 flex items-center justify-around select-none shrink-0 z-40">
          <button
            onClick={() => handleTabChange('data')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 px-4 py-1 rounded-xl ${
              activeTab === 'data' 
                ? 'text-white bg-indigo-500/20 border border-indigo-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-[9px] font-bold font-sans">Data</span>
          </button>

          <button
            onClick={() => handleTabChange('charts')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 px-4 py-1 rounded-xl ${
              activeTab === 'charts' 
                ? 'text-white bg-indigo-500/20 border border-indigo-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[9px] font-bold font-sans">Charts</span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 px-4 py-1 rounded-xl ${
              activeTab === 'settings' 
                ? 'text-white bg-indigo-500/20 border border-indigo-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-bold font-sans">Settings</span>
          </button>
        </div>
      )}
    </MobileFrame>
  );
}
