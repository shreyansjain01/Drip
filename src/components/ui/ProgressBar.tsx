import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  label: string;
  percent: number; // 0 to 100+
  onBlackSurface?: boolean;
  className?: string;
  subLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percent,
  onBlackSurface = false,
  className = '',
  subLabel
}) => {
  const [fillWidth, setFillWidth] = useState(0);
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFillWidth(clampedPercent);
    }, 50);
    return () => clearTimeout(timer);
  }, [clampedPercent]);

  const textColor = onBlackSurface ? 'text-white' : 'text-black';
  const trackBg = onBlackSurface ? 'bg-[#1A1A1D]' : 'bg-black';

  return (
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`font-caption text-[14px] leading-tight ${textColor}`}>
          {label}
        </span>
        <span className={`font-body-500 text-[15px] leading-tight tabular-nums ${textColor}`}>
          {Math.round(percent)}%
        </span>
      </div>

      {/* 5px track with 5px lavender fill */}
      <div className={`w-full h-[5px] ${trackBg} rounded-[3px] overflow-hidden relative`}>
        <div
          className="h-full bg-[#B8ACFA] rounded-[3px] transition-all duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ width: `${fillWidth}%` }}
        />
      </div>

      {subLabel && (
        <span className={`font-micro text-[11px] ${onBlackSurface ? 'text-white/40' : 'text-black/50'}`}>
          {subLabel}
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
