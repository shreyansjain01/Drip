import React, { useState } from 'react';
import { formatINR } from '../../lib/money';

export interface DonutSegment {
  name: string;
  valuePaise: number | bigint;
  color: string;
}

interface DonutChartProps {
  data?: DonutSegment[];
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data = [],
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalPaise = data.reduce((acc, d) => acc + Number(d.valuePaise), 0);
  const size = 190;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (data.length === 0 || totalPaise === 0) {
    return (
      <div className={`w-full flex flex-col items-center py-4 select-none ${className}`}>
        <div className="relative w-[180px] h-[180px] flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#D8D1FD"
              strokeWidth={strokeWidth}
              strokeDasharray="12 6"
              className="opacity-40"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="font-caption text-black/40 text-[12px] font-medium">Categories</span>
            <span className="font-display text-black text-[18px] font-semibold tabular-nums mt-0.5">₹0</span>
          </div>
        </div>
        <p className="text-[12px] text-black/50 mt-3 text-center max-w-[240px]">
          Categories map automatically as you log your daily expenses.
        </p>
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      <div className="relative w-[190px] h-[190px] flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {data.map((seg, idx) => {
            const val = Number(seg.valuePaise);
            const percent = totalPaise > 0 ? val / totalPaise : 0;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={seg.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-200"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-caption text-black/50 text-[12px]">
            {hoveredIndex !== null ? data[hoveredIndex].name : 'Total Spend'}
          </span>
          <span className="font-title text-black text-[18px] font-semibold tabular-nums mt-0.5">
            {hoveredIndex !== null
              ? formatINR(data[hoveredIndex].valuePaise, { hideDecimalsIfZero: true })
              : formatINR(totalPaise, { hideDecimalsIfZero: true })}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full grid grid-cols-2 gap-2 mt-4 px-2">
        {data.map((seg, idx) => (
          <div
            key={seg.name}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
              hoveredIndex === idx ? 'bg-black/5' : ''
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 border border-black/10"
              style={{ backgroundColor: seg.color }}
            />
            <div className="flex flex-col truncate">
              <span className="font-caption text-black text-[12px] truncate">{seg.name}</span>
              <span className="font-micro text-black/50 tabular-nums">
                {formatINR(seg.valuePaise, { hideDecimalsIfZero: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
