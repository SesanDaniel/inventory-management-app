import React, { useState, useMemo } from 'react';
import { Search, Plus, RefreshCw, Filter, ArrowUpDown, ChevronRight, SlidersHorizontal, Layers } from 'lucide-react';
import { SheetRow, SheetColumn } from '../types';

interface ListViewProps {
  columns: SheetColumn[];
  rows: SheetRow[];
  onSelectRow: (row: SheetRow) => void;
  onAddRow: () => void;
  onLogMovement: () => void;
  sheetName: string;
  spreadsheetTitle: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function ListView({
  columns,
  rows,
  onSelectRow,
  onAddRow,
  onLogMovement,
  sheetName,
  spreadsheetTitle,
  onRefresh,
  isRefreshing,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Auto-detect a good candidate for "Title Column"
  const titleColumn = useMemo(() => {
    if (columns.length === 0) return '';
    const nameKeywords = ['name', 'title', 'id', 'item', 'task', 'project', 'client', 'student'];
    const match = columns.find(c => nameKeywords.some(keyword => c.name.toLowerCase().includes(keyword)));
    return match ? match.name : columns[0].name;
  }, [columns]);

  // Auto-detect a good candidate for "Subtitle Column"
  const subtitleColumn = useMemo(() => {
    if (columns.length <= 1) return '';
    const subKeywords = ['email', 'descr', 'date', 'type', 'category', 'status', 'phone'];
    const candidates = columns.filter(c => c.name !== titleColumn);
    const match = candidates.find(c => subKeywords.some(keyword => c.name.toLowerCase().includes(keyword)));
    return match ? match.name : candidates[0].name;
  }, [columns, titleColumn]);

  // Get unique values for the filter column
  const filterOptions = useMemo(() => {
    if (!filterColumn) return [];
    const values = rows.map(r => r.values[filterColumn]).filter(v => v !== undefined && v !== '');
    return Array.from(new Set(values)).sort();
  }, [rows, filterColumn]);

  // Handle column change in filter
  const handleFilterColumnChange = (col: string) => {
    setFilterColumn(col);
    setFilterValue('');
  };

  // Toggle Sorting
  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  // Filter & Sort Data
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(row =>
        Object.values(row.values).some(val => String(val).toLowerCase().includes(q))
      );
    }

    // Column Filter
    if (filterColumn && filterValue) {
      result = result.filter(row => row.values[filterColumn] === filterValue);
    }

    // Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a.values[sortColumn] || '';
        const valB = b.values[sortColumn] || '';

        // Check if numeric
        const numA = Number(valA.replace(/[$,%\s]/g, ''));
        const numB = Number(valB.replace(/[$,%\s]/g, ''));

        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        // Alphabetical fallback
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rows, searchQuery, filterColumn, filterValue, sortColumn, sortDirection]);

  // Status badge styling helper
  const getBadgeStyle = (val: string) => {
    const v = val.toLowerCase().trim();
    if (v === 'completed' || v === 'done' || v === 'active' || v === 'yes' || v === 'success' || v === 'paid' || v === 'in stock') {
      return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
    }
    if (v === 'pending' || v === 'in progress' || v === 'started' || v === 'waiting' || v === 'unpaid' || v === 'low stock') {
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
    }
    if (v === 'failed' || v === 'cancelled' || v === 'inactive' || v === 'no' || v === 'high' || v === 'error') {
      return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
    }
    if (v === 'medium' || v === 'normal' || v === 'hardware' || v === 'display' || v === 'peripherals' || v === 'accessories') {
      return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300';
    }
    return 'bg-white/5 border-white/10 text-slate-300';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 h-full relative">
      
      {/* Header Panel */}
      <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white truncate pr-2">
              {spreadsheetTitle || 'Connecting...'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-[10px] text-indigo-200 font-medium truncate uppercase tracking-widest">{sheetName}</span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white rounded-lg border border-white/20 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search & Utility Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${rows.length} rows...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white/5 backdrop-blur-md text-slate-200 pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border text-xs transition-all flex items-center justify-center ${
              showFilters || filterColumn
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Filter & Sort Drawer */}
        {showFilters && (
          <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2.5">
            {/* Filter Setup */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Filter Column</label>
              <select
                value={filterColumn}
                onChange={e => handleFilterColumnChange(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 text-slate-200"
              >
                <option value="">-- None --</option>
                {columns.map(col => (
                  <option key={col.name} value={col.name} className="bg-slate-950">
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Filter Value</label>
              <select
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
                disabled={!filterColumn}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 text-slate-200 disabled:opacity-40"
              >
                <option value="">-- All --</option>
                {filterOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-slate-950">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Setup */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Sort By Column</label>
              <div className="flex items-center gap-1">
                <select
                  value={sortColumn}
                  onChange={e => setSortColumn(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 text-slate-200"
                >
                  <option value="">-- Default Order --</option>
                  {columns.map(col => (
                    <option key={col.name} value={col.name} className="bg-slate-950">
                      {col.name}
                    </option>
                  ))}
                </select>
                {sortColumn && (
                  <button
                    onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row List Container */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {filteredAndSortedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-slate-400 mb-3">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-white">No matching records found</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
              Try updating your search queries or clearing active filter parameters.
            </p>
            {(searchQuery || filterColumn) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterColumn('');
                  setFilterValue('');
                }}
                className="mt-4 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedRows.map(row => {
            const heading = row.values[titleColumn] || '(Blank)';
            const subheading = subtitleColumn ? row.values[subtitleColumn] : '';

            // Detect any status values for badges
            const statusCell = columns.find(
              col =>
                col.name.toLowerCase().includes('status') ||
                col.name.toLowerCase().includes('priority') ||
                col.name.toLowerCase().includes('stage')
            );
            const badgeValue = statusCell ? row.values[statusCell.name] : '';

            return (
              <div
                key={row.rowIndex}
                onClick={() => onSelectRow(row)}
                className="group relative bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300 shadow-xl"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate max-w-[200px]">
                      {heading}
                    </h3>
                    {badgeValue && (
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(badgeValue)}`}>
                        {badgeValue}
                      </span>
                    )}
                  </div>
                  {subheading && (
                    <p className="text-[10px] text-indigo-100/60 truncate max-w-[240px]">
                      {subheading}
                    </p>
                  )}
                  {/* Small tag counts or row positions */}
                  <span className="text-[8px] font-mono text-indigo-300/40 mt-1.5 block">
                    ROW {row.rowIndex + 2}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-200/40 group-hover:text-white transition-colors shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) with expandable menu */}
<div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">
  {showFabMenu && (
    <>
      <button
        onClick={() => { setShowFabMenu(false); onLogMovement(); }}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-white/10 active:scale-95 transition-all duration-200"
      >
        Log Movement
      </button>
      <button
        onClick={() => { setShowFabMenu(false); onAddRow(); }}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-white/10 active:scale-95 transition-all duration-200"
      >
        New Item
      </button>
    </>
  )}
  <button
    onClick={() => setShowFabMenu(prev => !prev)}
    className={`w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 hover:scale-105 transition-all duration-300 border border-white/20 ${showFabMenu ? 'rotate-45' : ''}`}
    title="Add"
  >
    <Plus className="w-5 h-5 text-white stroke-[3]" />
  </button>
</div>
  </div>
  );
}
