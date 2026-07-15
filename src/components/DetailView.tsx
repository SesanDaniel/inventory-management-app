import React, { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Copy, Check, ExternalLink, Mail, Calendar, FileText } from 'lucide-react';
import { SheetRow, SheetColumn } from '../types';

interface DetailViewProps {
  row: SheetRow;
  columns: SheetColumn[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export default function DetailView({
  row,
  columns,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}: DetailViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleCopy = (fieldName: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    await onDelete();
  };

  // Check if a string is a valid image URL
  const isImageUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return (
      cleanUrl.endsWith('.png') ||
      cleanUrl.endsWith('.jpg') ||
      cleanUrl.endsWith('.jpeg') ||
      cleanUrl.endsWith('.gif') ||
      cleanUrl.endsWith('.webp') ||
      cleanUrl.endsWith('.svg')
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 h-full">
      {/* Header Panel */}
      <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-lg z-10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg border border-white/20 transition-all text-xs flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline font-medium">Edit</span>
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-300 rounded-lg border border-rose-500/20 transition-all text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline font-medium">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Row Index Badge Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Spreadsheet Record</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg text-indigo-200">
            SHEET ROW {row.rowIndex + 2}
          </span>
        </div>

        {/* Dynamic Fields Stack */}
        <div className="space-y-3">
          {columns.map(col => {
            const rawVal = row.values[col.name];
            const isValEmpty = rawVal === undefined || rawVal.trim() === '';
            const value = isValEmpty ? '(Blank)' : rawVal;

            const isUrlType = col.type === 'url' || value.startsWith('http');
            const isEmailType = col.type === 'email' || value.includes('@') && !value.includes(' ');
            const isImg = isUrlType && isImageUrl(value);
            
            // Check if column name implies status/badge styling
            const isStatusCol =
              col.name.toLowerCase().includes('status') ||
              col.name.toLowerCase().includes('priority') ||
              col.name.toLowerCase().includes('role') ||
              col.name.toLowerCase().includes('stage');

            return (
              <div
                key={col.name}
                className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all group relative"
              >
                {/* Field Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    {col.name}
                  </span>
                  {!isValEmpty && (
                    <button
                      onClick={() => handleCopy(col.name, rawVal)}
                      className="p-1 text-slate-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy value"
                    >
                      {copiedField === col.name ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Field Value */}
                <div className="mt-1">
                  {isImg ? (
                    <div className="mt-1 rounded-xl overflow-hidden border border-white/10 max-w-full bg-black/20 flex justify-center p-2">
                      <img
                        src={value}
                        alt={col.name}
                        referrerPolicy="no-referrer"
                        className="max-h-48 object-contain"
                      />
                    </div>
                  ) : isUrlType && !isValEmpty ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 font-medium hover:underline break-all"
                    >
                      <span>{value}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : isEmailType && !isValEmpty ? (
                    <a
                      href={`mailto:${value}`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 font-medium hover:underline break-all"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{value}</span>
                    </a>
                  ) : isStatusCol && !isValEmpty ? (
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(value)}`}>
                      {value}
                    </span>
                  ) : (
                    <p className={`text-xs leading-relaxed font-medium break-words ${isValEmpty ? 'text-slate-500 italic' : 'text-slate-100'}`}>
                      {value}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[320px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Row?</h3>
              <p className="text-[10px] text-slate-300 leading-normal">
                Are you sure you want to delete Row {row.rowIndex + 2}? This action modifies the spreadsheet directly and cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-xs font-semibold py-2.5 bg-white/5 border border-white/10 text-slate-200 rounded-xl hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-xs font-semibold py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-md shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
