import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { EtHistoryChart } from './EtHistoryChart';
import { History, CheckCircle2, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history } = useIrrigation();
  const [filter, setFilter] = useState<'all' | 'complete' | 'interrupted' | 'fault'>('all');

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E0CE] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#143826] font-display flex items-center gap-2.5">
            <History className="h-6 w-6 text-[#143826]" />
            Irrigation History & Event Logs
          </h1>
          <p className="text-sm text-[#4A5D4E] mt-1">
            Verified local records of autonomous and manual water dosing cycles.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#D1E0CE] rounded-2xl self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#143826] text-white font-semibold'
                : 'text-[#4A5D4E] hover:text-[#143826]'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilter('complete')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
              filter === 'complete'
                ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300'
                : 'text-[#4A5D4E] hover:text-emerald-700'
            }`}
          >
            Complete
          </button>
          <button
            onClick={() => setFilter('interrupted')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
              filter === 'interrupted'
                ? 'bg-amber-100 text-amber-800 font-semibold border border-amber-300'
                : 'text-[#4A5D4E] hover:text-amber-700'
            }`}
          >
            Interrupted
          </button>
          <button
            onClick={() => setFilter('fault')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
              filter === 'fault'
                ? 'bg-rose-100 text-rose-800 font-semibold border border-rose-300'
                : 'text-[#4A5D4E] hover:text-rose-700'
            }`}
          >
            Faults
          </button>
        </div>
      </div>

      {/* Reference Evapotranspiration (ET₀) Historical Analytics */}
      <EtHistoryChart />

      {/* History Table */}
      <div className="rounded-3xl border border-[#D1E0CE] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAF6] border-b border-[#D1E0CE] text-xs font-mono text-[#667C6A] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 sm:px-6">Timestamp</th>
                <th className="py-4 px-4">Plant & Stage</th>
                <th className="py-4 px-4 text-right">Water Delivered</th>
                <th className="py-4 px-4 text-right">Duration</th>
                <th className="py-4 px-4 sm:px-6">Status</th>
                <th className="py-4 px-4 sm:px-6">Telemetry Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EFE4]">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A9B8D] text-sm">
                    No matching irrigation events recorded.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const isComplete = item.status === 'complete';
                  const isInterrupted = item.status === 'interrupted';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAF6] transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6 font-mono text-xs text-[#143826] whitespace-nowrap font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[#667C6A]" />
                          <span>{item.timestamp}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="font-semibold text-[#143826]">{item.plantName}</div>
                        <div className="text-[11px] font-mono text-[#667C6A]">{item.stage}</div>
                      </td>

                      <td className="py-4 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                        <span className={`font-semibold ${isComplete ? 'text-[#0284C7]' : 'text-[#334237]'}`}>
                          {item.waterDelivered} mL
                        </span>
                        <span className="text-[#8A9B8D] text-[11px] ml-1">/ {item.targetVolume} mL</span>
                      </td>

                      <td className="py-4 px-4 text-right font-mono text-xs text-[#667C6A] tabular-nums whitespace-nowrap">
                        {item.durationMinutes} min
                      </td>

                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                            isComplete
                              ? 'bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB]'
                              : isInterrupted
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}
                          {isInterrupted && <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />}
                          {!isComplete && !isInterrupted && <AlertCircle className="h-3.5 w-3.5 text-rose-700" />}
                          <span>{item.statusLabel}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-xs text-[#4A5D4E] max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#F8FAF6] p-4 border-t border-[#D1E0CE] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667C6A] gap-2">
          <span>
            Total recorded volume: <strong className="text-[#143826] font-mono">
              {history.reduce((sum, h) => sum + h.waterDelivered, 0)} mL
            </strong> across {history.length} cycles
          </span>
          <span className="font-mono">
            Node: balc-esp32-node1
          </span>
        </div>
      </div>
    </div>
  );
};
