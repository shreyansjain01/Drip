import React, { useState } from 'react';
import AmountDisplay from '../ui/AmountDisplay';
import Keypad from '../ui/Keypad';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { formatINR } from '../../lib/money';

const INCOME_LABELS = ['Bonus', 'Side gig', 'Freelance', 'Gift', 'Refund', 'Cashback', 'Salary'];

export const IncomeForm: React.FC = () => {
  const [kind, setKind] = useState<'salary' | 'extra'>('extra');
  const [amountStr, setAmountStr] = useState('10000');
  const [selectedLabel, setSelectedLabel] = useState('Bonus');
  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [showAllocationSheet, setShowAllocationSheet] = useState(false);

  const handleKeyPress = (digit: string) => {
    setAmountStr((prev) => {
      if (digit === '.') {
        if (prev.includes('.')) return prev;
        return prev ? `${prev}.` : '0.';
      }
      if (prev === '0') return digit;
      if (prev.length >= 9) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleSaveIncome = async () => {
    const paise = Math.round(parseFloat(amountStr || '0') * 100);
    if (paise <= 0) return;

    setSavedAmount(paise);
    setShowAllocationSheet(true);
  };

  const handleAllocationChoice = (choice: string) => {
    setShowAllocationSheet(false);
    alert(`Allocated ${formatINR(savedAmount || 0)} to ${choice}!`);
    window.location.href = '/plan';
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-black text-white relative select-none">
      
      {/* Allocation Sheet after saving income */}
      {showAllocationSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-[430px] bg-[#B8ACFA] text-black rounded-t-[32px] pt-4 pb-8 px-6 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-1.5 bg-black/20 rounded-full mb-4" />
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-[#B8ACFA] mb-2">
              <Sparkles size={24} />
            </div>
            <h3 className="font-display text-[24px] font-medium text-black">
              {formatINR(savedAmount || 0)} Added!
            </h3>
            <p className="font-caption text-black/60 text-center mb-5">
              Where would you like to direct this extra income?
            </p>

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAllocationChoice('Emergency Fund')}
                className="p-3.5 bg-white rounded-2xl text-left border border-black/5 active:bg-white/80"
              >
                <span className="font-body-500 text-black text-[14px] block">Emergency Fund</span>
                <span className="text-[11px] text-black/50">Boost savings</span>
              </button>

              <button
                type="button"
                onClick={() => handleAllocationChoice('Travel & Vacation')}
                className="p-3.5 bg-white rounded-2xl text-left border border-black/5 active:bg-white/80"
              >
                <span className="font-body-500 text-black text-[14px] block">Goa Trip</span>
                <span className="text-[11px] text-black/50">Goal target</span>
              </button>

              <button
                type="button"
                onClick={() => handleAllocationChoice('Expenses Buffer')}
                className="p-3.5 bg-white rounded-2xl text-left border border-black/5 active:bg-white/80"
              >
                <span className="font-body-500 text-black text-[14px] block">Expense Buffer</span>
                <span className="text-[11px] text-black/50">Spend freely</span>
              </button>

              <button
                type="button"
                onClick={() => handleAllocationChoice('Unallocated')}
                className="p-3.5 bg-black text-white rounded-2xl text-left active:bg-black/80"
              >
                <span className="font-body-500 text-white text-[14px] block">Unallocated</span>
                <span className="text-[11px] text-white/50">Decide later</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Lavender Surface */}
      <div className="w-full bg-[#B8ACFA] text-black pt-2 pb-4 flex flex-col">
        <div className="w-full h-14 px-5 flex items-center justify-between">
          <a
            href="/"
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:scale-95 text-black"
          >
            <ArrowLeft size={22} strokeWidth={1.75} />
          </a>

          <h1 className="font-title text-[18px] font-medium text-black">
            Add Income
          </h1>

          <div className="w-10 h-10" />
        </div>

        {/* Amount Display */}
        <div className="py-3">
          <AmountDisplay value={amountStr} currencySymbol="+₹" showCaret={true} />
        </div>
      </div>

      {/* SVG Drip Edge */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none h-14 -mt-1 bg-black">
        <svg viewBox="0 0 430 64" preserveAspectRatio="none" className="w-full h-full rotate-180 scale-x-[-1] fill-[#B8ACFA]">
          <path d="M0 64 V52 Q0 38 20 38 H70 Q90 38 90 20 V12 Q90 0 110 0 H190 Q210 0 210 20 V38 Q210 46 230 46 H320 Q340 46 340 20 V14 Q340 0 360 0 H410 Q430 0 430 20 V64 Z" />
        </svg>
      </div>

      {/* Bottom Black Section */}
      <div className="flex-1 flex flex-col justify-between px-5 pb-6 pt-1">
        <div className="flex flex-col gap-3">
          {/* Kind Toggle (Extra Income / Salary change) */}
          <div className="flex bg-[#1A1A1D] p-1 rounded-full border border-white/5 w-fit mx-auto">
            <button
              type="button"
              onClick={() => setKind('extra')}
              className={`px-4 py-1 rounded-full text-[12px] font-medium transition-all ${
                kind === 'extra' ? 'bg-[#B8ACFA] text-black' : 'text-white/60'
              }`}
            >
              Extra Income
            </button>
            <button
              type="button"
              onClick={() => setKind('salary')}
              className={`px-4 py-1 rounded-full text-[12px] font-medium transition-all ${
                kind === 'salary' ? 'bg-[#B8ACFA] text-black' : 'text-white/60'
              }`}
            >
              Salary Update
            </button>
          </div>

          {/* Label Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {INCOME_LABELS.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setSelectedLabel(lbl)}
                className={`px-4 py-2 rounded-[14px] text-[13px] font-medium shrink-0 transition-all ${
                  selectedLabel === lbl
                    ? 'bg-[#B8ACFA] text-black'
                    : 'bg-[#1A1A1D] text-white/70 hover:text-white'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Keypad & Submit */}
        <div className="flex flex-col gap-3 mt-2">
          <Keypad onKeyPress={handleKeyPress} onBackspace={handleBackspace} />

          <button
            type="button"
            onClick={handleSaveIncome}
            className="w-full h-14 rounded-[20px] bg-[#B8ACFA] text-black font-body-500 text-[16px] flex items-center justify-center pressable shadow-lg active:scale-[0.98] transition-all"
          >
            Add Income
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomeForm;
