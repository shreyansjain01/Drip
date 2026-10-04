import React, { useState, useEffect } from 'react';
import AmountDisplay from '../ui/AmountDisplay';
import CategoryChips from '../ui/CategoryChips';
import Keypad from '../ui/Keypad';
import VoiceSheet from '../voice/VoiceSheet';
import { ArrowLeft, MoreVertical, Mic, Check, FileText } from 'lucide-react';
import { addLocalExpense } from '../../lib/stores/expenseStore';
import { playExpenseAddedSound, playKeyTapSound } from '../../lib/audio';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food', icon: 'Utensils' },
  { id: '2', name: 'Transport', icon: 'Car' },
  { id: '3', name: 'Shopping', icon: 'ShoppingBag' },
  { id: '4', name: 'Bills', icon: 'Receipt' },
  { id: '5', name: 'Entertainment', icon: 'Film' },
  { id: '6', name: 'Groceries', icon: 'Package' }
];

export const AddExpenseForm: React.FC = () => {
  const [amountStr, setAmountStr] = useState('160');
  const [selectedCatId, setSelectedCatId] = useState('1');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('voice=1')) {
      setIsVoiceOpen(true);
    }
  }, []);

  const handleKeyPress = (digit: string) => {
    playKeyTapSound();
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
    playKeyTapSound();
    setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleSubmit = async () => {
    const paise = Math.round(parseFloat(amountStr || '0') * 100);
    if (paise <= 0) return;

    const cat = DEFAULT_CATEGORIES.find((c) => c.id === selectedCatId) || DEFAULT_CATEGORIES[0];
    const label = note || cat.name;

    playExpenseAddedSound();

    addLocalExpense({
      title: label,
      category: cat.name,
      iconName: cat.icon,
      amountPaise: paise
    });

    setIsSubmitting(true);
    setShowToast(true);

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaise: paise,
          categoryId: selectedCatId,
          label,
          source: 'manual'
        })
      });
    } catch {}

    setIsSubmitting(false);
    setTimeout(() => {
      window.location.href = '/';
    }, 750);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-black text-white relative select-none">
      {/* Voice Recording Sheet */}
      <VoiceSheet
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSaved={() => {
          setIsVoiceOpen(false);
          window.location.href = '/';
        }}
      />

      {/* Animated Liquid Success Toast */}
      {showToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1D] border border-white/20 text-white px-5 py-3 rounded-full flex items-center gap-2.5 shadow-[0_10px_30px_rgba(184,172,250,0.35)] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-[#B8ACFA] flex items-center justify-center text-black shadow-sm animate-pulse">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-[14px] font-semibold text-white tracking-tight">
            ₹{parseFloat(amountStr).toLocaleString('en-IN')} added!
          </span>
        </div>
      )}

      {/* Top Lavender Surface */}
      <div className="w-full bg-[#B8ACFA] text-black pt-2 pb-2 flex flex-col">
        {/* Header */}
        <div className="w-full h-14 px-5 flex items-center justify-between">
          <a
            href="/"
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:scale-95 text-black hover:bg-black/5 transition-all cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </a>

          <h1 className="font-title text-[18px] font-semibold text-black tracking-tight">
            Add expense
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 text-black hover:bg-black/10 transition-all cursor-pointer"
              aria-label="Record by voice"
            >
              <Mic size={22} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center -mr-2 rounded-full active:scale-95 text-black hover:bg-black/10 transition-all cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Hero Amount Display */}
        <div className="pt-2 pb-4">
          <AmountDisplay value={amountStr} showCaret={true} />
        </div>
      </div>

      {/* SVG Drip Edge (Melting Lavender into Black) */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none h-11 -mt-1 bg-black">
        <svg viewBox="0 0 430 44" preserveAspectRatio="none" className="w-full h-full fill-[#B8ACFA]">
          <path d="M0 0 H430 V16 Q410 16 410 8 V6 Q410 0 390 0 H330 Q310 0 310 16 V26 Q310 36 290 36 H210 Q190 36 190 10 V6 Q190 0 170 0 H110 Q90 0 90 14 V26 Q90 36 70 36 H20 Q0 36 0 22 Z" />
        </svg>
      </div>

      {/* Bottom Black Section */}
      <div className="flex-1 flex flex-col justify-between px-5 pb-6 pt-0">
        {/* Categories & Note Input */}
        <div className="flex flex-col gap-2.5">
          <CategoryChips
            categories={DEFAULT_CATEGORIES}
            selectedId={selectedCatId}
            onSelect={setSelectedCatId}
          />

          {/* Clean Note Input */}
          <div className="px-1 mt-0.5">
            <div className="w-full h-11 px-3.5 bg-[#141416] border border-white/10 focus-within:border-[#B8ACFA] rounded-[16px] flex items-center gap-2.5 text-white/50 focus-within:text-white transition-all">
              <FileText size={16} className="shrink-0" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add note (optional)..."
                className="w-full bg-transparent text-white text-[13px] font-medium placeholder:text-white/40 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Keypad & Primary Button */}
        <div className="flex flex-col gap-3 mt-2">
          <Keypad onKeyPress={handleKeyPress} onBackspace={handleBackspace} />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !amountStr || amountStr === '0'}
            className="w-full h-14 rounded-[20px] bg-[#B8ACFA] hover:bg-[#a89af7] text-black font-semibold text-[16px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseForm;
