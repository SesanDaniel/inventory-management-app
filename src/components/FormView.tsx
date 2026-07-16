import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { SheetColumn } from '../types';
import { deriveFieldsFromPartNumber } from '../lib/deriveFields';

interface FormViewProps {
  mode: 'add' | 'edit';
  columns: SheetColumn[];
  initialValues?: Record<string, string>;
  onBack: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  isSubmitting: boolean;
  colorMap?: Record<string, string>;
}

export default function FormView({
  mode,
  columns,
  initialValues,
  onBack,
  onSubmit,
  isSubmitting,
  colorMap = {},
}: FormViewProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Load initial values or set defaults
  useEffect(() => {
    const vals: Record<string, string> = {};
    columns.forEach(col => {
      vals[col.name] = initialValues?.[col.name] ?? '';
    });
    setFormValues(vals);
    setError(null);
  }, [columns, initialValues]);

  const handleChange = (fieldName: string, value: string) => {
    setFormValues(prev => {
      const next = { ...prev, [fieldName]: value };
      if (mode === 'add' && fieldName === 'Part Number') {
        const derived = deriveFieldsFromPartNumber(value, colorMap);
        if (derived) {
          next['Item Code'] = derived.itemCode;
          next['Item Type'] = derived.itemType;
          next['Size'] = derived.size;
          next['Colour Code'] = derived.colourCode;
          next['Colour Name'] = derived.colourName;
        }
      }
      return next;
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that some values are filled (at least one field should be filled, or a required check)
    const hasValues = Object.values(formValues).some(v => v !== undefined && String(v).trim() !== '');
    if (!hasValues) {
      setError('Please fill out at least one field before saving.');
      return;
    }

    try {
      await onSubmit(formValues);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    }
  };

  // Helper to check if a header implies a multi-line input textarea
  const isTextAreaField = (name: string) => {
    const lowercase = name.toLowerCase();
    return (
      lowercase.includes('description') ||
      lowercase.includes('note') ||
      lowercase.includes('comment') ||
      lowercase.includes('remark') ||
      lowercase.includes('address') ||
      lowercase.includes('bio')
    );
  };

  // Helper to format date for HTML date inputs (YYYY-MM-DD)
  const formatDateForInput = (val: string) => {
    if (!val) return '';
    const parsed = Date.parse(val);
    if (isNaN(parsed)) return '';
    const d = new Date(parsed);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 h-full">
      {/* Header Panel */}
      <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          {mode === 'add' ? 'New Record' : 'Edit Record'}
        </h2>

        <div className="w-10" /> {/* Spacer to center heading */}
      </div>

      {/* Main Form Fields Container */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {columns.map(col => {
              const value = formValues[col.name] ?? '';
              const isTextArea = isTextAreaField(col.name);

              return (
                <div key={col.name} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                    <span>{col.name}</span>
                    {col.type !== 'text' && (
                      <span className="text-[8px] font-mono font-medium text-indigo-200/60 px-1 border border-white/10 rounded">
                        {col.type}
                      </span>
                    )}
                  </label>

                  {col.type === 'select' && col.options ? (
                    <div className="relative">
                      <select
                        value={value}
                        onChange={e => handleChange(col.name, e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl p-3 focus:outline-none focus:border-indigo-400 text-slate-100 transition-all"
                      >
                        <option value="">-- Choose Option --</option>
                        {col.options.map(opt => (
                          <option key={opt} value={opt} className="bg-slate-950">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : isTextArea ? (
                    <textarea
                      value={value}
                      onChange={e => handleChange(col.name, e.target.value)}
                      rows={3}
                      placeholder={`Enter ${col.name.toLowerCase()}...`}
                      className="w-full text-xs bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:bg-white/10 text-white transition-all placeholder-slate-400 resize-none"
                    />
                  ) : col.type === 'date' ? (
                    <input
                      type="date"
                      value={formatDateForInput(value) || value}
                      onChange={e => handleChange(col.name, e.target.value)}
                      className="w-full text-xs bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:bg-white/10 text-white transition-all"
                    />
                  ) : col.type === 'number' ? (
                    <input
                      type="number"
                      step="any"
                      value={value}
                      onChange={e => handleChange(col.name, e.target.value)}
                      placeholder="0"
                      className="w-full text-xs bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:bg-white/10 text-white transition-all placeholder-slate-400"
                    />
                  ) : (
                    <input
                      type={col.type === 'email' ? 'email' : 'text'}
                      value={value}
                      onChange={e => handleChange(col.name, e.target.value)}
                      placeholder={`Enter ${col.name.toLowerCase()}...`}
                      className="w-full text-xs bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:bg-white/10 text-white transition-all placeholder-slate-400"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions Footer */}
        <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/10 shadow-lg shrink-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-xs">Saving to Sheets...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span className="text-xs">Save Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
