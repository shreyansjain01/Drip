import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { expensesStore, initExpenseStore } from '../../lib/stores/expenseStore';
import { goalsStore, initGoalStore } from '../../lib/stores/goalStore';
import AmountDisplay from '../ui/AmountDisplay';
import AllocationBar from '../ui/AllocationBar';
import ProgressBar from '../ui/ProgressBar';
import { formatINR } from '../../lib/money';
import * as Icons from 'lucide-react';

export const PlanDashboard: React.FC = () => {
  const expenses = useStore(expensesStore);
  const goals = useStore(goalsStore);

  const [salaryNum, setSalaryNum] = useState(50000);
  const [expensePct, setExpensePct] = useState(60);
  const [savingsPct, setSavingsPct] = useState(40);

  useEffect(() => {
    initExpenseStore();
    initGoalStore();

    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('drip_user_salary');
      const ep = localStorage.getItem('drip_expense_pct');
      const sp = localStorage.getItem('drip_savings_pct');
      if (s) setSalaryNum(parseInt(s, 10));
      if (ep) setExpensePct(parseInt(ep, 10));
      if (sp) setSavingsPct(parseInt(sp, 10));
    }
  }, []);

  const salaryPaise = salaryNum * 100;
  const plannedExpensesPaise = Math.round((salaryPaise * expensePct) / 100);
  const plannedSavingsPaise = Math.round((salaryPaise * savingsPct) / 100);

  const totalSpentPaise = expenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
  const totalSavedPaise = goals.reduce((acc, g) => acc + (g.savedPaise || 0), 0);

  const coreFields = [
    {
      id: 'f-1',
      name: 'Expenses',
      kind: 'expenses',
      icon: Icons.ShoppingBag,
      plannedPaise: plannedExpensesPaise,
      currentPaise: totalSpentPaise,
      locked: true,
      color: '#B8ACFA'
    },
    {
      id: 'f-2',
      name: 'Savings',
      kind: 'savings',
      icon: Icons.PiggyBank,
      plannedPaise: plannedSavingsPaise,
      currentPaise: totalSavedPaise,
      locked: true,
      color: '#D8D1FD'
    }
  ];

  const goalFields = goals.map((g, idx) => ({
    id: g.id,
    name: g.name,
    kind: 'goal',
    icon: Icons.Target,
    plannedPaise: g.targetPaise,
    currentPaise: g.savedPaise,
    locked: false,
    color: idx % 2 === 0 ? '#8E7DF0' : '#B8ACFA'
  }));

  const allFields = [...coreFields, ...goalFields];

  const allocationSegments = allFields.map((f) => ({
    id: f.id,
    name: f.name,
    paise: f.plannedPaise,
    color: f.color
  }));

  const spentPct = plannedExpensesPaise > 0 ? Math.min(Math.round((totalSpentPaise / plannedExpensesPaise) * 100), 100) : 0;
  const savedPct = plannedSavingsPaise > 0 ? Math.min(Math.round((totalSavedPaise / plannedSavingsPaise) * 100), 100) : 0;

  return (
    <div className="flex flex-col w-full">
      {/* Planned Income & Allocation Bar on Lavender */}
      <section className="bg-[#B8ACFA] text-black px-5 pt-1 pb-6 flex flex-col gap-4">
        <div className="text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-black/50 block mb-1">
            Planned Monthly Income
          </span>
          <AmountDisplay value={salaryNum.toString()} showCaret={false} />
          <span className="font-caption text-black/60 font-medium block mt-1">
            Base Salary {formatINR(salaryPaise)}
          </span>
        </div>

        {/* Segmented Allocation Bar */}
        <div className="mt-1">
          <div className="flex justify-between items-center text-[12px] font-semibold text-black mb-1.5">
            <span>Allocation Split ({expensePct}% / {savingsPct}%)</span>
            <span>Budget: {formatINR(plannedExpensesPaise)}</span>
          </div>
          <AllocationBar segments={allocationSegments} totalPaise={salaryPaise} onLavenderSurface={true} />
        </div>
      </section>

      {/* SVG Drip Edge */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none h-14 -mt-1 bg-black">
        <svg viewBox="0 0 430 64" preserveAspectRatio="none" className="w-full h-full fill-[#FBF8EC]">
          <path d="M0 64 V44 Q0 30 20 30 H80 Q100 30 100 12 V12 Q100 0 120 0 H175 Q195 0 195 20 V48 Q195 56 215 56 H280 Q300 56 300 24 V16 Q300 0 320 0 H390 Q410 0 410 20 V42 Q410 50 430 50 V64 Z" />
        </svg>
      </div>

      {/* Cream Sheet listing Fields */}
      <section className="flex-1 bg-[#FBF8EC] text-black px-5 pt-4 pb-8 flex flex-col gap-4 min-h-[500px]">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-section text-black font-semibold text-[17px]">Planned Fields ({allFields.length})</h2>
          <a href="/income" className="text-[13px] font-medium text-black/60 hover:text-black transition-colors">+ Add Income</a>
        </div>

        <div className="flex flex-col gap-3">
          {/* Expenses Core Field */}
          <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border border-black/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-black shrink-0 bg-[#B8ACFA] border border-black/5">
                  <Icons.ShoppingBag size={22} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-body-500 text-black text-[15px] leading-tight font-medium">Expenses</span>
                    <span className="text-black/40"><Icons.Lock size={13} /></span>
                  </div>
                  <span className="font-caption text-black/50 text-[12px] mt-0.5">
                    Spent {formatINR(totalSpentPaise)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-body-500 text-black text-[15px] tabular-nums font-semibold">
                  {formatINR(plannedExpensesPaise)}
                </span>
                <span className="block text-[11px] text-black/40">target / mo</span>
              </div>
            </div>

            <ProgressBar
              label={`Spent vs Budget (${spentPct}%)`}
              percent={spentPct}
              subLabel={`${formatINR(Math.max(0, plannedExpensesPaise - totalSpentPaise))} remaining`}
            />
          </div>

          {/* Savings Core Field */}
          <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border border-black/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-black shrink-0 bg-[#D8D1FD] border border-black/5">
                  <Icons.PiggyBank size={22} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-body-500 text-black text-[15px] leading-tight font-medium">Savings</span>
                    <span className="text-black/40"><Icons.Lock size={13} /></span>
                  </div>
                  <span className="font-caption text-black/50 text-[12px] mt-0.5">
                    Saved {formatINR(totalSavedPaise)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-body-500 text-black text-[15px] tabular-nums font-semibold">
                  {formatINR(plannedSavingsPaise)}
                </span>
                <span className="block text-[11px] text-black/40">target / mo</span>
              </div>
            </div>

            <ProgressBar
              label={`Saved vs Goal (${savedPct}%)`}
              percent={savedPct}
              subLabel={`${formatINR(Math.max(0, plannedSavingsPaise - totalSavedPaise))} left to allocate`}
            />
          </div>

          {/* Additional Goal Fields */}
          {goals.map((g) => {
            const goalPct = g.targetPaise > 0 ? Math.min(Math.round((g.savedPaise / g.targetPaise) * 100), 100) : 0;
            return (
              <div key={g.id} className="w-full bg-white rounded-[22px] p-4 shadow-sm border border-black/5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-black shrink-0 bg-[#8E7DF0]/30 border border-black/5">
                      <Icons.Target size={22} strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-500 text-black text-[15px] leading-tight font-medium">{g.name}</span>
                      <span className="font-caption text-black/50 text-[12px] mt-0.5">
                        Saved {formatINR(g.savedPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-body-500 text-black text-[15px] tabular-nums font-semibold">
                      {formatINR(g.targetPaise)}
                    </span>
                    <span className="block text-[11px] text-black/40">goal target</span>
                  </div>
                </div>

                <ProgressBar
                  label={`Progress (${goalPct}%)`}
                  percent={goalPct}
                  subLabel={`${formatINR(Math.max(0, g.targetPaise - g.savedPaise))} remaining`}
                />
              </div>
            );
          })}

          {/* Add New Goal Field button */}
          <a
            href="/goals"
            className="w-full h-16 rounded-[22px] border-2 border-dashed border-black/20 flex items-center justify-center gap-2 text-black/60 font-body-500 hover:text-black hover:border-black/40 transition-colors active:scale-[0.98] bg-white/40"
          >
            <Icons.Plus size={20} strokeWidth={2} />
            <span>Add New Goal Field</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default PlanDashboard;
