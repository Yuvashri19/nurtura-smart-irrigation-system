import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Monitor } from 'lucide-react';

export const OledPreviewCard: React.FC = () => {
  const { sensors, status } = useIrrigation();

  const getSystemStatusWord = () => {
    switch (status) {
      case 'WATERING':
        return 'PUMPING';
      case 'STARTING':
        return 'INIT';
      case 'WATERING_RECOMMENDED':
        return 'NEEDS_H2O';
      case 'COMPLETED':
        return 'VERIFIED';
      case 'FAULT':
        return 'ERR_FLOW';
      case 'INTERRUPTED':
        return 'HALTED';
      case 'WATERING_DELAYED':
        return 'RAIN_HOLD';
      case 'IDLE':
      default:
        return 'OK';
    }
  };

  return (
    <div className="rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6EFE4] mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-[#143826]" />
          <h3 className="text-sm font-bold text-[#143826] font-display">Controller Display</h3>
        </div>
        <span className="text-[10px] font-mono text-[#667C6A] tracking-wider uppercase">
          0.96" I2C OLED
        </span>
      </div>

      {/* Miniature OLED Screen Housing */}
      <div className="relative my-auto rounded-2xl bg-[#0F1E15] p-4 border border-[#143826]/40 shadow-inner font-mono text-xs select-none overflow-hidden">
        {/* Subtle scanline */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)',
          }}
        />

        <div className="relative z-10 space-y-1.5 text-emerald-400 font-mono tracking-wider">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1 text-emerald-300">
            <span className="font-bold">NURTURA</span>
            <span className="text-[10px]">{sensors.autoWateringEnabled ? 'AUTO' : 'MAN'}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-emerald-600">Soil:</span>
            <span className="font-bold text-white tabular-nums">{sensors.soilMoisture}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-600">Temp:</span>
            <span className="font-bold text-white tabular-nums">{sensors.temperature.toFixed(1)} C</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-600">Hum :</span>
            <span className="font-bold text-white tabular-nums">{sensors.humidity}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-600">Pump:</span>
            <span className={`font-bold ${sensors.pumpActive ? 'text-sky-300 animate-pulse' : 'text-emerald-600'}`}>
              {sensors.pumpActive ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-600">Water:</span>
            <span className="font-bold text-sky-300 tabular-nums">
              {sensors.pumpActive ? `${sensors.deliveredVolume}mL` : `${sensors.targetVolume}mL`}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-emerald-500/30 pt-1 text-xs">
            <span className="text-[10px] text-emerald-600">STATUS:</span>
            <span
              className={`font-bold uppercase tracking-wider ${
                status === 'FAULT'
                  ? 'text-rose-400 animate-pulse'
                  : status === 'WATERING'
                  ? 'text-sky-300 animate-pulse'
                  : 'text-emerald-300'
              }`}
            >
              {getSystemStatusWord()}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[#667C6A] text-center mt-3 font-mono">
        Hardware mirror on ESP32 Node 01
      </div>
    </div>
  );
};
