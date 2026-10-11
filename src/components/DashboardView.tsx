import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { HeroSection } from './HeroSection';
import { WateringHeroCard } from './WateringHeroCard';
import { SensorMetricCards } from './SensorMetricCards';
import { EvapotranspirationCard } from './EvapotranspirationCard';
import { SensorTrendGraph } from './SensorTrendGraph';
import { OledPreviewCard } from './OledPreviewCard';
import { IrrigationTimeline } from './IrrigationTimeline';
import { ArrowRight, History, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Frown } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { selectedPlant, selectedStage, setCurrentTab, history, sensors, plantMood } = useIrrigation();
  const stageProfile = selectedPlant.stages[selectedStage] || selectedPlant.stages.Vegetative;
  const isCrying = plantMood === 'crying';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Requested Hero Section */}
      <HeroSection />

      {/* 2. Live Telemetry & Control Section */}
      <div id="telemetry-section" className="space-y-6 pt-2">
        {/* Crop Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#D1E0CE] rounded-2xl px-5 py-3.5 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden border border-[#CFDFCB] bg-[#EDF3EB] shrink-0">
              <img
                src={selectedPlant.image}
                alt={selectedPlant.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#143826] text-sm font-display">{selectedPlant.name}</span>
                <span className="text-[#CFDFCB]">·</span>
                <span className="font-mono text-[#143826] font-semibold bg-[#E6EFE4] px-2 py-0.5 rounded-md text-[11px]">
                  {selectedStage} Stage
                </span>
                <span className="text-[#CFDFCB]">·</span>
                <span className={`text-[11px] font-medium flex items-center gap-1 ${
                  isCrying ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {isCrying ? <Frown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {isCrying ? 'Plant is crying (low moisture)' : 'Plant is happy'}
                </span>
              </div>
              <p className="text-[11px] text-[#667C6A] mt-0.5">
                Calibrated Dose: <strong className="text-[#0284C7] font-mono">{sensors.targetVolume} mL</strong> · Recommended Moisture: <strong className="text-[#143826] font-mono">{stageProfile.minMoisture}% - {stageProfile.maxMoisture}%</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('plant')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143826] hover:underline transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Change Crop / Calibrate Stage</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Primary Watering State Card */}
        <WateringHeroCard />

        {/* Sensor Metric Cards */}
        <SensorMetricCards />

        {/* Reference Evapotranspiration (ET₀) Hargreaves-Samani Intelligence Card */}
        <EvapotranspirationCard />

        {/* Trend Graph + OLED Module */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <SensorTrendGraph />
          </div>
          <div className="lg:col-span-1">
            <OledPreviewCard />
          </div>
        </div>

        {/* Bottom: Timeline + History Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <IrrigationTimeline />

          {/* Recent History Quick Summary */}
          <div className="rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EFE4] mb-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#143826]" />
                <h3 className="text-sm font-bold text-[#143826] font-display">Recent Irrigation Cycles</h3>
              </div>
              <button
                onClick={() => setCurrentTab('history')}
                className="text-xs font-mono text-[#143826] font-semibold hover:underline cursor-pointer"
              >
                Full Log ({history.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3] text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    {item.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />}
                    {item.status === 'interrupted' && <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />}
                    {item.status === 'fault' && <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />}
                    <div>
                      <span className="text-[#143826] font-bold">{item.timestamp}</span>
                      <span className="text-[#667C6A] ml-2">({item.plantName})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#0284C7] font-semibold">{item.waterDelivered} mL</span>
                    <span className="text-[#8A9B8D]">{item.durationMinutes}m</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'complete'
                          ? 'bg-[#E6EFE4] text-[#143826]'
                          : item.status === 'interrupted'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E6EFE4] flex items-center justify-between text-xs text-[#667C6A]">
              <span>Hardware closed-loop feedback</span>
              <button
                onClick={() => setCurrentTab('history')}
                className="text-[#143826] hover:underline font-semibold cursor-pointer"
              >
                View all records →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
