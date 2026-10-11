import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import {
  ArrowDown,
  Info,
  Droplets,
  Cpu,
  ShieldCheck,
  Check,
  Heart,
  Frown,
  Sparkles,
  Zap,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const {
    sensors,
    plantMood,
    selectedPlant,
    selectedStage,
    startWatering,
    setIsArchitectureModalOpen,
    setCurrentTab,
    status,
  } = useIrrigation();

  const isCrying = plantMood === 'crying';
  const isPumping = sensors.pumpActive;

  const scrollToTelemetry = () => {
    const el = document.getElementById('telemetry-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentTab('dashboard');
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#F2F7F0] via-[#F8FAF6] to-[#F8FAF6] border border-[#D8E6D3] p-6 sm:p-10 lg:p-14 mb-8 shadow-sm">
      {/* Soft organic ambient shapes */}
      <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-[#E3EFE0]/60 rounded-full blur-[100px] pointer-events-none -z-0" />
      <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-[#E9F3E6]/70 rounded-full blur-[80px] pointer-events-none -z-0" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Editorial & Value Proposition */}
        <div className="lg:col-span-6 space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EFE2] border border-[#CFDFCB] text-xs font-mono font-medium tracking-wider text-[#143826] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#143826]" />
            SMART IRRIGATION / LOCAL INTELLIGENCE
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#143826] font-display leading-[1.12]">
            Smart Irrigation for Compact Gardens.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-[#334237] leading-relaxed max-w-xl font-sans">
            Nurtura senses your plant's environment, delivers the required amount of water, and verifies every irrigation cycle — completely locally.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={scrollToTelemetry}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#143826] hover:bg-[#0E281B] text-[#F8FAF6] font-medium text-sm transition-all shadow-md shadow-[#143826]/10 active:scale-98 cursor-pointer"
            >
              <span>Explore Nurtura</span>
              <ArrowDown className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-[#F2F6F0] text-[#143826] border border-[#CFDFCB] font-medium text-sm transition-all shadow-xs cursor-pointer"
            >
              <Info className="h-4 w-4 text-[#143826]" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Small Feature Labels Under Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-mono text-[#4A5D4E]">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#143826]" />
              <span className="font-semibold text-[#143826]">100% Local</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0284C7]" />
              <span className="font-semibold text-[#143826]">Flow-Based Dosing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
              <span className="font-semibold text-[#143826]">Fault Detection</span>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Visual Balcony Planter with Floating Cards & Plant Mood */}
        <div className="lg:col-span-6 relative">
          <div className="relative mx-auto max-w-lg rounded-3xl bg-white/80 p-3 sm:p-4 border border-[#D8E6D3] shadow-lg shadow-[#143826]/5 backdrop-blur-sm">
            {/* Visual planter showcase */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EDF3EB] border border-[#CFDFCB]">
              <img
                src="/src/assets/images/balcony_smart_planter_1790407831287.jpg"
                alt="Nurtura Balcony Smart Planter System"
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  isCrying ? 'saturate-90 brightness-95' : 'saturate-105 brightness-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#143826]/40 via-transparent to-transparent pointer-events-none" />

              {/* Plant Mood Avatar / Emotional reaction banner */}
              <div className="absolute top-3 left-3 z-20">
                {isCrying ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-amber-300 text-amber-900 shadow-md backdrop-blur-md animate-bounce">
                    <div className="relative flex items-center justify-center">
                      <Frown className="h-4 w-4 text-amber-600" />
                      {/* Animated tear drops */}
                      <span className="absolute -bottom-2 right-0 h-1.5 w-1.5 rounded-full bg-cyan-500 animate-tear-drop" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold leading-none">Plant is Crying</p>
                      <p className="text-[9px] text-amber-700 font-mono mt-0.5">Soil is dry ({sensors.soilMoisture}%)</p>
                    </div>
                    {status !== 'WATERING' && (
                      <button
                        onClick={startWatering}
                        className="ml-1 px-2 py-0.5 rounded-md bg-[#143826] text-white text-[10px] font-semibold hover:bg-black transition-colors"
                      >
                        Water
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-emerald-300 text-[#143826] shadow-md backdrop-blur-md animate-happy-bloom">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold leading-none">Plant is Happy & Thriving</p>
                      <p className="text-[9px] text-[#334237] font-mono mt-0.5">Hydration nominal</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Callout Badges on the Planter */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-white/90">
                <span className="px-2 py-0.5 rounded bg-[#143826]/75 backdrop-blur-xs border border-white/20">
                  ESP32 Controller + Micro OLED
                </span>
                <span className="px-2 py-0.5 rounded bg-[#143826]/75 backdrop-blur-xs border border-white/20">
                  Stainless Soil Probe
                </span>
                <span className="px-2 py-0.5 rounded bg-[#143826]/75 backdrop-blur-xs border border-white/20">
                  Silicone Drip Emitter
                </span>
              </div>
            </div>

            {/* Subtle Floating Data Cards around the plant */}

            {/* CARD 1: SOIL 42% */}
            <div className="absolute -top-4 -left-4 sm:-left-6 z-20 animate-float-slow">
              <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-[#CFDFCB] shadow-lg shadow-[#143826]/8 backdrop-blur-md min-w-[105px]">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#4A5D4E] mb-1">
                  <span>SOIL</span>
                  <Droplets className={`h-3 w-3 ${isCrying ? 'text-amber-500' : 'text-[#0284C7]'}`} />
                </div>
                <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
                  isCrying ? 'text-amber-600' : 'text-[#143826]'
                }`}>
                  {sensors.soilMoisture}%
                </div>
                <div className="text-[9px] font-mono text-[#667C6A] mt-0.5">
                  {isCrying ? 'Needs water' : 'Optimal level'}
                </div>
              </div>
            </div>

            {/* CARD 2: TEMP 28.4°C */}
            <div className="absolute -bottom-4 -left-3 sm:-left-4 z-20 animate-float-delay">
              <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-[#CFDFCB] shadow-lg shadow-[#143826]/8 backdrop-blur-md min-w-[105px]">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#4A5D4E] mb-1">
                  <span>TEMP</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#143826] tracking-tight">
                  {sensors.temperature.toFixed(1)}°C
                </div>
                <div className="text-[9px] font-mono text-[#667C6A] mt-0.5">
                  Ambient room
                </div>
              </div>
            </div>

            {/* CARD 3: WATER 500 mL */}
            <div className="absolute -top-3 -right-3 sm:-right-5 z-20 animate-float-slow">
              <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-[#CFDFCB] shadow-lg shadow-[#143826]/8 backdrop-blur-md min-w-[110px]">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#4A5D4E] mb-1">
                  <span>WATER</span>
                  <Zap className={`h-3 w-3 ${isPumping ? 'text-cyan-500 fill-cyan-500' : 'text-[#4A5D4E]'}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#0284C7] tracking-tight">
                  {sensors.pumpActive ? `${sensors.deliveredVolume} mL` : `${sensors.targetVolume} mL`}
                </div>
                <div className="text-[9px] font-mono text-[#667C6A] mt-0.5">
                  {sensors.pumpActive ? 'Delivering...' : 'Target dose'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
