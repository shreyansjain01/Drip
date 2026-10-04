import React from 'react';

interface AmountDisplayProps {
  value: string;
  currencySymbol?: string;
  className?: string;
  showCaret?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  value,
  currencySymbol = '₹',
  className = '',
  showCaret = true
}) => {
  const raw = value || '0';
  const hasDot = raw.includes('.');
  let [wholePart, fracPart] = raw.split('.');

  const num = parseInt(wholePart || '0', 10);
  let formattedWhole = isNaN(num) ? '0' : num.toLocaleString('en-IN');
  if (wholePart === '' && raw.startsWith('.')) {
    formattedWhole = '0';
  }

  let displayFraction = '.00';
  if (hasDot) {
    displayFraction = `.${fracPart || ''}`;
  }

  return (
    <div className={`flex items-baseline justify-center select-none ${className}`}>
      {/* Muted 0.5x size currency symbol aligned at baseline */}
      <span className="text-[28px] font-semibold text-black/50 mr-1 self-baseline">
        {currencySymbol}
      </span>

      {/* Main whole number in display typography */}
      <span className="font-display text-[58px] leading-none font-bold tracking-tight text-black tabular-nums">
        {formattedWhole}
      </span>

      {/* Blinking 2.5px black caret bar */}
      {showCaret && (
        <span className="inline-block w-[2.5px] h-[44px] bg-black mx-[2px] animate-pulse self-center rounded-full" />
      )}

      {/* Muted decimal portion */}
      <span className="font-display text-[58px] leading-none font-semibold tracking-tight text-black/35 tabular-nums">
        {displayFraction}
      </span>
    </div>
  );
};

export default AmountDisplay;
