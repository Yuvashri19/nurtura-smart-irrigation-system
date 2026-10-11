import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Clock, CheckCircle2, Droplets, AlertTriangle, AlertCircle, Play } from 'lucide-react';

export const IrrigationTimeline: React.FC = () => {
  const { timeline } = useIrrigation();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="h-3 w-3 text-[#0284C7] fill-current" />;
      case 'progress':
        return <Droplets className="h-3 w-3 text-[#0284C7]" />;
      case 'complete':
        return <CheckCircle2 className="h-3 w-3 text-[#143826]" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case 'fault':
        return <AlertCircle className="h-3 w-3 text-rose-600" />;
      default:
        return <Clock className="h-3 w-3 text-[#667C6A]" />;
    }
  };

  return (
    <div className="rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6EFE4] mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#143826]" />
          <h3 className="text-sm font-bold text-[#143826] font-display">Irrigation Timeline</h3>
        </div>
        <span className="text-[10px] font-mono text-[#667C6A] uppercase tracking-wider">
          Real-Time Log
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-5 space-y-4 max-h-72 overflow-y-auto pr-1">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#E6EFE4]" />

        {timeline.length === 0 ? (
          <p className="text-xs text-[#8A9B8D] italic py-2">No irrigation events logged yet.</p>
        ) : (
          timeline.map((item) => (
            <div key={item.id} className="relative flex items-start gap-3 group">
              <div className="absolute -left-5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-[#CFDFCB] shadow-xs z-10 group-hover:border-[#143826] transition-colors">
                {getIconForType(item.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-[#143826] font-mono">
                    {item.timestamp}
                  </span>
                  <span className="text-[#CFDFCB]">·</span>
                  <span
                    className={`text-xs font-medium ${
                      item.type === 'complete'
                        ? 'text-emerald-700 font-semibold'
                        : item.type === 'fault'
                        ? 'text-rose-700 font-semibold'
                        : item.type === 'warning'
                        ? 'text-amber-700 font-semibold'
                        : 'text-[#334237]'
                    }`}
                  >
                    {item.message}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-[#E6EFE4] text-[11px] font-mono text-[#667C6A] text-center">
        Cycle started, milestones & completion verified
      </div>
    </div>
  );
};
