import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Droplets, Thermometer, Wind, Sun, CloudRain } from 'lucide-react';

export const SensorMetricCards: React.FC = () => {
  const { sensors, selectedPlant, selectedStage, plantMood } = useIrrigation();
  const currentProfile = selectedPlant.stages[selectedStage];

  const isSoilLow = sensors.soilMoisture < currentProfile.minMoisture;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Soil Capacitance */}
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#667C6A] mb-2 font-mono uppercase">
          <span>Soil Capacitance</span>
          <Droplets className={`h-4 w-4 ${isSoilLow ? 'text-amber-600 animate-pulse' : 'text-[#0284C7]'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
            isSoilLow ? 'text-amber-600' : 'text-[#143826]'
          }`}>
            {sensors.soilMoisture}%
          </span>
          <span className="text-xs text-[#667C6A] font-mono">
            / {currentProfile.minMoisture}% min
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#667C6A]">Target Range:</span>
          <span className="text-[#143826] font-semibold">{currentProfile.minMoisture}%–{currentProfile.maxMoisture}%</span>
        </div>
      </div>

      {/* 2. Temperature */}
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#667C6A] mb-2 font-mono uppercase">
          <span>Ambient Temp</span>
          <Thermometer className="h-4 w-4 text-[#D97706]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#143826] tabular-nums">
            {sensors.temperature.toFixed(1)}
          </span>
          <span className="text-xs text-[#667C6A] font-mono">°C</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#667C6A]">Thermal Band:</span>
          <span className="text-[#143826] font-semibold">Optimal (24–30°C)</span>
        </div>
      </div>

      {/* 3. Relative Humidity */}
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#667C6A] mb-2 font-mono uppercase">
          <span>Relative Humidity</span>
          <Wind className="h-4 w-4 text-[#0284C7]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#143826] tabular-nums">
            {sensors.humidity}
          </span>
          <span className="text-xs text-[#667C6A] font-mono">% RH</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#667C6A]">Vapor Pressure:</span>
          <span className="text-[#143826] font-semibold">1.12 kPa (Ideal)</span>
        </div>
      </div>

      {/* 4. Rain & Photometric Light */}
      <div className="bg-white border border-[#D1E0CE] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#667C6A] mb-2 font-mono uppercase">
          <span>Precipitation & Light</span>
          {sensors.rainDetected ? (
            <CloudRain className="h-4 w-4 text-indigo-600 animate-bounce" />
          ) : (
            <Sun className="h-4 w-4 text-[#D97706]" />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
            sensors.rainDetected ? 'text-indigo-700' : 'text-[#143826]'
          }`}>
            {sensors.rainDetected ? 'Rain Detected' : `${sensors.lightLux} Lux`}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#667C6A]">Rain Hold:</span>
          <span className={`font-semibold ${sensors.rainDetected ? 'text-indigo-600 font-bold' : 'text-[#667C6A]'}`}>
            {sensors.rainDetected ? 'ACTIVE (Hold)' : 'CLEAR'}
          </span>
        </div>
      </div>
    </div>
  );
};
