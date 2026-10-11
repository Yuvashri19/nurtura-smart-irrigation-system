import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { RefreshCw, X } from 'lucide-react';

export const ResetDemoModal: React.FC = () => {
  const { isResetModalOpen, setIsResetModalOpen, resetCalibration } = useIrrigation();

  if (!isResetModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#143826]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={() => setIsResetModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-[#667C6A] hover:text-[#143826] rounded-xl hover:bg-[#F2F6F0] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[#E6EFE4] text-[#143826] flex items-center justify-center">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#143826] font-display">Reset Controller Calibration?</h3>
            <p className="text-xs text-[#667C6A]">Restore nominal sensor baseline</p>
          </div>
        </div>

        <p className="text-sm text-[#334237] leading-relaxed mb-6 font-sans">
          This will restore the sample tomato plant conditions, 42% balanced substrate capacitance, and verified history events.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setIsResetModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-[#334237] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={resetCalibration}
            className="px-5 py-2.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Reset Calibration
          </button>
        </div>
      </div>
    </div>
  );
};
