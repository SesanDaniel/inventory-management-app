import React, { useState, useMemo } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { SheetRow } from '../types';
import { lookupMasterRowByPartNumber } from '../lib/sheets';
import BarcodeScanner from './BarcodeScanner';

interface MovementLogFormProps {
  masterRows: SheetRow[];
  onSubmit: (values: string[]) => Promise<void>;
  onCancel: () => void;
}

const MOVEMENT_TYPES = ['Stock In', 'Stock Out', 'Transfer'];

export default function MovementLogForm({ masterRows, onSubmit, onCancel }: MovementLogFormProps) {
  const [partNumber, setPartNumber] = useState('');
  const [movementType, setMovementType] = useState('Stock Out');
  const [sourceLocation, setSourceLocation] = useState('');
  const [destLocation, setDestLocation] = useState('');
  const [qtyMoved, setQtyMoved] = useState('');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const lookup = useMemo(
    () => (partNumber.trim() ? lookupMasterRowByPartNumber(masterRows, partNumber) : null),
    [partNumber, masterRows]
  );

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!partNumber.trim()) { setError('Enter a Part Number'); return; }
    if (!lookup) { setError('No matching item found for that Part Number'); return; }
    if (!qtyMoved.trim()) { setError('Enter quantity moved'); return; }

    setIsSaving(true);
    setError('');
    try {
      // Array positions match columns A..P; only input columns are actually used by insertMovementLogRow
      const values = new Array(16).fill('');
      values[0] = today;
      values[1] = movementType;
      values[2] = partNumber.trim();
      values[7] = sourceLocation;
      values[8] = destLocation;
      values[9] = qtyMoved;
      values[12] = reference;
      values[13] = remarks;
      values[14] = recordedBy;
      await onSubmit(values);
    } catch (e: any) {
      setError(e.message || 'Failed to save movement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
          Log Movement
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-full bg-slate-800 text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

    <div>
        <label className="text-xs text-slate-400 mb-1 block">Part Number</label>
        <div className="flex gap-2">
          <input
            value={partNumber}
            onChange={e => setPartNumber(e.target.value)}
            placeholder="e.g. M2308N046087E"
            className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-xs font-medium"
          >
            Scan
          </button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(decoded) => {
            setPartNumber(decoded);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Live autofill preview — read-only, matches your sheet's lookup formulas */}
      {partNumber.trim() && (
        lookup ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500 text-xs block">Item Code</span><span className="text-white">{lookup.itemCode}</span></div>
            <div><span className="text-slate-500 text-xs block">Category</span><span className="text-white">{lookup.productCategory}</span></div>
            <div><span className="text-slate-500 text-xs block">Size</span><span className="text-white">{lookup.size}</span></div>
            <div><span className="text-slate-500 text-xs block">Colour</span><span className="text-white">{lookup.colourName}</span></div>
          </div>
        ) : (
          <div className="text-red-400 text-xs">No item found with that Part Number in the master sheet.</div>
        )
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Movement Type</label>
        <select value={movementType} onChange={e => setMovementType(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none">
          {MOVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Source Location</label>
          <input value={sourceLocation} onChange={e => setSourceLocation(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Destination</label>
          <input value={destLocation} onChange={e => setDestLocation(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Qty Moved</label>
        <input type="number" value={qtyMoved} onChange={e => setQtyMoved(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Reference / PO No.</label>
        <input value={reference} onChange={e => setReference(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Remarks</label>
        <input value={remarks} onChange={e => setRemarks(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Recorded By</label>
        <input value={recordedBy} onChange={e => setRecordedBy(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none" />
      </div>

      {error && <div className="text-red-400 text-xs">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Movement'}
      </button>
    </div>
  );
}
