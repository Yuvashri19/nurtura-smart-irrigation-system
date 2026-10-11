import React, { useState, useEffect, useCallback } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { PlantAreaItem } from '../types/irrigation';
import {
  Sprout,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sun,
  Info,
  Loader2,
  Check,
} from 'lucide-react';

interface SetupWizardProps {
  onComplete?: () => void;
  isModal?: boolean;
}

export type LocationAcquisitionStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const {
    completeGardenSetup,
    saveAcquiredLocation,
    gardenSetup,
    plantAreas: existingPlantAreas,
    addAlert,
  } = useIrrigation();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 1: Number of plants
  const [plantCount, setPlantCount] = useState<number>(() => {
    return gardenSetup?.plantCount && gardenSetup.plantCount > 0 ? gardenSetup.plantCount : 6;
  });

  // Step 2: Plant Areas
  const [plantAreas, setPlantAreas] = useState<PlantAreaItem[]>(() => {
    const initialCount = gardenSetup?.plantCount && gardenSetup.plantCount > 0 ? gardenSetup.plantCount : 6;
    return Array.from({ length: initialCount }, (_, idx) => {
      const existing = existingPlantAreas.find((p) => p.id === `plant${idx + 1}`);
      return {
        id: `plant${idx + 1}`,
        name: `Plant ${idx + 1}`,
        areaM2: existing?.areaM2 ?? 0.25,
      };
    });
  });

  // Step 3: Location Acquisition State
  // Initial state MUST be 'idle' (never pre-filled as denied or error)
  const [locationStatus, setLocationStatus] = useState<LocationAcquisitionStatus>('idle');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);

  // When plant count changes, synchronize plant areas list
  const handlePlantCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(30, Math.floor(newCount)));
    setPlantCount(count);

    setPlantAreas((prev) => {
      const updated: PlantAreaItem[] = [];
      for (let i = 0; i < count; i++) {
        const id = `plant${i + 1}`;
        const existing = prev.find((p) => p.id === id);
        updated.push({
          id,
          name: existing?.name || `Plant ${i + 1}`,
          areaM2: existing?.areaM2 ?? 0.25,
        });
      }
      return updated;
    });
  };

  const handleAreaChange = (plantId: string, value: number) => {
    setPlantAreas((prev) =>
      prev.map((item) => (item.id === plantId ? { ...item, areaM2: Math.max(0.01, Number(value.toFixed(3))) } : item))
    );
  };

  const applyUniformArea = (uniformValue: number) => {
    setPlantAreas((prev) => prev.map((item) => ({ ...item, areaM2: uniformValue })));
    addAlert('Areas Updated', `All ${plantAreas.length} plants set to ${uniformValue} m².`, 'info');
  };

  // Step 3: Request REAL browser geolocation when user clicks "Use My Location"
  const handleRequestLocation = useCallback(() => {
    setLocationErrorMessage(null);
    setValidationError(null);

    // Browser Geolocation API support check
    if (typeof navigator === 'undefined' || !('geolocation' in navigator) || !navigator.geolocation) {
      setLocationStatus('unavailable');
      setLocationErrorMessage('Your location could not be determined.');
      return;
    }

    // Set requesting state
    setLocationStatus('requesting');

    // Trigger real native browser geolocation permission prompt
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const rawLat = position.coords.latitude;
        const rawLng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy || 10);

        if (
          typeof rawLat === 'number' &&
          typeof rawLng === 'number' &&
          !isNaN(rawLat) &&
          !isNaN(rawLng) &&
          rawLat >= -90 &&
          rawLat <= 90 &&
          rawLng >= -180 &&
          rawLng <= 180
        ) {
          const cleanLat = Number(rawLat.toFixed(4));
          const cleanLng = Number(rawLng.toFixed(4));
          setLatitude(cleanLat);
          setLongitude(cleanLng);
          setLocationAccuracy(acc);
          setLocationStatus('success');
          setLocationErrorMessage(null);

          // Save actual coordinates to existing Firebase user setup structure
          saveAcquiredLocation({
            latitude: cleanLat,
            longitude: cleanLng,
            plantCount,
          }).catch((err) => {
            console.warn('Firebase setup location save note:', err);
          });
        } else {
          setLocationStatus('error');
          setLocationErrorMessage('Unable to obtain location.');
        }
      },
      (error: GeolocationPositionError) => {
        console.warn('Browser geolocation error:', error.code, error.message);

        // Required error code mapping
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationErrorMessage(
            'Please allow location access for this site in your browser settings and click Try Again.'
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus('unavailable');
          setLocationErrorMessage('Your location could not be determined.');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('timeout');
          setLocationErrorMessage('Location request timed out.');
        } else {
          setLocationStatus('error');
          setLocationErrorMessage('Unable to obtain location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, [plantCount, saveAcquiredLocation]);

  // Final submission to Firebase
  const handleSubmitSetup = async () => {
    setValidationError(null);

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      setValidationError('Installation location must be acquired before completing setup.');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setValidationError('Invalid geographical coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      await completeGardenSetup({
        plantCount,
        plantAreas,
        latitude,
        longitude,
        locationSource: 'browser_geolocation',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to complete garden setup in Firebase:', err);
      setValidationError('Failed to save setup parameters. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalArea = plantAreas.reduce((sum, p) => sum + (p.areaM2 || 0), 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#143826]/5 overflow-hidden">
        {/* Header & Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6EFE4]">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] flex items-center justify-center shrink-0">
              <Sprout className="h-6 w-6 text-[#143826]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-[#143826] uppercase">
                  TERRAFLUX SETUP
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E6EFE4] text-[#143826]">
                  ONBOARDING
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#143826] font-display">
                Configure Your Smart Garden
              </h2>
            </div>
          </div>

          {/* Step Progress Indicators (Interactive Navigation) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { num: 1, label: 'Plants' },
              { num: 2, label: 'Areas' },
              { num: 3, label: 'Location' },
            ].map(({ num, label }) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setCurrentStep(num as 1 | 2 | 3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentStep === num
                    ? 'bg-[#143826] text-white shadow-xs'
                    : currentStep > num
                    ? 'bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB] hover:bg-[#D5E6D2]'
                    : 'bg-[#F8FAF6] text-[#667C6A] border border-[#D8E6D3] hover:border-[#143826] hover:text-[#143826]'
                }`}
                title={`Go to Step ${num}: ${label}`}
              >
                <span>{num}</span>
                <span className="text-[11px] font-medium hidden sm:inline">{label}</span>
                {currentStep > num && <Check className="h-3.5 w-3.5 ml-0.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          {/* ============================================================ */}
          {/* STEP 1: NUMBER OF PLANTS */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-[#667C6A] uppercase tracking-wider block mb-1">
                  Step 1 of 3 · Plant Inventory
                </span>
                <h3 className="text-2xl font-bold text-[#143826] font-display mb-2">
                  Let's set up your TerraFlux garden
                </h3>
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  How many plants are you growing? TerraFlux configures individualized root-zone water monitoring and flow distribution for every specimen.
                </p>
              </div>

              {/* Number Input / Stepper Card */}
              <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <label className="text-xs font-mono font-semibold text-[#667C6A] uppercase tracking-wider mb-4">
                  Number of Plants in Garden
                </label>

                <div className="flex items-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handlePlantCountChange(plantCount - 1)}
                    disabled={plantCount <= 1}
                    className="h-12 w-12 rounded-2xl bg-white border border-[#D1E0CE] text-[#143826] hover:bg-[#E6EFE4] disabled:opacity-40 disabled:hover:bg-white text-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="Decrease plant count"
                  >
                    −
                  </button>

                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={plantCount}
                      onChange={(e) => handlePlantCountChange(parseInt(e.target.value) || 1)}
                      className="w-28 text-center text-4xl font-bold font-display text-[#143826] bg-white border border-[#CFDFCB] rounded-2xl py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#143826]"
                    />
                    <span className="block text-[11px] font-mono text-[#667C6A] mt-1">
                      {plantCount === 1 ? 'Plant' : 'Plants'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlantCountChange(plantCount + 1)}
                    disabled={plantCount >= 30}
                    className="h-12 w-12 rounded-2xl bg-white border border-[#D1E0CE] text-[#143826] hover:bg-[#E6EFE4] disabled:opacity-40 disabled:hover:bg-white text-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="Increase plant count"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-[#667C6A] mr-1">Quick presets:</span>
                  {[1, 3, 6, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePlantCountChange(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                        plantCount === num
                          ? 'bg-[#143826] text-white'
                          : 'bg-white text-[#4A5D4E] border border-[#D8E6D3] hover:border-[#143826]'
                      }`}
                    >
                      {num} {num === 1 ? 'Plant' : 'Plants'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative Note */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#E6EFE4]/60 border border-[#CFDFCB] text-xs text-[#143826]">
                <Info className="h-5 w-5 text-[#143826] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  You can adjust your plant count and add custom species later at any time from your garden settings.
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E6EFE4]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-mono font-medium text-[#4A5D4E] hover:text-[#143826] underline cursor-pointer"
                >
                  Direct to Step 3: Location →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#143826] hover:bg-[#0E281B] text-white text-sm font-semibold transition-all cursor-pointer shadow-md shadow-[#143826]/10"
                >
                  <span>Step 2: Area for Each Plant</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: AREA FOR EACH PLANT */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-[#667C6A] uppercase tracking-wider block mb-1">
                  Step 2 of 3 · Cultivation Geometry
                </span>
                <h3 className="text-2xl font-bold text-[#143826] font-display mb-2">
                  Area for each plant
                </h3>
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  Enter the effective growing/root-zone area (m²) associated with each of your {plantCount} plants.
                </p>
              </div>

              {/* Quick Batch Toolbar & Quick Jump to Step 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
                <div className="text-xs">
                  <span className="font-semibold text-[#143826]">Apply uniform area to all plants:</span>
                  <p className="text-[11px] text-[#667C6A]">Useful if all your pots or containers are identical.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: '0.15 m² (Pot)', val: 0.15 },
                    { label: '0.25 m² (Standard)', val: 0.25 },
                    { label: '0.50 m² (Bed)', val: 0.5 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => applyUniformArea(preset.val)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#CFDFCB] text-[11px] font-mono text-[#143826] hover:bg-[#E6EFE4] transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Step 3: Location</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamically Generated Plant Area Inputs */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {plantAreas.map((plant, index) => (
                  <div
                    key={plant.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#D8E6D3] hover:border-[#143826] transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        P{index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#143826] font-display">
                          Plant {index + 1}
                        </span>
                        <span className="block text-[11px] text-[#667C6A] font-mono">
                          ID: {plant.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-mono text-[#667C6A]">Growing area:</span>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="20"
                          value={plant.areaM2}
                          onChange={(e) => handleAreaChange(plant.id, parseFloat(e.target.value) || 0.05)}
                          className="w-24 px-3 py-1.5 text-right font-mono font-bold text-sm text-[#143826] bg-[#F8FAF6] border border-[#CFDFCB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#143826]"
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#143826]">m²</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Aggregate Summary */}
              <div className="p-4 rounded-2xl bg-[#E6EFE4]/60 border border-[#CFDFCB] flex items-center justify-between text-xs font-mono">
                <span className="text-[#143826] font-semibold">Total Cultivation Surface:</span>
                <span className="text-sm font-bold text-[#143826]">
                  {totalArea.toFixed(2)} m² across {plantAreas.length} plants
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E6EFE4]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F8FAF6] hover:bg-white text-[#4A5D4E] hover:text-[#143826] border border-[#D8E6D3] text-xs font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Plants</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#143826] hover:bg-[#0E281B] text-white text-sm font-semibold transition-all cursor-pointer shadow-md shadow-[#143826]/10"
                >
                  <span>Step 3: Installation Location</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: INSTALLATION LOCATION */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-[#667C6A] uppercase tracking-wider block mb-1">
                  Step 3 of 3 · Environmental Calibrator
                </span>
                <h3 className="text-2xl font-bold text-[#143826] font-display mb-2">
                  Set your TerraFlux installation location
                </h3>
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  TerraFlux uses your garden's actual coordinates to calculate location-based environmental demand.
                </p>
              </div>

              {/* Explanatory Context Box */}
              <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#143826] font-display">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Why Location is Required</span>
                </div>
                <div className="text-xs text-[#4A5D4E] leading-relaxed font-sans space-y-2">
                  <p>
                    TerraFlux uses your garden's exact geographic coordinates and the day of year to determine extraterrestrial solar radiation (Ra) and Hargreaves–Samani reference evapotranspiration (ET₀).
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-[#D8E6D3] font-mono text-[11px] text-[#143826] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">●</span>
                      <span>Latitude + Day of Year → Extraterrestrial Radiation (Ra)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">●</span>
                      <span>Ra + Diurnal Temperature → Hargreaves-Samani Reference ET₀</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">●</span>
                      <span>ET₀ + Plant Area (m²) → Root-Zone Water Replenishment Target</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geolocation Card */}
              <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs space-y-5">
                {/* 1. INITIAL / IDLE STATE (Not requested yet) */}
                {locationStatus === 'idle' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3] text-xs text-[#4A5D4E] leading-relaxed">
                      <p className="font-semibold text-[#143826] mb-1">
                        Location helps TerraFlux calculate location-based environmental demand.
                      </p>
                      <p className="text-[#667C6A]">
                        Click the button below to allow your browser to provide your geographic coordinates.
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-md shadow-[#143826]/10"
                      >
                        <Compass className="h-4 w-4 text-emerald-400" />
                        <span>[ Use My Location ]</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. REQUESTING STATE */}
                {locationStatus === 'requesting' && (
                  <div className="p-6 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3] flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="h-7 w-7 text-[#143826] animate-spin" />
                    <div>
                      <p className="text-xs font-mono font-bold text-[#143826] uppercase tracking-wider">
                        Requesting location permission...
                      </p>
                      <p className="text-xs text-[#667C6A] mt-1">
                        Please select <strong>Allow</strong> in your browser's native location permission dialog.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E6EFE4] text-[#667C6A] border border-[#CFDFCB] text-xs font-mono cursor-not-allowed opacity-80"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>[ Getting Your Location... ]</span>
                    </button>
                  </div>
                )}

                {/* 3. SUCCESS STATE */}
                {locationStatus === 'success' && latitude !== null && longitude !== null && (
                  <div className="p-5 rounded-2xl bg-[#E6EFE4]/80 border border-[#CFDFCB] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#143826]">
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                        <span className="text-xs font-bold font-display uppercase tracking-wider">
                          Location acquired
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#143826] border border-[#CFDFCB]">
                        BROWSER GEOLOCATION
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="bg-white p-3 rounded-xl border border-[#D8E6D3]">
                        <span className="text-[#667C6A] block text-[10px] uppercase">Latitude</span>
                        <span className="text-base font-bold text-[#143826]">
                          {latitude.toFixed(4)}°
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#D8E6D3]">
                        <span className="text-[#667C6A] block text-[10px] uppercase">Longitude</span>
                        <span className="text-base font-bold text-[#143826]">
                          {longitude.toFixed(4)}°
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#D8E6D3] col-span-2 sm:col-span-1">
                        <span className="text-[#667C6A] block text-[10px] uppercase">Accuracy</span>
                        <span className="text-base font-bold text-[#143826]">
                          {locationAccuracy ? `±${locationAccuracy} m` : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#143826] font-medium">
                      Your garden location has been successfully acquired.
                    </p>
                  </div>
                )}

                {/* 4. DENIED STATE */}
                {locationStatus === 'denied' && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-950">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950">Location permission was denied.</p>
                        <p className="leading-relaxed text-amber-900">
                          Please allow location access for this site in your browser settings and click Try Again.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800">
                        Check your browser address bar permissions icon to unblock.
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-semibold hover:bg-amber-100 transition-colors text-xs cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>[ Try Again ]</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. UNAVAILABLE STATE */}
                {locationStatus === 'unavailable' && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-950">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950">Your location could not be determined.</p>
                        <p className="leading-relaxed text-amber-900">
                          {locationErrorMessage || 'Please verify device location services and try again.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-semibold hover:bg-amber-100 transition-colors text-xs cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>[ Try Again ]</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. TIMEOUT STATE */}
                {locationStatus === 'timeout' && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-950">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950">Location request timed out.</p>
                        <p className="leading-relaxed text-amber-900">
                          {locationErrorMessage || 'Location request timed out. Please try again.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-semibold hover:bg-amber-100 transition-colors text-xs cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>[ Try Again ]</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. UNKNOWN / ERROR STATE */}
                {locationStatus === 'error' && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-950">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950">Unable to obtain location.</p>
                        <p className="leading-relaxed text-amber-900">
                          {locationErrorMessage || 'Please try again.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-semibold hover:bg-amber-100 transition-colors text-xs cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>[ Try Again ]</span>
                      </button>
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {validationError}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E6EFE4]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F8FAF6] hover:bg-white text-[#4A5D4E] hover:text-[#143826] border border-[#D8E6D3] text-xs font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Plant Areas</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitSetup}
                  disabled={submitting || locationStatus !== 'success' || latitude === null || longitude === null}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#143826] hover:bg-[#0E281B] disabled:opacity-40 disabled:hover:bg-[#143826] text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-[#143826]/15"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                      <span>Saving Garden Setup...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup & Launch Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
