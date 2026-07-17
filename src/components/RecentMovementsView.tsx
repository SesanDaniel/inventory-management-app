import React from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Clock } from 'lucide-react';
import { MovementLogEntry } from '../lib/sheets';

interface RecentMovementsViewProps {
  movements: MovementLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

function isWithinLast24Hours(dateStr: string): boolean {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return false;
  const diffMs = Date.now() - parsed.getTime();
  return diffMs >= -60 * 60 * 1000 && diffMs <= 24 * 60 * 60 * 1000;
}

const typeIcon = (type: string) => {
  if (type === 'Stock In') return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
  if (type === 'Stock Out') return <ArrowUpRight className="w-4 h-4 text-red-400" />;
  return <ArrowLeftRight className="w-4 h-4 text-amber-400" />;
};

export default function RecentMovementsView({ movements, isLoading, onRefresh }: RecentMovementsViewProps) {
  const recent = movements.filter(m => isWithinLast24Hours(m.date)).reverse();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Clock className="w-5 h-5 text-indigo-400" />
          Last 24 Hours
        </div>
        <button onClick={onRefresh} className="p-1.5 rounded-full bg-slate-800 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm text-center py-10">Loading...</div>
      ) : recent.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-10">No movements logged in the last 24 hours.</div>
      ) : (
        recent.map((m, i) => (
          <div
            key={i}
            className="animate-fade-slide-up bg-white/5 border border-white/10 rounded-2xl p-4"
            style={{ animationDelay: `${(i % 12) * 35}ms` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {typeIcon(m.movementType)}
                <span className="text-white font-semibold text-sm">{m.movementType}</span>
              </div>
              <span className="text-slate-500 text-xs">{m.date}</span>
            </div>
            <div className="text-slate-300 text-sm">{m.partNumber} — Qty {m.qtyMoved}</div>
            {(m.sourceLocation || m.destLocation) && (
              <div className="text-slate-500 text-xs mt-1">{m.sourceLocation || '—'} → {m.destLocation || '—'}</div>
            )}
            {m.recordedBy && <div className="text-slate-600 text-xs mt-1">By {m.recordedBy}</div>}
          </div>
        ))
      )}
    </div>
  );
}
