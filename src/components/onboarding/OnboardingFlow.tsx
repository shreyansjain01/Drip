import React, { useState, useEffect } from 'react';
import AmountDisplay from '../ui/AmountDisplay';
import Keypad from '../ui/Keypad';
import AllocationBar from '../ui/AllocationBar';
import { formatINR } from '../../lib/money';
import { supabase } from '../../lib/supabase/client';

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Name
  const [name, setName] = useState('');

  // Step 2: Salary
  const [salaryStr, setSalaryStr] = useState('50000');

  // Step 3: Fields split (% of salary)
  const [expensePct, setExpensePct] = useState(60); // 60% expenses
  const [savingsPct, setSavingsPct] = useState(40); // 40% savings

  // Step 4: First Goal
  const [goalName, setGoalName] = useState('Emergency Fund');
  const [goalAmountStr, setGoalAmountStr] = useState('100000');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const detectedName = user.user_metadata?.full_name 
          || user.user_metadata?.name 
          || user.email?.split('@')[0];
        if (detectedName) {
          setName(detectedName);
        }
      }
    });
  }, []);

  const handleFinish = async () => {
    // Save onboarding data and establish clean session
    try {
      const finalName = name.trim() || 'User';
      const finalSalary = parseInt(salaryStr || '50000', 10);

      document.cookie = 'drip_auth_session=1; path=/; max-age=31536000; SameSite=Lax';
      localStorage.setItem('drip_user_name', finalName);
      localStorage.setItem('drip_user_salary', salaryStr || '50000');
      localStorage.setItem('drip_expense_pct', expensePct.toString());
      localStorage.setItem('drip_savings_pct', savingsPct.toString());
      localStorage.setItem('drip_local_expenses', JSON.stringify([]));

      // Save to Supabase backend in parallel
      const profilePromise = fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          salary: finalSalary,
          expensePct,
          savingsPct,
          onboardingDone: true
        })
      }).catch(() => {});

      let goalPromise: Promise<any> = Promise.resolve();
      if (goalName && goalAmountStr && parseInt(goalAmountStr, 10) > 0) {
        const goalNum = parseInt(goalAmountStr, 10);
        const initialGoal = {
          id: 'goal-' + Date.now(),
          name: goalName,
          savedPaise: 0,
          targetPaise: goalNum * 100,
          deadline: 'Dec 2026',
          color: '#B8ACFA',
          iconName: 'Shield'
        };
        localStorage.setItem('drip_user_goals', JSON.stringify([initialGoal]));

        goalPromise = fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: goalName,
            targetPaise: goalNum * 100,
            deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            icon: 'Shield',
            color: '#B8ACFA'
          })
        }).catch(() => {});
      } else {
        localStorage.setItem('drip_user_goals', JSON.stringify([]));
      }

      await Promise.all([profilePromise, goalPromise]);
    } catch {
      // ignore storage errors
    }
    window.location.href = '/';
  };

  const handleKeypadPress = (digit: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter((prev) => {
      if (digit === '.') {
        if (prev.includes('.')) return prev;
        return prev ? `${prev}.` : '0.';
      }
      if (prev === '0') return digit;
      if (prev.length >= 9) return prev;
      return prev + digit;
    });
  };

  const handleKeypadBackspace = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const salaryNum = parseInt(salaryStr || '0', 10);
  const salaryPaise = salaryNum * 100;
  const expensesPaise = Math.round((salaryPaise * expensePct) / 100);
  const savingsPaise = Math.round((salaryPaise * savingsPct) / 100);

  const allocationSegments = [
    { id: '1', name: 'Expenses', paise: expensesPaise, color: '#B8ACFA' },
    { id: '2', name: 'Savings', paise: savingsPaise, color: '#D8D1FD' }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between bg-black text-white relative select-none">
      {/* Top Section on Lavender */}
      <div className="w-full bg-[#B8ACFA] text-black pt-8 pb-6 px-6 flex flex-col items-center">
        {/* Step progress pills and Skip button */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-black' : s < step ? 'w-4 bg-black/40' : 'w-4 bg-black/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-[13px] font-medium text-black/60 hover:text-black transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Step Title & Content */}
        {step === 1 && (
          <div className="w-full text-center py-4">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-black/50 block mb-1">
              Step 1 of 4
            </span>
            <h2 className="font-display text-[32px] leading-tight font-medium text-black">
              What's your name?
            </h2>
            <div className="mt-6 w-full max-w-[280px] mx-auto">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ellie-May"
                className="w-full h-14 text-center text-[22px] font-medium text-black bg-white rounded-[18px] border-2 border-transparent focus:border-black focus:outline-none shadow-sm placeholder:text-black/30"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full text-center py-2">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-black/50 block mb-1">
              Step 2 of 4
            </span>
            <h2 className="text-[20px] font-medium text-black mb-3">
              What's your monthly salary?
            </h2>
            <AmountDisplay value={salaryStr} showCaret={true} />
          </div>
        )}

        {step === 3 && (
          <div className="w-full text-center py-2">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-black/50 block mb-1">
              Step 3 of 4
            </span>
            <h2 className="text-[20px] font-medium text-black mb-2">
              Plan your month
            </h2>
            <p className="text-[13px] text-black/60 mb-4">
              Split between Expenses & Savings
            </p>
            <div className="w-full max-w-[320px] mx-auto">
              <AllocationBar segments={allocationSegments} totalPaise={salaryPaise} onLavenderSurface={true} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full text-center py-2">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-black/50 block mb-1">
              Step 4 of 4
            </span>
            <h2 className="text-[20px] font-medium text-black mb-3">
              Got a goal in mind?
            </h2>
            <div className="w-full max-w-[280px] mx-auto mb-2">
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Goa Trip, New Phone"
                className="w-full h-11 text-center text-[16px] font-medium text-black bg-white rounded-[14px] border border-transparent focus:border-black focus:outline-none shadow-sm mb-3"
              />
            </div>
            <AmountDisplay value={goalAmountStr} showCaret={true} />
          </div>
        )}
      </div>

      {/* SVG Drip Edge */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none h-14 -mt-1 bg-black">
        <svg viewBox="0 0 430 64" preserveAspectRatio="none" className="w-full h-full rotate-180 scale-x-[-1] fill-[#B8ACFA]">
          <path d="M0 64 V52 Q0 38 20 38 H70 Q90 38 90 20 V12 Q90 0 110 0 H190 Q210 0 210 20 V38 Q210 46 230 46 H320 Q340 46 340 20 V14 Q340 0 360 0 H410 Q430 0 430 20 V64 Z" />
        </svg>
      </div>

      {/* Bottom Section on Black with Controls / Keypad */}
      <div className="flex-1 flex flex-col justify-end px-5 pb-8 pt-2">
        {step === 1 && (
          <div className="w-full flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-[20px] bg-[#B8ACFA] text-black font-title text-[16px] font-medium flex items-center justify-center pressable shadow-lg active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full flex flex-col gap-4">
            <Keypad
              onKeyPress={(k) => handleKeypadPress(k, setSalaryStr)}
              onBackspace={() => handleKeypadBackspace(setSalaryStr)}
            />
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full h-14 rounded-[20px] bg-[#B8ACFA] text-black font-title text-[16px] font-medium flex items-center justify-center pressable shadow-lg active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full flex flex-col gap-5">
            <div className="bg-[#0B0B0C] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-[#B8ACFA] font-medium">Expenses ({expensePct}%)</span>
                <span className="text-white font-medium">{formatINR(expensesPaise)}</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-[#D8D1FD] font-medium">Savings ({savingsPct}%)</span>
                <span className="text-white font-medium">{formatINR(savingsPaise)}</span>
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
                className="w-full accent-[#B8ACFA] h-2 bg-[#1A1A1D] rounded-lg cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="w-full h-14 rounded-[20px] bg-[#B8ACFA] text-black font-title text-[16px] font-medium flex items-center justify-center pressable shadow-lg active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="w-full flex flex-col gap-4">
            <Keypad
              onKeyPress={(k) => handleKeypadPress(k, setGoalAmountStr)}
              onBackspace={() => handleKeypadBackspace(setGoalAmountStr)}
            />
            <button
              type="button"
              onClick={handleFinish}
              className="w-full h-14 rounded-[20px] bg-[#B8ACFA] text-black font-title text-[16px] font-medium flex items-center justify-center pressable shadow-lg active:scale-[0.98] transition-all"
            >
              Get Started with Drip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
