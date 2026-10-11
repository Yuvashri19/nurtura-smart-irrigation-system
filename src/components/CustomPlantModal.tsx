import React, { useState, useEffect } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Plant, CustomPlantInput, PlantCategory, MoisturePreference, GrowthStage } from '../types/irrigation';
import {
  PLANT_CATEGORIES,
  MOISTURE_PREFERENCES,
  CATEGORY_ICONS,
  getDefaultMoistureTargets,
} from '../lib/plantCategoryDefaults';
import { X, Sprout, ChevronDown, ChevronUp, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface CustomPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantToEdit?: Plant | null;
  onSuccess?: (createdPlant: Plant) => void;
}

const GROWTH_STAGES: GrowthStage[] = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature'];

export const CustomPlantModal: React.FC<CustomPlantModalProps> = ({
  isOpen,
  onClose,
  plantToEdit,
  onSuccess,
}) => {
  const { addCustomPlant, updateCustomPlant } = useIrrigation();

  const isEditing = Boolean(plantToEdit);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlantCategory>('Flower');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('Vegetative');
  const [moisturePreference, setMoisturePreference] = useState<MoisturePreference>('Moderate');
  const [notes, setNotes] = useState('');

  // Advanced Collapsible Settings
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [minMoisture, setMinMoisture] = useState<string>('');
  const [targetMoisture, setTargetMoisture] = useState<string>('');
  const [maxMoisture, setMaxMoisture] = useState<string>('');
  const [defaultWateringVolume, setDefaultWateringVolume] = useState<string>('');
  const [kc, setKc] = useState<string>('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset or pre-populate values when modal opens or target plant changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSaving(false);

      if (plantToEdit) {
        setName(plantToEdit.name);
        setCategory(plantToEdit.category || 'Other');
        setMoisturePreference(plantToEdit.moisturePreference || 'Moderate');
        setNotes(plantToEdit.notes || '');

        const stage = Object.keys(plantToEdit.stages)[1] as GrowthStage || 'Vegetative';
        setGrowthStage(stage);

        const currentProfile = plantToEdit.stages[stage];
        setMinMoisture(
          plantToEdit.minMoisture !== undefined ? String(plantToEdit.minMoisture) : String(currentProfile.minMoisture)
        );
        setTargetMoisture(
          plantToEdit.targetMoisture !== undefined ? String(plantToEdit.targetMoisture) : '50'
        );
        setMaxMoisture(
          plantToEdit.maxMoisture !== undefined ? String(plantToEdit.maxMoisture) : String(currentProfile.maxMoisture)
        );
        setDefaultWateringVolume(
          plantToEdit.defaultWateringVolume !== undefined
            ? String(plantToEdit.defaultWateringVolume)
            : String(currentProfile.targetWaterMl)
        );
        setKc(plantToEdit.kc !== undefined && plantToEdit.kc !== null ? String(plantToEdit.kc) : '');

        // If any custom advanced value was previously set, open advanced panel
        if (plantToEdit.minMoisture !== undefined || plantToEdit.kc !== undefined) {
          setIsAdvancedOpen(true);
        } else {
          setIsAdvancedOpen(false);
        }
      } else {
        setName('');
        setCategory('Flower');
        setGrowthStage('Vegetative');
        setMoisturePreference('Moderate');
        setNotes('');

        const defaults = getDefaultMoistureTargets('Flower', 'Moderate');
        setMinMoisture(String(defaults.minMoisture));
        setTargetMoisture(String(defaults.targetMoisture));
        setMaxMoisture(String(defaults.maxMoisture));
        setDefaultWateringVolume(String(defaults.defaultWateringVolume));
        setKc('');
        setIsAdvancedOpen(false);
      }
    }
  }, [isOpen, plantToEdit]);

  // When category or preference changes in "Add" mode, update advanced placeholder defaults automatically
  const handlePreferenceChange = (newPref: MoisturePreference) => {
    setMoisturePreference(newPref);
    if (!isEditing) {
      const defaults = getDefaultMoistureTargets(category, newPref);
      setMinMoisture(String(defaults.minMoisture));
      setTargetMoisture(String(defaults.targetMoisture));
      setMaxMoisture(String(defaults.maxMoisture));
      setDefaultWateringVolume(String(defaults.defaultWateringVolume));
    }
  };

  const handleCategoryChange = (newCat: PlantCategory) => {
    setCategory(newCat);
    if (!isEditing) {
      const defaults = getDefaultMoistureTargets(newCat, moisturePreference);
      setMinMoisture(String(defaults.minMoisture));
      setTargetMoisture(String(defaults.targetMoisture));
      setMaxMoisture(String(defaults.maxMoisture));
      setDefaultWateringVolume(String(defaults.defaultWateringVolume));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a valid plant name.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMsg('Plant name should be under 50 characters.');
      return;
    }

    // Advanced numeric validations
    let parsedMin = minMoisture.trim() ? Number(minMoisture) : undefined;
    let parsedTarget = targetMoisture.trim() ? Number(targetMoisture) : undefined;
    let parsedMax = maxMoisture.trim() ? Number(maxMoisture) : undefined;
    let parsedVol = defaultWateringVolume.trim() ? Number(defaultWateringVolume) : undefined;
    let parsedKc = kc.trim() ? Number(kc) : null;

    if (parsedMin !== undefined) {
      if (isNaN(parsedMin) || parsedMin < 0 || parsedMin > 100) {
        setErrorMsg('Minimum soil moisture must be a percentage between 0% and 100%.');
        return;
      }
    }

    if (parsedMax !== undefined) {
      if (isNaN(parsedMax) || parsedMax < 0 || parsedMax > 100) {
        setErrorMsg('Maximum soil moisture must be a percentage between 0% and 100%.');
        return;
      }
    }

    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin >= parsedMax) {
      setErrorMsg('Minimum moisture percentage must be lower than maximum moisture.');
      return;
    }

    if (parsedVol !== undefined) {
      if (isNaN(parsedVol) || parsedVol <= 0 || parsedVol > 5000) {
        setErrorMsg('Watering volume must be between 10 mL and 5,000 mL.');
        return;
      }
    }

    if (parsedKc !== null && parsedKc !== undefined) {
      if (isNaN(parsedKc) || parsedKc < 0 || parsedKc > 5) {
        setErrorMsg('Crop Coefficient (Kc) must be a numeric value between 0.0 and 5.0.');
        return;
      }
    }

    setSaving(true);

    const plantPayload: CustomPlantInput = {
      name: trimmedName,
      category,
      growthStage,
      moisturePreference,
      notes: notes.trim() || undefined,
      minMoisture: parsedMin,
      targetMoisture: parsedTarget,
      maxMoisture: parsedMax,
      defaultWateringVolume: parsedVol,
      kc: parsedKc,
    };

    try {
      if (isEditing && plantToEdit) {
        const updated = await updateCustomPlant(plantToEdit.id, plantPayload);
        setSaving(false);
        onClose();
        if (onSuccess && updated) onSuccess(updated);
      } else {
        const created = await addCustomPlant(plantPayload);
        setSaving(false);
        onClose();
        if (onSuccess && created) onSuccess(created);
      }
    } catch (err) {
      console.error('Error saving custom plant:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Could not save plant. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#143826]/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-7 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 p-1.5 text-[#667C6A] hover:text-[#143826] rounded-xl hover:bg-[#F2F6F0] transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2 shrink-0">
          <div className="h-10 w-10 rounded-2xl bg-[#E6EFE4] text-[#143826] flex items-center justify-center text-xl shrink-0">
            {CATEGORY_ICONS[category] || '🌱'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#143826] font-display">
              {isEditing ? 'Edit Plant Profile' : 'Add Your Plant'}
            </h3>
            <p className="text-xs text-[#667C6A]">
              Tell Nurtura a little about your plant so we can personalize irrigation.
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 mt-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 py-2">
          {/* Plant Name */}
          <div>
            <label className="block text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono mb-1.5">
              Plant Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rose, Jasmine, Curry Leaf, Aloe Vera"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-sm text-[#143826] placeholder-[#8A9B8D] focus:outline-none focus:ring-2 focus:ring-[#143826]/20 focus:border-[#143826] transition-all"
            />
          </div>

          {/* Category & Moisture Preference in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono mb-1.5">
                Plant Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PlantCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-sm text-[#143826] focus:outline-none focus:ring-2 focus:ring-[#143826]/20 focus:border-[#143826] transition-all cursor-pointer"
              >
                {PLANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono mb-1.5">
                Preferred Soil Moisture <span className="text-rose-600">*</span>
              </label>
              <select
                value={moisturePreference}
                onChange={(e) => handlePreferenceChange(e.target.value as MoisturePreference)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-sm text-[#143826] focus:outline-none focus:ring-2 focus:ring-[#143826]/20 focus:border-[#143826] transition-all cursor-pointer"
              >
                {MOISTURE_PREFERENCES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref === 'Low' && '💧 Low (Dry loving / succulents)'}
                    {pref === 'Moderate' && '💧💧 Moderate (Most garden plants)'}
                    {pref === 'High' && '💧💧💧 High (Heavy hydration)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Growth Stage */}
          <div>
            <label className="block text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono mb-1.5">
              Current Growth Stage <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {GROWTH_STAGES.map((stg) => {
                const isSelected = growthStage === stg;
                return (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setGrowthStage(stg)}
                    className={`py-2 px-1 text-xs rounded-xl font-medium transition-all text-center border cursor-pointer ${
                      isSelected
                        ? 'bg-[#143826] text-white border-[#143826] shadow-xs'
                        : 'bg-[#F8FAF6] text-[#4A5D4E] border-[#D1E0CE] hover:bg-white'
                    }`}
                  >
                    {stg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono mb-1.5">
              Care Notes <span className="text-[10px] text-[#667C6A] lowercase font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Keep near east balcony sunlight, sensitive to over-watering."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-sm text-[#143826] placeholder-[#8A9B8D] focus:outline-none focus:ring-2 focus:ring-[#143826]/20 focus:border-[#143826] transition-all resize-none"
            />
          </div>

          {/* Advanced Plant Settings (Collapsible) */}
          <div className="rounded-2xl border border-[#E0ECE0] bg-[#F8FAF6] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#143826] hover:bg-[#EFF5EE] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#2A6E4E]" />
                Advanced Plant Settings
              </span>
              <span className="flex items-center gap-1 text-[11px] font-normal text-[#667C6A]">
                {isAdvancedOpen ? 'Hide' : 'Configure'}
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {isAdvancedOpen && (
              <div className="p-4 pt-1 border-t border-[#E0ECE0] space-y-3 bg-white/70">
                <p className="text-[11px] text-[#667C6A] leading-relaxed">
                  Optional threshold parameters. Defaults are automatically provided based on your selected category and moisture preference.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-[#4A5D4E] uppercase mb-1">
                      Min Moisture (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minMoisture}
                      onChange={(e) => setMinMoisture(e.target.value)}
                      placeholder="35"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1E0CE] bg-white text-xs font-mono text-[#143826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-[#4A5D4E] uppercase mb-1">
                      Target Moisture (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={targetMoisture}
                      onChange={(e) => setTargetMoisture(e.target.value)}
                      placeholder="50"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1E0CE] bg-white text-xs font-mono text-[#143826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-[#4A5D4E] uppercase mb-1">
                      Max Moisture (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={maxMoisture}
                      onChange={(e) => setMaxMoisture(e.target.value)}
                      placeholder="65"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1E0CE] bg-white text-xs font-mono text-[#143826]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-[#4A5D4E] uppercase mb-1">
                      Default Volume (mL)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      step={50}
                      value={defaultWateringVolume}
                      onChange={(e) => setDefaultWateringVolume(e.target.value)}
                      placeholder="450"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1E0CE] bg-white text-xs font-mono text-[#143826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-[#4A5D4E] uppercase mb-1">
                      Crop Coefficient (Kc)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.05}
                      value={kc}
                      onChange={(e) => setKc(e.target.value)}
                      placeholder="Not configured"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1E0CE] bg-white text-xs font-mono text-[#143826]"
                    />
                    <span className="text-[9px] text-[#8A9B8D]">Leave blank for automatic default</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-[#334237] text-xs font-semibold hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sprout className="h-3.5 w-3.5" />
                  <span>{isEditing ? 'Save Changes' : 'Save Plant'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
