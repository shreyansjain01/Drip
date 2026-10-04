import React, { useState } from 'react';
import { formatINR } from '../../lib/money';

export interface BarDatum {
  label: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  valuePaise: number | bigint;
}

interface BarChartProps {
  data?: BarDatum[];
  initialSelectedIndex?: number;
  onSelect?: (index: number, datum: BarDatum) => void;
  className?: string;
}

const DEFAULT_WEEK_DATA: BarDatum[] = [
  { label: 'Mon', valuePaise: 0 },
  { label: 'Tue', valuePaise: 0 },
  { label: 'Wed', valuePaise: 0 },
  { label: 'Thu', valuePaise: 0 },
  { label: 'Fri', valuePaise: 0 },
  { label: 'Sat', valuePaise: 0 },
  { label: 'Sun', valuePaise: 0 }
];

export const BarChart: React.FC<BarChartProps> = ({
  data = DEFAULT_WEEK_DATA,
  initialSelectedIndex = 4, // "Fri"
  onSelect,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');

  const maxVal = Math.max(...data.map((d) => Number(d.valuePaise)));
  const hasExpenses = maxVal > 0;
  const maxValue = hasExpenses ? maxVal : 1;
  const chartHeight = 110;
  const barWidth = 36;
  const gap = 10;
  const minBarHeight = 24;

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    onSelect?.(idx, data[idx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      const next = (selectedIndex + 1) % data.length;
      handleSelect(next);
    } else if (e.key === 'ArrowLeft') {
      const prev = (selectedIndex - 1 + data.length) % data.length;
      handleSelect(prev);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`w-full flex flex-col items-center select-none outline-none focus-visible:ring-1 focus-visible:ring-[#B8ACFA] rounded-2xl ${className}`}
      aria-label="Expense bar chart. Use left and right arrow keys to inspect days."
    >
      {/* Segmented Range Selector */}
      <div className="flex items-center gap-1 bg-[#1A1A1D] p-1 rounded-full mb-6 border border-white/10 shadow-inner">
        {(['week', 'month', 'year'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              range === r
                ? 'bg-[#B8ACFA] text-black shadow-sm font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full flex justify-center items-end h-[165px] pb-2">
        <svg
          viewBox={`0 0 ${data.length * (barWidth + gap)} ${chartHeight + 45}`}
          className="w-full max-w-[360px] overflow-visible"
        >
          {data.map((d, i) => {
            const val = Number(d.valuePaise);
            const ratio = hasExpenses ? val / maxValue : 0;
            const barH = hasExpenses ? Math.max(ratio * chartHeight, minBarHeight) : 28;
            const x = i * (barWidth + gap);
            const y = chartHeight - barH + 15;
            const isSelected = i === selectedIndex;

            return (
              <g
                key={d.label}
                onClick={() => handleSelect(i)}
                className="cursor-pointer group"
              >
                {/* Floating Tooltip above selected bar */}
                {isSelected && (
                  <g
                    transform={`translate(${x + barWidth / 2}, ${y - 8})`}
                    className="transition-transform duration-200"
                  >
                    <rect
                      x="-36"
                      y="-26"
                      width="72"
                      height="24"
                      rx="10"
                      ry="10"
                      fill="#FFFFFF"
                      className="shadow-xl"
                    />
                    <text
                      x="0"
                      y="-10"
                      textAnchor="middle"
                      fill="#000000"
                      className="font-medium text-[12px] font-sans"
                    >
                      {formatINR(d.valuePaise, { hideDecimalsIfZero: true })}
                    </text>
                  </g>
                )}

                {/* Bar pill */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="10"
                  ry="10"
                  fill={
                    hasExpenses
                      ? isSelected
                        ? '#B8ACFA'
                        : '#FBF8EC'
                      : isSelected
                      ? 'rgba(184, 172, 250, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }
                  stroke={!hasExpenses && isSelected ? '#B8ACFA' : 'none'}
                  strokeWidth="1.5"
                  className="transition-all duration-200 hover:opacity-90"
                />

                {/* Day label below bar */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 35}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.60)'}
                  className={`text-[12px] font-sans transition-all ${
                    isSelected ? 'font-semibold fill-white' : 'font-normal'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default BarChart;
