import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Activity, TrendingUp, HelpCircle } from 'lucide-react';
import { SheetRow, SheetColumn } from '../types';

interface ChartsViewProps {
  columns: SheetColumn[];
  rows: SheetRow[];
}

type ChartType = 'bar' | 'line' | 'pie';

export default function ChartsView({ columns, rows }: ChartsViewProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  
  // Categorical columns for Group By
  const categoryColumns = useMemo(() => {
    return columns.filter(col => col.type === 'select' || col.type === 'text');
  }, [columns]);

  // Numeric columns for Values
  const numericColumns = useMemo(() => {
    return columns.filter(col => col.type === 'number');
  }, [columns]);

  const [groupByColumn, setGroupByColumn] = useState<string>(() => {
    const candidate = columns.find(col => col.name.toLowerCase().includes('status') || col.name.toLowerCase().includes('category') || col.type === 'select');
    return candidate ? candidate.name : (categoryColumns[0]?.name ?? '');
  });

  const [valueColumn, setValueColumn] = useState<string>(() => {
    return numericColumns[0]?.name ?? '_count'; // '_count' means "Count of Rows" fallback
  });

  // Aggregate Data
  const chartData = useMemo(() => {
    if (!groupByColumn || rows.length === 0) return [];

    const map: Record<string, { name: string; value: number; count: number }> = {};

    rows.forEach(row => {
      let key = row.values[groupByColumn]?.trim() || '(Blank)';
      // truncate key if too long
      if (key.length > 20) key = key.substring(0, 18) + '...';

      if (!map[key]) {
        map[key] = { name: key, value: 0, count: 0 };
      }

      map[key].count += 1;

      if (valueColumn !== '_count') {
        const rawVal = row.values[valueColumn] || '';
        const numVal = Number(rawVal.replace(/[$,%\s]/g, ''));
        if (!isNaN(numVal)) {
          map[key].value += numVal;
        }
      }
    });

    return Object.values(map).map(item => ({
      name: item.name,
      value: valueColumn === '_count' ? item.count : parseFloat(item.value.toFixed(2)),
    })).sort((a, b) => b.value - a.value); // sort descending
  }, [rows, groupByColumn, valueColumn]);

  // Overall statistics summary card data
  const stats = useMemo(() => {
    const totalCount = rows.length;
    let numericSum = 0;
    let numericAvg = 0;
    let numericMin = Infinity;
    let numericMax = -Infinity;
    let hasNumbers = false;

    if (valueColumn !== '_count' && numericColumns.some(c => c.name === valueColumn)) {
      const numbers = rows
        .map(r => Number((r.values[valueColumn] || '').replace(/[$,%\s]/g, '')))
        .filter(n => !isNaN(n));

      if (numbers.length > 0) {
        hasNumbers = true;
        numericSum = numbers.reduce((a, b) => a + b, 0);
        numericAvg = numericSum / numbers.length;
        numericMin = Math.min(...numbers);
        numericMax = Math.max(...numbers);
      }
    }

    return {
      totalCount,
      hasNumbers,
      sum: numericSum,
      avg: numericAvg,
      min: numericMin === Infinity ? 0 : numericMin,
      max: numericMax === -Infinity ? 0 : numericMax,
    };
  }, [rows, valueColumn, numericColumns]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#14b8a6', '#f43f5e'];

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-100">
        <div className="w-12 h-12 bg-white/5 border border-white/10 text-indigo-300 rounded-full flex items-center justify-center mb-3">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-slate-300">No analytical data available</p>
        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">
          Add some rows or select a sheet with data to populate the charts panel automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 h-full">
      {/* Header Panel */}
      <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Analytics Dashboard</h2>
            <p className="text-[10px] text-indigo-200 mt-0.5 font-medium">Automatic metric visualization</p>
          </div>
          
          {/* Chart Type Toggle Buttons */}
          <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'pie' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Pie Chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Line Chart"
            >
              <LineIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Aggregation Selectors */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Group By (X-Axis)</label>
            <select
              value={groupByColumn}
              onChange={e => setGroupByColumn(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 text-slate-200"
            >
              {categoryColumns.map(col => (
                <option key={col.name} value={col.name} className="bg-slate-950">
                  {col.name}
                </option>
              ))}
              {categoryColumns.length === 0 && <option value="" className="bg-slate-950">No categories</option>}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Measure Field (Y-Axis)</label>
            <select
              value={valueColumn}
              onChange={e => setValueColumn(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 text-slate-200"
            >
              <option value="_count" className="bg-slate-950">Row Frequency Count</option>
              {numericColumns.map(col => (
                <option key={col.name} value={col.name} className="bg-slate-950">
                  Sum of {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Aggregation Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Total Entries</span>
            <span className="text-xl font-bold text-white mt-1">{stats.totalCount}</span>
            <span className="text-[8px] text-indigo-300/40 font-mono mt-0.5">ROW COUNT</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">
              {valueColumn === '_count' ? 'Unique Groups' : 'Sum Value'}
            </span>
            <span className="text-xl font-bold text-indigo-300 mt-1 truncate">
              {valueColumn === '_count' ? chartData.length : stats.hasNumbers ? stats.sum.toLocaleString() : 'N/A'}
            </span>
            <span className="text-[8px] text-indigo-300/40 font-mono mt-0.5">
              {valueColumn === '_count' ? 'GROUP BY BUCKETS' : `${valueColumn.toUpperCase()} METRIC`}
            </span>
          </div>

          {valueColumn !== '_count' && stats.hasNumbers && (
            <>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Average</span>
                <p className="text-sm font-semibold text-emerald-300 mt-1 truncate">
                  {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Max / Min</span>
                <p className="text-sm font-semibold text-amber-300 mt-1 truncate">
                  {stats.max.toLocaleString()} / {stats.min.toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Visual Chart Graphic Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl relative h-[280px] flex items-center justify-center">
          {chartData.length === 0 ? (
            <div className="text-center text-slate-400 text-[10px] flex flex-col items-center">
              <HelpCircle className="w-5 h-5 mb-1 text-slate-500" />
              <span>Select grouping parameters to render chart</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#c084fc', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#c084fc' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px' }}
                    itemStyle={{ color: '#f1f5f9', fontSize: '10px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', bottom: 0 }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
