import React, { useState } from 'react';
import { formatINR } from '../../lib/money';

export interface AllocationSegment {
  id: string;
  name: string;
  paise: number | bigint;
  color?: string;
}

interface AllocationBarProps {
  segments: AllocationSegment[];
  totalPaise: number | bigint;
  onLavenderSurface?: boolean;
  className?: string;
  onSegmentClick?: (id: string) => void;
}

const PALETTE = ['#B8ACFA', '#D8D1FD', '#8E7DF0', '#000000'];

export const AllocationBar: React.FC<AllocationBarProps> = ({
  segments,
  totalPaise,
  onLavenderSurface = true,
  className = '',
  onSegmentClick
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const total = Number(totalPaise);
  const allocatedPaise = segments.reduce((acc, s) => acc + Number(s.paise), 0);
  const unallocatedPaise = Math.max(0, total - allocatedPaise);
  const isOverAllocated = allocatedPaise > total;

  const gapColor = onLavenderSurface ? 'bg-[#B8ACFA]' : 'bg-black';
  const unallocatedColor = onLavenderSurface ? 'bg-[#FBF8EC]' : 'bg-[#1A1A1D]';

  return (
    <div className={`w-full flex flex-col gap-2 select-none relative ${className}`}>
      {/* 14px pill bar, radius 7 */}
      <div className="w-full h-[14px] rounded-[7px] bg-black/10 overflow-hidden flex items-center p-0 relative shadow-inner">
        {segments.map((seg, idx) => {
          const segVal = Number(seg.paise);
          const pct = total > 0 ? Math.max((segVal / (isOverAllocated ? allocatedPaise : total)) * 100, 2) : 0;
          const bg = seg.color || PALETTE[idx % PALETTE.length];

          return (
            <React.Fragment key={seg.id}>
              {idx > 0 && <div className={`w-[2px] h-full ${gapColor} shrink-0`} />}
              <div
                onClick={() => {
                  setActiveTooltip(activeTooltip === seg.id ? null : seg.id);
                  onSegmentClick?.(seg.id);
                }}
                className={`h-full cursor-pointer transition-all duration-500 hover:brightness-110 relative ${
                  bg === '#000000' ? 'bg-black' : ''
                }`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: bg !== '#000000' ? bg : undefined
                }}
                title={`${seg.name}: ${formatINR(seg.paise)}`}
              />
            </React.Fragment>
          );
        })}

        {/* Unallocated segment if remaining space */}
        {unallocatedPaise > 0 && (
          <>
            {segments.length > 0 && <div className={`w-[2px] h-full ${gapColor} shrink-0`} />}
            <div
              className={`h-full flex-1 ${unallocatedColor} transition-all duration-500`}
              title={`Unallocated: ${formatINR(unallocatedPaise)}`}
            />
          </>
        )}
      </div>

      {/* Over-allocation warning indicator if over allocated */}
      {isOverAllocated && (
        <div className="flex items-center gap-1.5 font-micro text-[#FF7A6B]">
          <span className="w-2 h-2 rounded-full bg-[#FF7A6B]"></span>
          <span>Over-allocated by {formatINR(allocatedPaise - total)}</span>
        </div>
      )}
    </div>
  );
};

export default AllocationBar;
