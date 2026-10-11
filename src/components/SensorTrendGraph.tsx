import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { TrendingUp, X, Droplets } from 'lucide-react';

export const SensorTrendGraph: React.FC = () => {
  const {
    graphPoints,
    selectedPlant,
    selectedStage,
    sensors,
    selectedGraphEvent,
    setSelectedGraphEvent,
  } = useIrrigation();

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const minMoisture =
    selectedPlant.stages[selectedStage]?.minMoisture ??
    selectedPlant.stages.Vegetative?.minMoisture ??
    38;

  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 24;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxY = 80;
  const minY = 10;

  const getYCoord = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingY + chartHeight - ((clamped - minY) / (maxY - minY)) * chartHeight;
  };

  const getXCoord = (index: number, total: number) => {
    if (total <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (total - 1)) * chartWidth;
  };

  const points = graphPoints.map((pt, i) => ({
    x: getXCoord(i, graphPoints.length),
    y: getYCoord(pt.soilMoisture),
    pt,
  }));

  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`
    : '';

  const thresholdY = getYCoord(minMoisture);

  return (
    <div className="relative rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E6EFE4]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#143826]" />
            <h3 className="text-sm font-bold text-[#143826] font-display">Soil Moisture & Irrigation Events</h3>
          </div>
          <p className="text-xs text-[#667C6A] mt-0.5">
            Real-time substrate capacitance. Click on markers (●) for cycle diagnostics.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#143826]">
            <span className="h-2 w-2 rounded-full bg-[#143826]" />
            <span>Moisture %</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="h-0.5 w-3 border-t border-dashed border-amber-600" />
            <span>Threshold ({minMoisture}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#0284C7]">
            <span className="h-2.5 w-2.5 rounded-full border border-[#0284C7] bg-[#E0F2FE] flex items-center justify-center text-[8px] font-bold">
              💧
            </span>
            <span>Cycle Event</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="natureMoistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#143826" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#143826" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[20, 40, 60].map((level) => {
            const y = getYCoord(level);
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#EAEFE8"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#8A9B8D"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Threshold Dashed Line */}
          <line
            x1={paddingX}
            y1={thresholdY}
            x2={width - paddingX}
            y2={thresholdY}
            stroke="#D97706"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#natureMoistureGradient)" />

          {/* Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#143826"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data points */}
          {points.map((p, i) => {
            const hasEvent = !!p.pt.event;
            const isHovered = hoveredPointIndex === i;

            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hasEvent ? 7 : isHovered ? 5 : 3.5}
                  fill={hasEvent ? '#0284C7' : '#143826'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className={hasEvent ? 'cursor-pointer hover:scale-125 transition-transform' : ''}
                  onClick={() => {
                    if (p.pt.event) {
                      setSelectedGraphEvent(p.pt.event);
                    }
                  }}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />

                {hasEvent && (
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedGraphEvent(p.pt.event!)}
                  >
                    <line
                      x1={p.x}
                      y1={p.y - 8}
                      x2={p.x}
                      y2={p.y - 18}
                      stroke="#0284C7"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y - 18}
                      r="3.5"
                      fill="#0284C7"
                    />
                  </g>
                )}

                <text
                  x={p.x}
                  y={height - 4}
                  textAnchor="middle"
                  fill="#8A9B8D"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.pt.timeLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pump State Band below graph */}
      <div className="mt-3 pt-3 border-t border-[#E6EFE4]">
        <div className="flex items-center justify-between text-xs font-mono text-[#667C6A] mb-1.5">
          <span className="uppercase font-semibold">Pump Actuation Track</span>
          <span className={sensors.pumpActive ? 'text-[#0284C7] font-bold' : 'text-[#8A9B8D]'}>
            Current: {sensors.pumpActive ? 'Pump ON' : 'Pump OFF'}
          </span>
        </div>

        <div className="relative h-6 w-full rounded-xl bg-[#F8FAF6] border border-[#D1E0CE] flex items-center overflow-hidden font-mono text-[10px]">
          <div className="flex-1 h-full flex items-center justify-center text-[#8A9B8D]">
            ──────── Pump OFF ────────
          </div>
          <div className="w-16 h-full flex items-center justify-center bg-[#E0F2FE] text-[#0284C7] border-x border-[#BAE6FD] font-bold">
            ██ ON ██
          </div>
          <div className="flex-1 h-full flex items-center justify-center text-[#8A9B8D]">
            ────── Pump OFF ──────
          </div>
          <div className="w-14 h-full flex items-center justify-center bg-[#E0F2FE] text-[#0284C7] border-x border-[#BAE6FD] font-bold">
            ██ ON ██
          </div>
          <div className={`h-full flex items-center justify-center transition-all ${
            sensors.pumpActive
              ? 'w-24 bg-[#0284C7] text-white font-bold animate-pulse'
              : 'flex-1 text-[#8A9B8D]'
          }`}>
            {sensors.pumpActive ? '██ PUMP ON ██' : '──── Pump OFF ────'}
          </div>
        </div>
      </div>

      {/* Diagnostics Modal Popup */}
      {selectedGraphEvent && (
        <div className="absolute inset-0 z-30 bg-[#143826]/30 backdrop-blur-xs rounded-3xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#D1E0CE] rounded-2xl p-5 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedGraphEvent(null)}
              className="absolute top-4 right-4 p-1 text-[#667C6A] hover:text-[#143826] rounded-md transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#143826]">Irrigation Diagnostics</h4>
                <p className="text-xs font-mono text-[#667C6A]">{selectedGraphEvent.timestamp}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#F8FAF6] p-3 rounded-xl border border-[#D8E6D3] mb-4">
              <div className="flex justify-between">
                <span className="text-[#667C6A]">Water Delivered:</span>
                <span className="text-[#0284C7] font-bold">{selectedGraphEvent.waterDelivered} mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667C6A]">Target Volume:</span>
                <span className="text-[#143826]">{selectedGraphEvent.targetVolume} mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667C6A]">Duration:</span>
                <span className="text-[#143826]">{selectedGraphEvent.durationMinutes} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#667C6A]">Result:</span>
                <span className="font-bold text-emerald-700">
                  {selectedGraphEvent.statusLabel}
                </span>
              </div>
            </div>

            {selectedGraphEvent.notes && (
              <p className="text-xs text-[#4A5D4E] italic mb-4">
                "{selectedGraphEvent.notes}"
              </p>
            )}

            <button
              onClick={() => setSelectedGraphEvent(null)}
              className="w-full py-2 bg-[#143826] hover:bg-[#0E281B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
