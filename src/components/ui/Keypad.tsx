import React from 'react';
import { Delete } from 'lucide-react';
import { playKeyTapSound } from '../../lib/audio';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  className?: string;
}

export const Keypad: React.FC<KeypadProps> = ({
  onKeyPress,
  onBackspace,
  className = ''
}) => {
  const triggerHaptic = () => {
    playKeyTapSound();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  const handleKey = (key: string) => {
    triggerHaptic();
    onKeyPress(key);
  };

  const handleBack = () => {
    triggerHaptic();
    onBackspace();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className={`grid grid-cols-3 gap-2 w-full select-none ${className}`}>
      {keys.slice(0, 9).map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => handleKey(digit)}
          className="h-14 bg-white text-black font-keypad text-[28px] leading-none rounded-[16px] flex items-center justify-center pressable shadow-sm active:bg-[#D8D1FD] active:scale-[0.95] transition-all"
          aria-label={`Digit ${digit}`}
        >
          {digit}
        </button>
      ))}

      {/* Decimal Point */}
      <button
        type="button"
        onClick={() => handleKey('.')}
        className="h-14 bg-white text-black font-keypad text-[28px] leading-none rounded-[16px] flex items-center justify-center pressable shadow-sm active:bg-[#D8D1FD] active:scale-[0.95] transition-all"
        aria-label="Decimal point"
      >
        .
      </button>

      {/* Zero */}
      <button
        type="button"
        onClick={() => handleKey('0')}
        className="h-14 bg-white text-black font-keypad text-[28px] leading-none rounded-[16px] flex items-center justify-center pressable shadow-sm active:bg-[#D8D1FD] active:scale-[0.95] transition-all"
        aria-label="Digit 0"
      >
        0
      </button>

      {/* Backspace */}
      <button
        type="button"
        onClick={handleBack}
        className="h-14 bg-white text-black rounded-[16px] flex items-center justify-center pressable shadow-sm active:bg-[#D8D1FD] active:scale-[0.95] transition-all"
        aria-label="Backspace"
      >
        <Delete size={24} strokeWidth={1.75} />
      </button>
    </div>
  );
};

export default Keypad;
