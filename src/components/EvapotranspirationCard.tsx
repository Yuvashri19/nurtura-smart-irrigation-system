import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Sun, Info, ChevronDown, ChevronUp, MapPin, Calculator, Thermometer, Sparkles } from 'lucide-react';

export const EvapotranspirationCard: React.FC = () => {
  const { todayET, latitude, isDemoMode, setCurrentTab } = useIrrigation();
  const [isCalculationsOpen, setIsCalculationsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isDemo = isDemoMode || todayET.isDemo;

  return (
    <div className="rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs relative overflow-hidden transition-all duration-200">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6EFE4]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F0F7FB] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0">
            <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#143826] font-display">
                Reference Evapotranspiration
              </h3>

              {/* Info Icon & Tooltip */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="p-1 text-[#667C6A] hover:text-[#143826] transition-colors rounded-lg cursor-pointer"
                  title="What is ET₀?"
                >
                  <Info className="h-4 w-4" />
                </button>

                {showTooltip && (
                  <div className="absolute left-0 bottom-full mb-2 z-30 w-72 p-3 bg-[#143826] text-white text-xs rounded-2xl shadow-xl leading-relaxed animate-in fade-in">
                    <p className="font-sans">
                      ET₀ estimates atmospheric water demand using temperature, date and location.
                    </p>
                    <div className="absolute left-4 top-full w-2 h-2 -mt-1 bg-[#143826] rotate-45" />
                  </div>
                )}
              </div>

              {/* Demo Badge */}
              {isDemo && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  DEMO DATA
                </span>
              )}
            </div>

            <p className="text-xs text-[#667C6A] mt-0.5">
              Atmospheric evaporative demand based on solar geometry & diurnal temperatures.
            </p>
          </div>
        </div>

        {/* Location / Latitude Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCurrentTab('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAF6] hover:bg-[#EFF5EE] border border-[#D1E0CE] text-xs font-mono text-[#334237] transition-colors cursor-pointer"
            title="Configure garden coordinates in Settings"
          >
            <MapPin className="h-3.5 w-3.5 text-[#2A6E4E]" />
            <span>{latitude.toFixed(2)}° N</span>
          </button>
        </div>
      </div>

      {/* Primary ET₀ Display */}
      <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Big ET₀ Highlight */}
        <div className="md:col-span-1 bg-[#F0F7FB]/70 border border-[#BAE6FD] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-[#0284C7] font-semibold">
            <span>DAILY DEMAND (ET₀)</span>
            <span className="text-[11px] font-sans text-[#667C6A]">FAO-56 Standard</span>
          </div>

          <div className="my-2">
            {todayET.isValid ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0284C7] font-mono tracking-tight">
                  {todayET.ET0.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-[#4A5D4E] font-mono">mm/day</span>
              </div>
            ) : (
              <div className="py-1">
                <span className="text-lg font-bold text-amber-800 font-display">
                  {todayET.statusMessage || 'Collecting temperature data'}
                </span>
                <p className="text-xs text-[#667C6A] mt-1 leading-snug">
                  DHT22 is logging diurnal cycle to identify daily minimum and maximum temperatures.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#4A5D4E] flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>Atmospheric water loss estimate</span>
          </div>
        </div>

        {/* 4 Sensor & Astronomical Factors Grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tmax */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <div className="text-[10px] font-mono text-[#667C6A] uppercase mb-1">Tmax</div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#143826]">
              {todayET.isValid ? `${todayET.Tmax.toFixed(1)}°C` : '—'}
            </div>
            <div className="text-[10px] text-[#8A9B8D] mt-0.5">Peak daytime</div>
          </div>

          {/* Tmin */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <div className="text-[10px] font-mono text-[#667C6A] uppercase mb-1">Tmin</div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#143826]">
              {todayET.isValid ? `${todayET.Tmin.toFixed(1)}°C` : '—'}
            </div>
            <div className="text-[10px] text-[#8A9B8D] mt-0.5">Overnight low</div>
          </div>

          {/* Tmean */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <div className="text-[10px] font-mono text-[#667C6A] uppercase mb-1">Tmean</div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#143826]">
              {todayET.isValid ? `${todayET.Tmean.toFixed(1)}°C` : '—'}
            </div>
            <div className="text-[10px] text-[#8A9B8D] mt-0.5">(Tmax + Tmin) / 2</div>
          </div>

          {/* Ra */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3]">
            <div className="text-[10px] font-mono text-[#667C6A] uppercase mb-1">Solar Ra</div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#143826]">
              {todayET.isValid ? `${todayET.Ra.toFixed(1)}` : '—'}
            </div>
            <div className="text-[10px] text-[#8A9B8D] mt-0.5">MJ/m²/day</div>
          </div>
        </div>
      </div>

      {/* Collapsible Technical Details Section */}
      <div className="pt-2 border-t border-[#E6EFE4]">
        <button
          type="button"
          onClick={() => setIsCalculationsOpen(!isCalculationsOpen)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#143826] hover:text-[#0E281B] transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-[#2A6E4E]" />
            <span>How is this calculated?</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-normal text-[#667C6A] group-hover:text-[#143826]">
            {isCalculationsOpen ? 'Hide formula' : 'View Hargreaves-Samani formulation'}
            {isCalculationsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {isCalculationsOpen && (
          <div className="mt-3 p-4 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3] text-xs space-y-3 animate-in fade-in duration-150">
            <div>
              <div className="font-bold text-[#143826] uppercase font-mono text-[11px] mb-1">
                Hargreaves-Samani Equation
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#CFDFCB] font-mono text-xs sm:text-sm font-semibold text-[#143826] overflow-x-auto shadow-2xs">
                ET₀ = 0.0023 × Ra × (Tmean + 17.8) × √(Tmax − Tmin)
              </div>
            </div>

            <div className="space-y-1.5 text-[#4A5D4E]">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#143826] shrink-0">• Tmax</span>
                <span>= highest recorded daily temperature (°C)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#143826] shrink-0">• Tmin</span>
                <span>= lowest recorded daily temperature (°C)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#143826] shrink-0">• Tmean</span>
                <span>= average of Tmax and Tmin: (Tmax + Tmin) / 2 (°C)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#143826] shrink-0">• Ra</span>
                <span>= extraterrestrial radiation calculated from date and latitude (MJ/m²/day)</span>
              </div>
            </div>

            <p className="text-[11px] text-[#667C6A] pt-1 border-t border-[#E0ECE0] leading-relaxed">
              Note: This initial stage calculates and displays reference atmospheric water demand (ET₀). It is not connected directly to the pump yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
