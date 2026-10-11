import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import {
  Sliders,
  X,
  Droplets,
  CloudRain,
  Play,
  FastForward,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Thermometer,
  Wind,
  Shield,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { FlowCondition, SimulationSpeed } from '../simulator/simulationTypes';

export const SimulatorControlPanel: React.FC = () => {
  const {
    isDiagnosticsOpen,
    setIsDiagnosticsOpen,
    sensors,
    status,
    plantMood,
    isDemoMode,
    selectedPlant,
    selectedStage,
    simulationSpeed,
    setSimulationSpeed,
    flowCondition,
    setFlowCondition,
    presenceDetected,
    setPresenceDetected,
    setSimulatorSoilMoisture,
    setSimulatorTemperature,
    setSimulatorHumidity,
    setSimulatorTargetVolume,
    toggleSimulatorRain,
    startWatering,
    requestStopWatering,
    simulateDrySoil,
    simulateNormalSoil,
    simulateRain,
    clearRain,
    simulateNormalWatering,
    simulateLowFlow,
    simulateNoFlow,
    simulatePresence,
    resetSimulation,
  } = useIrrigation();

  if (!isDiagnosticsOpen) return null;

  const minThreshold = selectedPlant.stages[selectedStage]?.minMoisture ?? 38;

  return (
    <aside
      aria-label="Nurtura Virtual Controller & Sensor Simulator"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white/95 border-l border-[#D1E0CE] shadow-2xl backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-200 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E6EFE4] bg-[#F8FAF6]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#143826] text-white shadow-xs">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-[#143826] uppercase tracking-wider font-mono">
                NURTURA SIMULATOR
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB]">
                DEMO MODE
              </span>
            </div>
            <p className="text-[11px] text-[#667C6A]">Virtual ESP32 + Flow + Capacitance + PIR</p>
          </div>
        </div>

        <button
          onClick={() => setIsDiagnosticsOpen(false)}
          className="p-1.5 text-[#667C6A] hover:text-[#143826] rounded-xl hover:bg-[#EAEFE8] transition-colors cursor-pointer"
          title="Close simulator drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Demo Notice Banner */}
      <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2 flex items-center justify-between text-[11px] font-mono">
        <span className="text-amber-900 font-semibold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          SIMULATED DATA (IN-BROWSER)
        </span>
        <span className="text-amber-800 text-[10px]">No hardware needed</span>
      </div>

      {/* Controls Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 divide-y divide-[#E6EFE4]">
        {/* Speed Multiplier Toolbar */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FastForward className="h-3.5 w-3.5 text-[#143826]" />
              Simulation Speed
            </span>
            <span className="text-[11px] font-mono font-bold text-[#143826]">
              {simulationSpeed}x Speed
            </span>
          </div>
          <p className="text-[11px] text-[#667C6A] mb-2.5">
            Accelerates flow delivery and transitions for fast hackathon demonstrations.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 5, 10] as SimulationSpeed[]).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSimulationSpeed(spd)}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  simulationSpeed === spd
                    ? 'bg-[#143826] text-white shadow-xs'
                    : 'bg-[#F8FAF6] text-[#4A5D4E] border border-[#D8E6D3] hover:border-[#143826]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* 1. Quick One-Click Demonstration Scenarios */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              1-Click Demo Scenarios
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E6EFE4] text-[#143826]">
              30–60s Pitch
            </span>
          </div>
          <p className="text-[11px] text-[#667C6A] mb-3">
            Trigger key hardware states instantly with one click:
          </p>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={simulateNormalWatering}
              className="py-2.5 px-3 rounded-2xl bg-white border border-[#CFDFCB] hover:border-[#143826] hover:bg-[#F8FAF6] text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="text-[10px] text-emerald-700 font-mono font-bold">● Recommended Flow</div>
              <div className="text-xs font-bold text-[#143826]">1. Normal Irrigation</div>
              <div className="text-[10px] text-[#667C6A] mt-0.5">24% → Auto Dosing → 500 mL</div>
            </button>

            <button
              onClick={simulateRain}
              className="py-2.5 px-3 rounded-2xl bg-white border border-[#CFDFCB] hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="text-[10px] text-indigo-700 font-mono font-bold">● Precipitation</div>
              <div className="text-xs font-bold text-[#143826]">2. Rain Postpone</div>
              <div className="text-[10px] text-[#667C6A] mt-0.5">Delay cycle safely</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={simulateLowFlow}
              className="py-2.5 px-3 rounded-2xl bg-white border border-[#CFDFCB] hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="text-[10px] text-amber-700 font-mono font-bold">● Restriction</div>
              <div className="text-xs font-bold text-[#143826]">3. Low Flow Fault</div>
              <div className="text-[10px] text-[#667C6A] mt-0.5">18 mL/m → Safe cutoff</div>
            </button>

            <button
              onClick={simulateNoFlow}
              className="py-2.5 px-3 rounded-2xl bg-white border border-[#CFDFCB] hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="text-[10px] text-rose-700 font-mono font-bold">● Blockage / Dry</div>
              <div className="text-xs font-bold text-[#143826]">4. Zero Flow Fault</div>
              <div className="text-[10px] text-[#667C6A] mt-0.5">0 mL/m → Emergency trip</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={simulatePresence}
              className="py-2 px-3 rounded-xl bg-[#F8FAF6] border border-[#D8E6D3] hover:border-[#143826] text-xs font-semibold text-[#143826] transition-all text-center cursor-pointer"
            >
              Simulate Presence
            </button>

            <button
              onClick={resetSimulation}
              className="py-2 px-3 rounded-xl bg-[#F8FAF6] border border-[#D8E6D3] hover:border-[#143826] text-xs font-semibold text-[#143826] transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* 2. Environmental Sensor Sliders */}
        <div className="pt-5 space-y-4">
          <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-[#0284C7]" />
            Environment Sensor Controls
          </span>

          {/* Soil Moisture Slider */}
          <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D8E6D3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#143826]">Soil Moisture:</span>
              <span className="font-mono font-bold text-sm text-[#0284C7]">{sensors.soilMoisture}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sensors.soilMoisture}
              onChange={(e) => setSimulatorSoilMoisture(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-[#CFDFCB] rounded-lg appearance-none cursor-pointer accent-[#143826]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[#667C6A]">
              <span>Dry (0%)</span>
              <span className="text-[#143826] font-semibold">Threshold: {minThreshold}%</span>
              <span>Saturated (100%)</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={simulateDrySoil}
                className="flex-1 py-1 rounded-lg bg-white border border-[#CFDFCB] text-[10px] font-mono font-semibold text-amber-800 hover:bg-amber-50 cursor-pointer"
              >
                Set Dry (24%)
              </button>
              <button
                type="button"
                onClick={simulateNormalSoil}
                className="flex-1 py-1 rounded-lg bg-white border border-[#CFDFCB] text-[10px] font-mono font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
              >
                Set Normal (55%)
              </button>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D8E6D3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#143826] flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                Ambient Temperature:
              </span>
              <span className="font-mono font-bold text-sm text-[#143826]">{sensors.temperature.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min={15}
              max={45}
              step={0.5}
              value={sensors.temperature}
              onChange={(e) => setSimulatorTemperature(parseFloat(e.target.value) || 28)}
              className="w-full h-2 bg-[#CFDFCB] rounded-lg appearance-none cursor-pointer accent-[#143826]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[#667C6A]">
              <span>15°C</span>
              <span>Default (32°C)</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D8E6D3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#143826] flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-sky-600" />
                Air Humidity:
              </span>
              <span className="font-mono font-bold text-sm text-[#143826]">{sensors.humidity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={95}
              value={sensors.humidity}
              onChange={(e) => setSimulatorHumidity(parseInt(e.target.value) || 50)}
              className="w-full h-2 bg-[#CFDFCB] rounded-lg appearance-none cursor-pointer accent-[#143826]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[#667C6A]">
              <span>20% (Dry)</span>
              <span>Default (58%)</span>
              <span>95% (Humid)</span>
            </div>
          </div>

          {/* Rain Sensor Toggle */}
          <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D8E6D3] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#143826] flex items-center gap-1.5">
                <CloudRain className="h-3.5 w-3.5 text-indigo-600" />
                Precipitation Sensor
              </span>
              <p className="text-[11px] text-[#667C6A]">
                {sensors.rainDetected ? 'Rain active (irrigation hold)' : 'Clear substrate'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSimulatorRain}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                sensors.rainDetected
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                  : 'bg-white text-[#667C6A] border-[#D1E0CE]'
              }`}
            >
              {sensors.rainDetected ? 'RAIN DETECTED' : 'NO RAIN'}
            </button>
          </div>
        </div>

        {/* 3. Irrigation Dosing & Flow Parameters */}
        <div className="pt-5 space-y-4">
          <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-[#143826]" />
            Irrigation & Flow Line Parameters
          </span>

          {/* Target Volume Selector */}
          <div>
            <label className="text-xs text-[#667C6A] block mb-1.5">
              Target Water Dosing (mL):
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[300, 400, 500, 750, 1000].map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => setSimulatorTargetVolume(vol)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    sensors.targetVolume === vol
                      ? 'bg-[#143826] text-white shadow-xs'
                      : 'bg-[#F8FAF6] text-[#4A5D4E] border border-[#D8E6D3] hover:border-[#143826]'
                  }`}
                >
                  {vol}
                </button>
              ))}
            </div>
          </div>

          {/* Flow Condition Selector */}
          <div>
            <label className="text-xs text-[#667C6A] block mb-1.5">
              Flow Rate Hardware Condition:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal' as FlowCondition, label: 'Normal (82 mL)', color: 'text-emerald-700' },
                { id: 'low_flow' as FlowCondition, label: 'Low Flow (18 mL)', color: 'text-amber-700' },
                { id: 'no_flow' as FlowCondition, label: 'No Flow (0 mL)', color: 'text-rose-700' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFlowCondition(item.id)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-mono font-semibold border transition-all text-center cursor-pointer ${
                    flowCondition === item.id
                      ? 'bg-[#143826] text-white border-[#143826] shadow-xs'
                      : 'bg-[#F8FAF6] text-[#4A5D4E] border-[#D8E6D3] hover:border-[#143826]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pump Manual Control Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={startWatering}
              disabled={sensors.pumpActive || status === 'STARTING'}
              className="py-2.5 px-3 rounded-2xl bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start Dosing Cycle</span>
            </button>

            <button
              onClick={requestStopWatering}
              disabled={!sensors.pumpActive}
              className="py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <span>Stop Pump</span>
            </button>
          </div>
        </div>

        {/* 4. Protection & Motion Presence Detection */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#143826] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              Presence & Crop Safety
            </span>
            <span className="text-[10px] font-mono text-[#667C6A]">PIR Motion</span>
          </div>
          <div className="bg-[#F8FAF6] p-3.5 rounded-2xl border border-[#D8E6D3] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#143826]">Presence Sensor:</span>
              <p className="text-[11px] text-[#667C6A]">
                {presenceDetected ? 'Activity detected' : 'Zone clear'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPresenceDetected(!presenceDetected)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                presenceDetected
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-[#667C6A] border-[#D1E0CE]'
              }`}
            >
              {presenceDetected ? 'DETECTED' : 'NORMAL'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Live Telemetry */}
      <div className="p-4 border-t border-[#E6EFE4] bg-[#F8FAF6] text-[11px] font-mono text-[#667C6A] flex items-center justify-between">
        <div>
          STATE: <strong className="text-[#143826]">{status}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span>PUMP: <strong className={sensors.pumpActive ? 'text-emerald-700' : 'text-[#667C6A]'}>{sensors.pumpActive ? 'ON' : 'OFF'}</strong></span>
          <span>FLOW: <strong className="text-[#0284C7]">{sensors.flowRate} mL/m</strong></span>
        </div>
      </div>
    </aside>
  );
};
