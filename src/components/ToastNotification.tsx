import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ExternalLink } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { alerts, dismissAlert, setCurrentTab } = useIrrigation();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => {
        const isSuccess = alert.type === 'success';
        const isWarning = alert.type === 'warning';
        const isError = alert.type === 'error';

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3 bg-white ${
              isSuccess
                ? 'border-emerald-300 text-[#143826]'
                : isWarning
                ? 'border-amber-300 text-amber-900'
                : isError
                ? 'border-rose-300 text-rose-900'
                : 'border-[#D1E0CE] text-[#143826]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {!isSuccess && !isWarning && !isError && <Info className="h-5 w-5 text-[#0284C7]" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono">{alert.title}</h4>
                <span className="text-[10px] font-mono text-[#8A9B8D]">{alert.timestamp}</span>
              </div>
              <p className="text-xs text-[#334237] mt-1 leading-snug">{alert.message}</p>

              {isSuccess && (
                <button
                  onClick={() => setCurrentTab('history')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#143826] hover:underline transition-colors"
                >
                  <span>View in Irrigation History</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 text-[#8A9B8D] hover:text-[#143826] rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
