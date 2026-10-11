import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { PLANTS } from '../data/plantData';
import { Plant, GrowthStage } from '../types/irrigation';
import { Check, ArrowRight, Sprout, Sparkles, Frown, Plus } from 'lucide-react';
import { CustomPlantCard } from './CustomPlantCard';
import { CustomPlantModal } from './CustomPlantModal';
import { DeletePlantModal } from './DeletePlantModal';
import { PlantSuccessModal } from './PlantSuccessModal';

const GROWTH_STAGES: GrowthStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature'];

export const PlantSelectionView: React.FC = () => {
  const {
    selectedPlant,
    selectedStage,
    setSelectedPlant,
    setSelectedStage,
    setCurrentTab,
    sensors,
    plantMood,
    customPlants,
    deleteCustomPlant,
  } = useIrrigation();

  // Custom plant modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);
  const [successPlant, setSuccessPlant] = useState<Plant | null>(null);

  const currentProfile = selectedPlant.stages[selectedStage] || selectedPlant.stages.Vegetative;
  const isCrying = plantMood === 'crying';

  const handleCustomPlantCreated = (newPlant: Plant) => {
    setSuccessPlant(newPlant);
  };

  const handleUseCreatedPlant = () => {
    if (successPlant) {
      setSelectedPlant(successPlant);
      setSuccessPlant(null);
      setCurrentTab('dashboard');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingPlant) {
      await deleteCustomPlant(deletingPlant.id);
      setDeletingPlant(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D1E0CE] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#143826] font-display flex items-center gap-2.5">
            <Sprout className="h-6 w-6 text-[#143826]" />
            Plant Species & Growth Stage
          </h1>
          <p className="text-sm text-[#4A5D4E] mt-1">
            Calibrate moisture tolerance thresholds, target dosing volumes, and empathetic hydration responses for your garden crop.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('dashboard')}
          className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-[#143826] hover:bg-[#0E281B] text-white font-medium text-sm rounded-2xl transition-colors shadow-xs cursor-pointer"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 1. Nurtura Plants Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono">
              Nurtura Plants
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E6EFE4] text-[#143826] font-semibold border border-[#CFDFCB]">
              Predefined Profiles
            </span>
          </div>
          <span className="text-xs text-[#667C6A]">
            Current: <strong className="text-[#143826]">{selectedPlant.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANTS.map((plant) => {
            const isSelected = selectedPlant.id === plant.id;
            return (
              <div
                key={plant.id}
                onClick={() => setSelectedPlant(plant)}
                className={`relative group rounded-3xl p-4 cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-white border-[#143826] shadow-md shadow-[#143826]/8 ring-1 ring-[#143826]'
                    : 'bg-white/70 border-[#D1E0CE] hover:border-[#143826]/40 hover:bg-white'
                }`}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#143826] text-white shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Plant image with smooth scale on select */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#EDF3EB] mb-3 border border-[#CFDFCB]">
                  <img
                    src={plant.image}
                    alt={plant.name}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-transform duration-300 ${
                      isSelected ? 'scale-108' : 'scale-100 group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#143826]/30 via-transparent to-transparent" />
                </div>

                <h3 className="font-bold text-[#143826] text-base leading-snug font-display">
                  {plant.name}
                </h3>
                <p className="text-xs text-[#667C6A] italic mb-2">
                  {plant.scientificName}
                </p>
                <p className="text-xs text-[#4A5D4E] line-clamp-2">
                  {plant.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. My Plants Section (User Custom Plants + Add Card) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono">
              My Plants
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E6EFE4] text-[#143826] font-semibold border border-[#CFDFCB]">
              {customPlants.length} Custom {customPlants.length === 1 ? 'Crop' : 'Crops'}
            </span>
          </div>
          <span className="text-xs text-[#667C6A]">
            Personalized irrigation profiles saved to your account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Custom plants list */}
          {customPlants.map((plant) => (
            <CustomPlantCard
              key={plant.id}
              plant={plant}
              isSelected={selectedPlant.id === plant.id}
              onSelect={() => setSelectedPlant(plant)}
              onEdit={() => setEditingPlant(plant)}
              onDelete={() => setDeletingPlant(plant)}
            />
          ))}

          {/* + Add My Plant Card */}
          <div
            onClick={() => setIsAddModalOpen(true)}
            className="group relative rounded-3xl p-5 border-2 border-dashed border-[#CFDFCB] hover:border-[#143826] bg-[#F4F8F3]/60 hover:bg-white transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center min-h-[260px] shadow-xs"
          >
            <div className="h-14 w-14 rounded-2xl bg-[#E6EFE4] group-hover:bg-[#143826] text-[#143826] group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
              <Plus className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
            </div>

            <h3 className="font-bold text-[#143826] text-base font-display">
              Add My Plant
            </h3>
            <p className="text-xs text-[#667C6A] mt-1 max-w-[200px] leading-relaxed">
              Add a plant that isn't in the list
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D1E0CE] group-hover:border-[#143826] text-[11px] font-medium text-[#143826] shadow-2xs transition-colors">
              <Sprout className="h-3.5 w-3.5 text-[#2A6E4E]" />
              <span>Personalize Hydration</span>
            </span>
          </div>
        </div>
      </div>

      {/* Growth Stage Selector */}
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono">
              3. Growth Stage Calibrator
            </h2>
            <p className="text-xs text-[#667C6A]">
              Stage dynamically recalibrates hydration targets and min/max soil capacitance for <strong className="text-[#143826]">{selectedPlant.name}</strong>.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] font-semibold self-start sm:self-auto">
            Active: {selectedStage}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {GROWTH_STAGES.map((stage, idx) => {
            const isStageActive = selectedStage === stage;
            const stageTarget = selectedPlant.stages[stage]?.targetWaterMl ?? 500;
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isStageActive
                    ? 'bg-[#143826] text-white border-[#143826] shadow-xs'
                    : 'bg-[#F8FAF6] border-[#D1E0CE] text-[#334237] hover:bg-white hover:border-[#143826]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono ${isStageActive ? 'text-[#A3C4AC]' : 'text-[#8A9B8D]'}`}>
                    0{idx + 1}
                  </span>
                  {isStageActive && <Check className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className={`text-sm font-semibold ${isStageActive ? 'text-white' : 'text-[#143826]'}`}>
                  {stage}
                </div>
                <div className={`text-[11px] font-mono mt-1 ${isStageActive ? 'text-[#D1E5D6]' : 'text-[#667C6A]'}`}>
                  {stageTarget} mL
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications & Plant Emotion Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="text-xs font-mono text-[#667C6A] uppercase mb-2">Stage Specification</div>
          <h4 className="text-base font-bold text-[#143826] mb-1 font-display">
            {selectedPlant.name} ({selectedStage})
          </h4>
          <p className="text-xs text-[#334237] leading-relaxed">
            {currentProfile.description}
          </p>
          {selectedPlant.kc !== undefined && selectedPlant.kc !== null && (
            <div className="mt-3 pt-2 border-t border-[#E6EFE4] text-[11px] font-mono text-[#4A5D4E]">
              Kc Coefficient: <strong className="text-[#143826]">{selectedPlant.kc}</strong>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="text-xs font-mono text-[#667C6A] uppercase mb-2">Moisture Target Band</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-[#143826]">
              {currentProfile.minMoisture}% – {currentProfile.maxMoisture}%
            </span>
          </div>
          <div className="mt-2 text-xs">
            {isCrying ? (
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <Frown className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Moisture low ({sensors.soilMoisture}%). Plant is crying for water!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Moisture balanced ({sensors.soilMoisture}%). Plant is happy!</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="text-xs font-mono text-[#667C6A] uppercase mb-2">Calibrated Water Delivery</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-[#0284C7]">
              {currentProfile.targetWaterMl} mL
            </span>
            <span className="text-xs text-[#667C6A]">per cycle</span>
          </div>
          <p className="text-xs text-[#4A5D4E]">
            Meters at nominal <strong className="text-[#143826]">82 mL/min</strong> (~{Math.round(currentProfile.targetWaterMl / 82)} min run time).
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="flex items-center justify-end pt-4 border-t border-[#D1E0CE]">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#143826] hover:bg-[#0E281B] text-white font-medium text-sm rounded-2xl transition-all shadow-sm cursor-pointer"
        >
          <span>Continue with {selectedPlant.name}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Modals for Custom Plant workflows */}
      <CustomPlantModal
        isOpen={isAddModalOpen || Boolean(editingPlant)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPlant(null);
        }}
        plantToEdit={editingPlant}
        onSuccess={handleCustomPlantCreated}
      />

      <DeletePlantModal
        isOpen={Boolean(deletingPlant)}
        plant={deletingPlant}
        onClose={() => setDeletingPlant(null)}
        onConfirm={handleDeleteConfirm}
      />

      <PlantSuccessModal
        isOpen={Boolean(successPlant)}
        plant={successPlant}
        onUseNow={handleUseCreatedPlant}
        onLater={() => setSuccessPlant(null)}
      />
    </div>
  );
};
