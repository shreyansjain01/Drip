import React, { useState } from 'react';
import { formatINR } from '../../lib/money';

export interface LinePoint {
  day: string;
  amountPaise: number | bigint;
}

interface LineChartProps {
  data?: LinePoint[];
  className?: string;
}

const DEFAULT_LINE_DATA: LinePoint[] = [
  { day: '1', amountPaise: 0 },
  { day: '5', amountPaise: 0 },
  { day: '10', amountPaise: 0 },
  { day: '15', amountPaise: 0 },
  { day: '20', amountPaise: 0 },
  { day: '25', amountPaise: 0 },
  { day: '30', amountPaise: 0 }
];

export const LineChart: React.FC<LineChartProps> = ({
  data = DEFAULT_LINE_DATA,
  className = ''
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const width = 340;
  const height = 130;
  const paddingX = 24;
  const paddingY = 24;

  const maxVal = Math.max(...data.map((d) => Number(d.amountPaise)));
  const hasExpenses = maxVal > 0;
  const effectiveMax = hasExpenses ? maxVal : 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = hasExpenses
      ? height - paddingY - (Number(d.amountPaise) / effectiveMax) * (height - 2 * paddingY)
      : height - paddingY; // flat baseline at 0
    return { x, y, datum: d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx1 = (prev.x + p.x) / 2;
    const cy1 = prev.y;
    const cx2 = (prev.x + p.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      <div className="relative w-full max-w-[340px] h-[150px]">
        <svg viewBox={`0 0 ${width} ${height + 15}`} className="w-full h-full overflow-visible">
          {/* Baseline grid */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(0, 0, 0, 0.12)"
            strokeWidth="1.5"
            strokeDasharray={!hasExpenses ? '4 4' : 'none'}
          />

          {/* Trend line */}
          <path
            d={pathD}
            fill="none"
            stroke={hasExpenses ? '#8E7DF0' : 'rgba(142, 125, 240, 0.3)'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points */}
          {points.map((p, idx) => {
            const isSelected = selectedPoint === idx;
            return (
              <g key={p.datum.day} onClick={() => setSelectedPoint(idx)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : hasExpenses ? 4 : 3}
                  fill={isSelected ? '#000000' : hasExpenses ? '#B8ACFA' : '#D8D1FD'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Day label below */}
                <text
                  x={p.x}
                  y={height + 5}
                  textAnchor="middle"
                  fill="rgba(0,0,0,0.5)"
                  className="text-[10px] font-sans font-medium"
                >
                  {p.datum.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {selectedPoint !== null && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-[10px] text-[12px] font-medium shadow-md pointer-events-none"
          >
            Day {data[selectedPoint].day}: {formatINR(data[selectedPoint].amountPaise, { hideDecimalsIfZero: true })}
          </div>
        )}
      </div>

      {!hasExpenses && (
        <p className="text-[12px] text-black/50 mt-1 text-center">
          Spending curve will dynamically graph here as you log expenses throughout the month.
        </p>
      )}
    </div>
  );
};

export default LineChart;
