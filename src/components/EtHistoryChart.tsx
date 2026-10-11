import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { DailyETRecord } from '../types/irrigation';
import { Sun, Calendar, TrendingUp, Sparkles } from 'lucide-react';

export const EtHistoryChart: React.FC = () => {
  const { etHistory, todayET, isDemoMode } = useIrrigation();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Combine historical records with today's record if not already present
  const allRecords = React.useMemo(() => {
    const list = [...etHistory];
    if (todayET.isValid) {
      const exists = list.some((r) => r.date === todayET.date);
      if (!exists) {
        list.push({
          ...todayET,
          id: `today-${todayET.date}`,
        });
      }
    }
    // Sort chronologically
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [etHistory, todayET]);

  // Filter based on range
  const filteredRecords: DailyETRecord[] = React.useMemo(() => {
    if (allRecords.length === 0) return [];

    if (timeRange === 'today') {
      const todayStr = todayET.date || new Date().toISOString().split('T')[0];
      const match = allRecords.filter((r) => r.date === todayStr);
      return match.length > 0 ? match : allRecords.slice(-1);
    }

    if (timeRange === '7days') {
      return allRecords.slice(-7);
    }

    return allRecords.slice(-30);
  }, [allRecords, timeRange, todayET]);

  // Compute statistics
  const avgEt =
    filteredRecords.length > 0
      ? filteredRecords.reduce((sum, r) => sum + r.ET0, 0) / filteredRecords.length
      : 0;
  const maxEt =
    filteredRecords.length > 0 ? Math.max(...filteredRecords.map((r) => r.ET0)) : 0;
  const minEt =
    filteredRecords.length > 0 ? Math.min(...filteredRecords.map((r) => r.ET0)) : 0;

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 35;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Y-Scale calculations
  const yMax = Math.max(15, Math.ceil(maxEt * 1.2) || 12);
  const yMin = 0;

  const points = filteredRecords.map((rec, idx) => {
    const x =
      filteredRecords.length === 1
        ? paddingX + chartWidth / 2
        : paddingX + (idx / (filteredRecords.length - 1)) * chartWidth;
    const yRatio = (rec.ET0 - yMin) / (yMax - yMin);
    const y = paddingY + chartHeight - yRatio * chartHeight;
    return { x, y, record: rec };
  });

  const pathD =
    points.length === 0
      ? ''
      : points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${
          paddingY + chartHeight
        } Z`
      : '';

  const hoveredPt = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="rounded-3xl border border-[#D1E0CE] bg-white p-6 shadow-xs space-y-4">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EFE4]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#F0F7FB] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0">
            <Sun className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#143826] font-display">
                ET₀ History
              </h2>
              {isDemoMode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-[#667C6A]">
              Daily reference evapotranspiration trend based on Hargreaves-Samani formulation.
            </p>
          </div>
        </div>

        {/* Range Tabs: Today / 7 Days / 30 Days */}
        <div className="flex items-center gap-1 p-1 bg-[#F8FAF6] border border-[#D1E0CE] rounded-2xl self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${
              timeRange === 'today'
                ? 'bg-[#143826] text-white shadow-xs'
                : 'text-[#4A5D4E] hover:text-[#143826]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${
              timeRange === '7days'
                ? 'bg-[#143826] text-white shadow-xs'
                : 'text-[#4A5D4E] hover:text-[#143826]'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${
              timeRange === '30days'
                ? 'bg-[#143826] text-white shadow-xs'
                : 'text-[#4A5D4E] hover:text-[#143826]'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#F8FAF6] p-3 rounded-2xl border border-[#D8E6D3]">
          <span className="text-[10px] font-mono text-[#667C6A] uppercase block mb-0.5">Average ET₀</span>
          <span className="text-sm sm:text-base font-bold text-[#0284C7] font-mono">
            {avgEt > 0 ? `${avgEt.toFixed(2)} mm/d` : '—'}
          </span>
        </div>
        <div className="bg-[#F8FAF6] p-3 rounded-2xl border border-[#D8E6D3]">
          <span className="text-[10px] font-mono text-[#667C6A] uppercase block mb-0.5">Peak Demand</span>
          <span className="text-sm sm:text-base font-bold text-amber-700 font-mono">
            {maxEt > 0 ? `${maxEt.toFixed(2)} mm/d` : '—'}
          </span>
        </div>
        <div className="bg-[#F8FAF6] p-3 rounded-2xl border border-[#D8E6D3]">
          <span className="text-[10px] font-mono text-[#667C6A] uppercase block mb-0.5">Low Demand</span>
          <span className="text-sm sm:text-base font-bold text-[#143826] font-mono">
            {minEt > 0 ? `${minEt.toFixed(2)} mm/d` : '—'}
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative border border-[#E0ECE0] rounded-2xl p-2 bg-[#FCFDFC] overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-[#8A9B8D] text-xs">
            <Calendar className="h-6 w-6 text-[#CFDFCB] mb-2" />
            <span>No ET₀ records logged for this range yet.</span>
            <span className="text-[11px] mt-1 text-[#667C6A]">
              DHT22 continuous temperature logging will populate daily historical records.
            </span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 select-none"
            >
              <defs>
                <linearGradient id="etGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + chartHeight - ratio * chartHeight;
                const val = (yMin + ratio * (yMax - yMin)).toFixed(0);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#E5EFE2"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#8A9B8D"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaD && <path d={areaD} fill="url(#etGradient)" />}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g
                    key={pt.record.date + idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#0284C7' : '#FFFFFF'}
                      stroke="#0284C7"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150"
                    />
                    {/* Invisible larger hover target */}
                    <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />
                  </g>
                );
              })}

              {/* X-axis date labels */}
              {points.map((pt, idx) => {
                // Show label on first, last, or every N points
                const total = points.length;
                const step = total > 14 ? 5 : total > 7 ? 2 : 1;
                const isSelected = idx === 0 || idx === total - 1 || idx % step === 0;

                if (!isSelected) return null;

                const shortDate = pt.record.date.slice(5); // MM-DD
                return (
                  <text
                    key={'label-' + pt.record.date + idx}
                    x={pt.x}
                    y={svgHeight - 10}
                    fill="#667C6A"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {shortDate}
                  </text>
                );
              })}
            </svg>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPt && (
          <div className="mt-2 p-3 rounded-xl bg-[#143826] text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-mono font-bold">{hoveredPt.record.date}</span>
              <span className="text-emerald-300">·</span>
              <span className="text-[#CFDFCB]">Day {hoveredPt.record.dayOfYear}</span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div>
                <span className="text-[#A3BFA8]">ET₀: </span>
                <strong className="text-white text-xs">{hoveredPt.record.ET0.toFixed(2)} mm/d</strong>
              </div>
              <div>
                <span className="text-[#A3BFA8]">Tmax: </span>
                <strong className="text-white">{hoveredPt.record.Tmax.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-[#A3BFA8]">Tmin: </span>
                <strong className="text-white">{hoveredPt.record.Tmin.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-[#A3BFA8]">Ra: </span>
                <strong className="text-white">{hoveredPt.record.Ra.toFixed(1)} MJ</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#667C6A] pt-1">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-[#0284C7]" />
          <span>Stage 1 Intelligence: Reference Evapotranspiration</span>
        </span>
        <span>FAO-56 Hargreaves-Samani</span>
      </div>
    </div>
  );
};
