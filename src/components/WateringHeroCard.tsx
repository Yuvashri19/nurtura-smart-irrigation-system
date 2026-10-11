import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import {
  CheckCircle2,
  Droplets,
  AlertTriangle,
  CloudRain,
  Play,
  Square,
  Zap,
  Gauge,
  Activity,
  Loader2,
  AlertCircle,
  Frown,
  Sparkles,
} from 'lucide-react';

export const WateringHeroCard: React.FC = () => {
  const {
    status,
    statusReason,
    sensors,
    plantMood,
    selectedPlant,
    selectedStage,
    startWatering,
    requestStopWatering,
  } = useIrrigation();

  const progressPercent = Math.min(
    100,
    Math.round((sensors.deliveredVolume / sensors.targetVolume) * 100)
  );

  const isCrying = plantMood === 'crying';
  const isPumping = sensors.pumpActive;
  const isStarting = status === 'STARTING';

  // Status configuration helper
  const getStatusBadge = () => {
    switch (status) {
      case 'IDLE':
        return {
          title: '✓ Watering Not Required',
          bg: 'bg-[#E6EFE4] border-[#CFDFCB] text-[#143826]',
          icon: <CheckCircle2 className="h-5 w-5 text-[#143826] shrink-0" />,
          stateTag: 'NOMINAL / OPTIMAL',
        };
      case 'WATERING_RECOMMENDED':
        return {
          title: '💧 Watering Recommended',
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <Droplets className="h-5 w-5 text-amber-600 shrink-0 animate-bounce" />,
          stateTag: 'MOISTURE DEPLETED',
        };
      case 'STARTING':
        return {
          title: '⚙ Preparing Irrigation...',
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <Loader2 className="h-5 w-5 text-amber-600 animate-spin shrink-0" />,
          stateTag: 'INITIALIZING',
        };
      case 'WATERING':
        return {
          title: '🚿 Watering In Progress',
          bg: 'bg-[#E0F2FE] border-sky-300 text-sky-900 shadow-sm',
          icon: <Droplets className="h-5 w-5 text-[#0284C7] shrink-0 animate-pulse" />,
          stateTag: 'ACTIVE DOSING',
        };
      case 'COMPLETED':
        return {
          title: '✓ Watering Complete',
          bg: 'bg-[#E6EFE4] border-[#CFDFCB] text-[#143826]',
          icon: <CheckCircle2 className="h-5 w-5 text-[#143826] shrink-0" />,
          stateTag: 'CYCLE VERIFIED',
        };
      case 'INTERRUPTED':
        return {
          title: '⚠ Watering Interrupted',
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
          stateTag: 'MANUAL STOP',
        };
      case 'FAULT':
        return {
          title: '⚠ No Water Flow Detected',
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
          stateTag: 'LINE FAULT',
        };
      case 'WATERING_DELAYED':
        return {
          title: '☔ Watering Delayed',
          bg: 'bg-indigo-50 border-indigo-300 text-indigo-900',
          icon: <CloudRain className="h-5 w-5 text-indigo-600 shrink-0" />,
          stateTag: 'RAIN HOLD',
        };
      default:
        return {
          title: 'System Ready',
          bg: 'bg-neutral-100 text-neutral-800',
          icon: <Activity className="h-5 w-5 text-neutral-600" />,
          stateTag: 'STANDBY',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D1E0CE] bg-white p-6 sm:p-8 shadow-sm transition-all">
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6EFE4]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="text-xs font-mono text-[#667C6A] uppercase tracking-wider">
              Target Crop: <strong className="text-[#143826]">{selectedPlant.name}</strong> ({selectedStage})
            </span>
            <span className="text-[#CFDFCB]">·</span>
            <span className="text-xs font-mono text-[#667C6A]">
              Target: <strong className="text-[#0284C7]">{sensors.targetVolume} mL</strong>
            </span>
          </div>

          {/* Primary State Display Title & Plant Mood Avatar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border font-semibold text-base sm:text-lg ${badge.bg}`}>
              {badge.icon}
              <span className="font-display">{badge.title}</span>
            </div>

            {/* Plant Mood Reaction Badge */}
            {isCrying ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-medium animate-pulse">
                <Frown className="h-3.5 w-3.5 text-amber-700" />
                <span>Plant is crying (thirsty)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Plant is happy & hydrated</span>
              </div>
            )}
          </div>

          <p className="text-sm text-[#334237] mt-2.5 max-w-2xl leading-relaxed font-sans">
            {statusReason}
          </p>
        </div>

        {/* Start / Stop Button */}
        <div className="self-start sm:self-center shrink-0">
          {isPumping || isStarting ? (
            <button
              onClick={requestStopWatering}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop Watering</span>
            </button>
          ) : (
            <button
              onClick={startWatering}
              disabled={status === 'WATERING_DELAYED'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-sm transition-all cursor-pointer shadow-sm active:scale-98 bg-[#143826] hover:bg-[#0E281B] text-[#F8FAF6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Watering</span>
            </button>
          )}
        </div>
      </div>

      {/* Fault Banner if Low Flow */}
      {sensors.lowFlowActive && isPumping && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Low Flow Detected:</strong> Water delivery rate is restricted (18 mL/min vs 82 mL/min nominal).
            </span>
          </div>
          <span className="font-mono text-amber-700 font-semibold">RESTRICTED</span>
        </div>
      )}

      {/* Middle Grid: Telemetry Cards */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pump Status Card */}
        <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#667C6A] mb-1 font-mono uppercase">
            <span>Pump</span>
            <Zap className={`h-3.5 w-3.5 ${isPumping ? 'text-[#0284C7]' : 'text-[#8A9B8D]'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono tracking-tight ${isPumping ? 'text-[#0284C7]' : 'text-[#143826]'}`}>
              {isPumping ? 'ON' : 'OFF'}
            </span>
            {isPumping && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0284C7]" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#667C6A] mt-1 font-mono">
            {isPumping ? '12V DC Solenoid Active' : 'Circuit Standby'}
          </p>
        </div>

        {/* Water Delivered Card */}
        <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#667C6A] mb-1 font-mono uppercase">
            <span>Water Delivered</span>
            <Droplets className="h-3.5 w-3.5 text-[#0284C7]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#143826] tabular-nums">
              {sensors.deliveredVolume}
            </span>
            <span className="text-xs font-mono text-[#667C6A]">/ {sensors.targetVolume} mL</span>
          </div>
          <p className="text-[11px] text-[#667C6A] mt-1 font-mono">
            {progressPercent}% Complete
          </p>
        </div>

        {/* Current Flow Rate */}
        <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#667C6A] mb-1 font-mono uppercase">
            <span>Flow Rate</span>
            <Gauge className="h-3.5 w-3.5 text-[#143826]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono tabular-nums ${
              sensors.flowRate === 0 && isPumping
                ? 'text-rose-600'
                : sensors.flowRate < 30 && isPumping
                ? 'text-amber-600'
                : 'text-[#143826]'
            }`}>
              {sensors.flowRate}
            </span>
            <span className="text-xs font-mono text-[#667C6A]">mL/min</span>
          </div>
          <p className="text-[11px] text-[#667C6A] mt-1 font-mono">
            {sensors.flowRate === 82 ? 'Nominal Flow' : sensors.flowRate > 0 ? 'Restricted' : '0 mL/min'}
          </p>
        </div>

        {/* Autonomous Mode */}
        <div className="bg-[#F8FAF6] border border-[#D8E6D3] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#667C6A] mb-1 font-mono uppercase">
            <span>Mode</span>
            <Activity className="h-3.5 w-3.5 text-[#143826]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#143826]">
            {sensors.autoWateringEnabled ? 'AUTONOMOUS' : 'MANUAL'}
          </div>
          <p className="text-[11px] text-[#667C6A] mt-1 font-mono">
            {sensors.autoWateringEnabled ? 'Local threshold logic' : 'User confirmed'}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-6 pt-5 border-t border-[#E6EFE4]">
        <div className="flex items-center justify-between text-xs font-mono text-[#4A5D4E] mb-2">
          <span>Cycle Progress</span>
          <span className="font-semibold text-[#143826]">{progressPercent}%</span>
        </div>

        <div className="relative h-2.5 w-full rounded-full bg-[#EAEFE8] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isPumping
                ? 'bg-gradient-to-r from-[#0284C7] to-emerald-600'
                : status === 'COMPLETED'
                ? 'bg-[#143826]'
                : 'bg-[#667C6A]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
