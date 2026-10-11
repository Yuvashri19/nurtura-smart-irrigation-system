import React, { useState, useEffect } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Settings, ToggleLeft, ToggleRight, Gauge, Shield, Sliders, RefreshCw, MapPin, Check, Sun } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    sensors,
    toggleAutoWatering,
    setIsResetModalOpen,
    setIsDiagnosticsOpen,
    latitude,
    updateUserLatitude,
  } = useIrrigation();

  const [latInput, setLatInput] = useState(String(latitude));
  const [latSaved, setLatSaved] = useState(false);
  const [latError, setLatError] = useState<string | null>(null);

  useEffect(() => {
    setLatInput(String(latitude));
  }, [latitude]);

  const handleSaveLatitude = async (e: React.FormEvent) => {
    e.preventDefault();
    setLatError(null);
    const parsed = parseFloat(latInput);
    if (isNaN(parsed) || parsed < -90 || parsed > 90) {
      setLatError('Please enter a valid latitude between -90.0° and +90.0°');
      return;
    }

    try {
      await updateUserLatitude(parsed);
      setLatSaved(true);
      setTimeout(() => setLatSaved(false), 2500);
    } catch (err) {
      setLatError(err instanceof Error ? err.message : 'Could not save latitude');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-[#D1E0CE] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#143826] font-display flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-[#143826]" />
          System Settings & Local Controller Logic
        </h1>
        <p className="text-sm text-[#4A5D4E] mt-1">
          Configure autonomous irrigation rules, flow fault thresholds, and hardware diagnostics.
        </p>
      </div>

      <div className="space-y-4">
        {/* Autonomous Mode Toggle */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-[#143826] font-display">Autonomous Closed-Loop Mode</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB] font-semibold">
                  LOCAL ENGINE
                </span>
              </div>
              <p className="text-xs text-[#4A5D4E] max-w-lg leading-relaxed">
                When enabled, the ESP32 micro-controller automatically starts an irrigation cycle whenever soil capacitance falls below stage threshold, unless rain is sensed.
              </p>
            </div>

            <button
              onClick={toggleAutoWatering}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-mono font-semibold transition-all self-start sm:self-auto cursor-pointer ${
                sensors.autoWateringEnabled
                  ? 'bg-[#143826] text-white border-[#143826] shadow-xs'
                  : 'bg-[#F8FAF6] text-[#4A5D4E] border-[#D1E0CE] hover:bg-white'
              }`}
            >
              {sensors.autoWateringEnabled ? (
                <>
                  <ToggleRight className="h-4 w-4 text-emerald-400" />
                  <span>AUTONOMOUS: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 text-[#8A9B8D]" />
                  <span>MANUAL CONFIRM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Safety & Flow Cutoffs */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-5 w-5 text-[#143826]" />
            <h3 className="text-sm font-bold text-[#143826] font-display">Flow Monitoring & Safety Cutoffs</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#F8FAF6] p-4 rounded-2xl border border-[#D8E6D3]">
              <span className="text-[#667C6A] block mb-1">NOMINAL FLOW RATE</span>
              <span className="text-lg font-bold text-[#143826]">82 mL/min</span>
              <p className="text-[11px] text-[#4A5D4E] mt-1 font-sans">
                Calibrated for silicone drip manifold
              </p>
            </div>

            <div className="bg-[#F8FAF6] p-4 rounded-2xl border border-[#D8E6D3]">
              <span className="text-[#667C6A] block mb-1">LOW-FLOW THRESHOLD</span>
              <span className="text-lg font-bold text-amber-700">25 mL/min</span>
              <p className="text-[11px] text-[#4A5D4E] mt-1 font-sans">
                Triggers visual warning & restricted flow indicator
              </p>
            </div>

            <div className="bg-[#F8FAF6] p-4 rounded-2xl border border-[#D8E6D3]">
              <span className="text-[#667C6A] block mb-1">NO-FLOW AUTO-CUTOFF</span>
              <span className="text-lg font-bold text-rose-700">2.5 Seconds</span>
              <p className="text-[11px] text-[#4A5D4E] mt-1 font-sans">
                Emergency pump cutoff if 0 mL/min sensed
              </p>
            </div>
          </div>
        </div>

        {/* Precipitation Override */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-[#143826] font-display">Precipitation Sensor Policy</h3>
          </div>
          <p className="text-xs text-[#4A5D4E] leading-relaxed mb-4">
            Optical rain sensor pauses automatic watering routines and marks the recommendation state as <strong className="text-indigo-900">Watering Delayed</strong> until soil dry-down occurs.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#667C6A]">Hold Duration: <strong className="text-[#143826]">4 Hours</strong></span>
            <span className="text-[#CFDFCB]">·</span>
            <span className="text-[#667C6A]">Active State: <strong className={sensors.rainDetected ? 'text-indigo-600' : 'text-[#143826]'}>
              {sensors.rainDetected ? 'Rain Detected (Hold Active)' : 'Clear'}
            </strong></span>
          </div>
        </div>

        {/* Garden Location & Atmospheric Calibration (ET₀) */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-[#143826] font-display">
              Garden Location & Solar Geometry (ET₀)
            </h3>
          </div>
          <p className="text-xs text-[#4A5D4E] leading-relaxed mb-4">
            Geographic latitude is used by the Hargreaves-Samani model to calculate daily extraterrestrial solar radiation (Ra) and atmospheric crop evapotranspiration.
          </p>

          <form onSubmit={handleSaveLatitude} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667C6A]">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="11.6640"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#D1E0CE] bg-[#F8FAF6] text-xs font-mono font-semibold text-[#143826] focus:outline-none focus:ring-2 focus:ring-[#143826]/20 focus:border-[#143826]"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono text-[#8A9B8D]">
                °N
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {latSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Calibrated ✓</span>
                </>
              ) : (
                <span>Save Latitude</span>
              )}
            </button>

            <span className="text-[11px] font-mono text-[#667C6A]">
              Default: <strong className="text-[#143826]">11.6640° N</strong>
            </span>
          </form>

          {latError && (
            <p className="text-xs text-rose-600 mt-2 font-mono">{latError}</p>
          )}
        </div>

        {/* Calibration & Diagnostics */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#143826]" />
              <h3 className="text-sm font-bold text-[#143826] font-display">Hardware Diagnostics & Sensor Calibration</h3>
            </div>
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="text-xs font-mono text-[#143826] font-semibold hover:underline cursor-pointer"
            >
              Open Tool Drawer
            </button>
          </div>
          <p className="text-xs text-[#4A5D4E] leading-relaxed mb-4">
            Access the diagnostic drawer to test capacitive soil calibration, simulate line clogs, force rain detection, or reset baseline values.
          </p>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F8FAF6] hover:bg-[#EAEFE8] text-[#143826] border border-[#CFDFCB] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Controller to Factory Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
