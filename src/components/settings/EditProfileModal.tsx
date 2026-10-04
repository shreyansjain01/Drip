import React, { useState, useEffect } from 'react';
import { X, Check, User, Wallet, PieChart } from 'lucide-react';
import AllocationBar from '../ui/AllocationBar';
import { formatINR } from '../../lib/money';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (data: { name: string; salary: number; expensePct: number; savingsPct: number }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [salaryStr, setSalaryStr] = useState('50000');
  const [expensePct, setExpensePct] = useState(60);
  const [savingsPct, setSavingsPct] = useState(40);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load existing profile data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const localName = localStorage.getItem('drip_user_name') || '';
    const localSalary = localStorage.getItem('drip_user_salary') || '50000';
    const localExpensePct = localStorage.getItem('drip_expense_pct') || '60';
    const localSavingsPct = localStorage.getItem('drip_savings_pct') || '40';

    setName(localName);
    setSalaryStr(localSalary);
    setExpensePct(parseInt(localExpensePct, 10));
    setSavingsPct(parseInt(localSavingsPct, 10));

    // Also fetch fresh from API
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          if (data.user.name) setName(data.user.name);
          if (data.user.salary) setSalaryStr(data.user.salary.toString());
          if (data.user.expensePct) setExpensePct(data.user.expensePct);
          if (data.user.savingsPct) setSavingsPct(data.user.savingsPct);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const salaryNum = Math.max(0, parseInt(salaryStr || '0', 10));
  const salaryPaise = salaryNum * 100;
  const expensesPaise = Math.round((salaryPaise * expensePct) / 100);
  const savingsPaise = Math.round((salaryPaise * savingsPct) / 100);

  const allocationSegments = [
    { id: '1', name: 'Expenses', paise: expensesPaise, color: '#B8ACFA' },
    { id: '2', name: 'Savings', paise: savingsPaise, color: '#D8D1FD' }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const finalName = name.trim() || 'User';
    setIsSaving(true);

    try {
      // 1. Update localStorage instantly
      localStorage.setItem('drip_user_name', finalName);
      localStorage.setItem('drip_user_salary', salaryNum.toString());
      localStorage.setItem('drip_expense_pct', expensePct.toString());
      localStorage.setItem('drip_savings_pct', savingsPct.toString());

      // 2. Persist to Supabase backend
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          salary: salaryNum,
          expensePct,
          savingsPct,
          onboardingDone: true
        })
      });

      setShowSuccessToast(true);

      onSaved?.({
        name: finalName,
        salary: salaryNum,
        expensePct,
        savingsPct
      });

      setTimeout(() => {
        setShowSuccessToast(false);
        setIsSaving(false);
        onClose();
      }, 500);
    } catch {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-[#B8ACFA] text-black rounded-t-[36px] sm:rounded-[36px] pt-4 pb-7 px-5 shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-250">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="w-8" />
          <div className="flex flex-col items-center">
            <div className="w-12 h-1.5 bg-black/20 rounded-full mb-1.5" />
            <h3 className="font-title text-[18px] font-semibold text-black">
              Edit Profile & Budget
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black active:scale-90 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Banner */}
        {showSuccessToast && (
          <div className="w-full bg-black text-white p-3 rounded-2xl flex items-center justify-center gap-2 mb-3 animate-in fade-in">
            <Check size={16} className="text-[#B8ACFA]" />
            <span className="text-[13px] font-semibold">Changes saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* 1. Name Field */}
          <div className="bg-white/80 rounded-2xl p-3.5 border border-black/10 shadow-xs flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/50 flex items-center gap-1.5">
              <User size={13} /> Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ellie-May"
              className="w-full bg-transparent text-[16px] font-semibold text-black focus:outline-none placeholder:text-black/30"
              required
            />
          </div>

          {/* 2. Monthly Salary */}
          <div className="bg-white/80 rounded-2xl p-3.5 border border-black/10 shadow-xs flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/50 flex items-center gap-1.5">
              <Wallet size={13} /> Monthly Salary (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-black/60">₹</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={salaryStr}
                onChange={(e) => setSalaryStr(e.target.value)}
                placeholder="50000"
                className="w-full bg-transparent text-[18px] font-semibold text-black focus:outline-none placeholder:text-black/30"
                required
              />
            </div>
            <span className="text-[11.5px] text-black/60 font-medium">
              Equivalent: {formatINR(salaryPaise)} / month
            </span>
          </div>

          {/* 3. Budget Split Slider & Allocations */}
          <div className="bg-white/80 rounded-2xl p-3.5 border border-black/10 shadow-xs flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-black/50 flex items-center gap-1.5">
                <PieChart size={13} /> Budget Plan Split
              </label>
              <span className="text-[12px] font-bold text-black">
                {expensePct}% / {savingsPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#B8ACFA]/40 p-2.5 rounded-xl border border-black/5 flex flex-col">
                <span className="text-[11px] font-medium text-black/60">Expenses ({expensePct}%)</span>
                <span className="text-[15px] font-bold text-black">{formatINR(expensesPaise)}</span>
              </div>
              <div className="bg-[#D8D1FD]/50 p-2.5 rounded-xl border border-black/5 flex flex-col">
                <span className="text-[11px] font-medium text-black/60">Savings ({savingsPct}%)</span>
                <span className="text-[15px] font-bold text-black">{formatINR(savingsPaise)}</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={expensePct}
              onChange={(e) => {
                const exp = parseInt(e.target.value, 10);
                setExpensePct(exp);
                setSavingsPct(100 - exp);
              }}
              className="w-full accent-black h-2 bg-black/10 rounded-lg cursor-pointer my-1"
            />

            <AllocationBar segments={allocationSegments} totalPaise={salaryPaise} onLavenderSurface={false} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-13 rounded-[20px] bg-black hover:bg-black/90 text-white font-semibold text-[15px] flex items-center justify-center gap-2 pressable shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={18} strokeWidth={2.5} />
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 text-[13px] font-medium text-black/70 hover:text-black text-center active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
