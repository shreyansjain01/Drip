import React, { useState } from 'react';

interface HeatmapChartProps {
  intensities?: number[][]; // 7 days x 4 blocks (0-4)
  className?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS = ['Morning\n(6-12)', 'Afternoon\n(12-17)', 'Evening\n(17-21)', 'Night\n(21-6)'];

// Default blank zero matrix for fresh user
const BLANK_INTENSITIES = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

const COLOR_SCALE = [
  '#F4EFE0', // 0: empty baseline
  '#D8D1FD', // 1: light
  '#B8ACFA', // 2: medium
  '#8E7DF0', // 3: high
  '#000000'  // 4: peak
];

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  intensities = BLANK_INTENSITIES,
  className = ''
}) => {
  const [selectedCell, setSelectedCell] = useState<{ day: string; block: string; level: number } | null>(null);

  const hasActivity = intensities.some((row) => row.some((v) => v > 0));

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      <div className="w-full grid grid-cols-5 gap-2 text-center text-[11px] text-black/60 mb-2">
        <div></div>
        {TIME_BLOCKS.map((b) => (
          <div key={b} className="leading-tight font-medium whitespace-pre-line text-[10px]">
            {b}
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col gap-1.5">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="grid grid-cols-5 gap-2 items-center">
            <span className="text-[11px] font-medium text-black/70 text-right pr-1">{day}</span>
            {intensities[dayIdx].map((level, blockIdx) => (
              <button
                key={`${day}-${blockIdx}`}
                type="button"
                onClick={() => setSelectedCell({ day, block: TIME_BLOCKS[blockIdx].replace('\n', ' '), level })}
                className="h-7 rounded-[6px] transition-all hover:scale-105 active:scale-95 border border-black/5"
                style={{ backgroundColor: COLOR_SCALE[level] || COLOR_SCALE[0] }}
                aria-label={`${day} ${TIME_BLOCKS[blockIdx].replace('\n', ' ')}: Level ${level}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Selected details */}
      {selectedCell ? (
        <div className="mt-3 text-[12px] text-black/70 bg-white/60 px-3 py-1 rounded-full border border-black/10">
          {selectedCell.day} {selectedCell.block}: {selectedCell.level > 0 ? `Intensity ${selectedCell.level}/4` : 'No expenses logged'}
        </div>
      ) : (
        !hasActivity && (
          <p className="text-[12px] text-black/50 mt-3 text-center">
            Time-of-day heatmap will automatically illuminate as you log expenses.
          </p>
        )
      )}
    </div>
  );
};

export default HeatmapChart;
