import React, { useState } from 'react';
import { Plant } from '../types/irrigation';
import { CATEGORY_ICONS } from '../lib/plantCategoryDefaults';
import { Check, MoreVertical, Edit2, Trash2, Droplets } from 'lucide-react';

interface CustomPlantCardProps {
  plant: Plant;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomPlantCard: React.FC<CustomPlantCardProps> = ({
  plant,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const icon = (plant.category && CATEGORY_ICONS[plant.category]) || '🌱';

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-3xl p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-[#143826] shadow-md shadow-[#143826]/8 ring-1 ring-[#143826]'
          : 'bg-white/70 border-[#D1E0CE] hover:border-[#143826]/40 hover:bg-white'
      }`}
    >
      {/* Checkmark badge */}
      {isSelected && (
        <div className="absolute top-3 right-11 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#143826] text-white shadow-xs">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      )}

      {/* 3-Dots Action Menu */}
      <div
        className="absolute top-3 right-3 z-20"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-7 w-7 rounded-xl bg-white/90 hover:bg-[#F0F5EE] border border-[#CFDFCB] text-[#4A5D4E] hover:text-[#143826] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          title="Plant options"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 top-8 z-40 w-36 rounded-2xl bg-white border border-[#D1E0CE] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-[#143826] hover:bg-[#F2F7F0] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#2A6E4E]" />
                <span>Edit Plant</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Delete Plant</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Plant Icon & Category Display */}
      <div>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#EDF3EB] mb-3 border border-[#CFDFCB] flex items-center justify-center select-none">
          <span className={`text-6xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
          </span>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs border border-[#CFDFCB] text-[10px] font-mono text-[#143826] font-semibold">
            {plant.category || 'Custom'}
          </div>
        </div>

        <h3 className="font-bold text-[#143826] text-base leading-snug font-display line-clamp-1">
          {plant.name}
        </h3>
        <p className="text-xs text-[#667C6A] flex items-center gap-1 mt-0.5 mb-2 font-medium">
          <Droplets className="h-3 w-3 text-[#0284C7]" />
          <span>{plant.moisturePreference || 'Moderate'} moisture</span>
        </p>

        {plant.notes ? (
          <p className="text-xs text-[#4A5D4E] line-clamp-2 italic">
            "{plant.notes}"
          </p>
        ) : (
          <p className="text-xs text-[#667C6A] line-clamp-2">
            Target: {plant.defaultWateringVolume || 450} mL · {plant.minMoisture || 35}% - {plant.maxMoisture || 65}%
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#E6EFE4] flex items-center justify-between text-[11px] font-mono text-[#667C6A]">
        <span>Custom Crop</span>
        <span className="text-[#143826] font-semibold">Ready</span>
      </div>
    </div>
  );
};
