import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { X, Cpu, Droplets, Gauge, ShieldCheck, Check, ArrowRight } from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  const { isArchitectureModalOpen, setIsArchitectureModalOpen } = useIrrigation();

  if (!isArchitectureModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#143826]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsArchitectureModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 text-[#4A5D4E] hover:text-[#143826] rounded-xl hover:bg-[#F2F6F0] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-[#E6EFE4] text-[#143826] flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#143826] font-display">How Nurtura Works</h3>
            <p className="text-xs text-[#4A5D4E]">Closed-Loop Local Irrigation Architecture</p>
          </div>
        </div>

        <p className="text-sm text-[#334237] leading-relaxed mb-6 font-sans">
          Unlike ordinary timers that blindly flood plants, Nurtura calculates hydration requirements based on real-time soil capacitance and meters every single drop with verified flow feedback.
        </p>

        {/* Visual Workflow Steps */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#143826] text-white font-mono text-xs font-bold">
              01
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#143826]">Continuous Capacitive Sensing</h4>
              <p className="text-xs text-[#4A5D4E] mt-0.5 leading-relaxed">
                Corrosion-resistant stainless probe measures soil dielectric permittivity every 2 seconds without chemical degradation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#143826] text-white font-mono text-xs font-bold">
              02
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#143826]">Threshold Decision Engine</h4>
              <p className="text-xs text-[#4A5D4E] mt-0.5 leading-relaxed">
                Evaluates stage-calibrated moisture ranges and verifies optical rain status before triggering the 12V DC pump line.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#143826] text-white font-mono text-xs font-bold">
              03
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#143826]">Flow-Metered Water Delivery</h4>
              <p className="text-xs text-[#4A5D4E] mt-0.5 leading-relaxed">
                Delivers exactly the calibrated volume (e.g. 500 mL) at nominal 82 mL/min. If 0 mL/min is sensed within 2.5s, safety cutoff halts the pump to prevent motor burn-in.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#143826] text-white font-mono text-xs font-bold">
              04
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#143826]">Post-Cycle Verification & Plant Happiness</h4>
              <p className="text-xs text-[#4A5D4E] mt-0.5 leading-relaxed">
                Confirms substrate moisture elevation, transitions the plant from crying to happy/thriving, and permanently logs event metrics locally.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
