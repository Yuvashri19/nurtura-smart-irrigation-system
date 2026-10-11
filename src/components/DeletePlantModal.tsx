import React from 'react';
import { Plant } from '../types/irrigation';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeletePlantModalProps {
  isOpen: boolean;
  plant: Plant | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeletePlantModal: React.FC<DeletePlantModalProps> = ({
  isOpen,
  plant,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !plant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#143826]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#667C6A] hover:text-[#143826] rounded-xl hover:bg-[#F2F6F0] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#143826] font-display">Delete this plant?</h3>
            <p className="text-xs text-[#667C6A]">{plant.name}</p>
          </div>
        </div>

        <p className="text-sm text-[#334237] leading-relaxed mb-6 font-sans">
          Your watering history will remain available, but <strong className="text-[#143826]">{plant.name}</strong> will be removed from your plant list.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-[#334237] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Plant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
