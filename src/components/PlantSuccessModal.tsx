import React from 'react';
import { Plant } from '../types/irrigation';
import { CATEGORY_ICONS } from '../lib/plantCategoryDefaults';
import { Sprout, ArrowRight, X } from 'lucide-react';

interface PlantSuccessModalProps {
  isOpen: boolean;
  plant: Plant | null;
  onUseNow: () => void;
  onLater: () => void;
}

export const PlantSuccessModal: React.FC<PlantSuccessModalProps> = ({
  isOpen,
  plant,
  onUseNow,
  onLater,
}) => {
  if (!isOpen || !plant) return null;

  const icon = (plant.category && CATEGORY_ICONS[plant.category]) || '🌱';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#143826]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onLater}
          className="absolute top-4 right-4 p-1.5 text-[#667C6A] hover:text-[#143826] rounded-xl hover:bg-[#F2F6F0] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#E6EFE4] text-[#143826] flex items-center justify-center text-2xl shrink-0">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
              SAVED
            </span>
            <h3 className="text-lg font-bold text-[#143826] font-display mt-0.5">
              {plant.name} added!
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#334237] leading-relaxed mb-6 font-sans">
          Use this plant profile now to calibrate moisture targets and dosing on your live dashboard?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onLater}
            className="px-4 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-[#334237] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            onClick={onUseNow}
            className="px-5 py-2.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Use Plant</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
