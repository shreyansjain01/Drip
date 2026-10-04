import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { expensesStore, initExpenseStore, deleteLocalExpense } from '../../lib/stores/expenseStore';
import AmountDisplay from '../ui/AmountDisplay';
import { formatINR } from '../../lib/money';
import * as Icons from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const expenses = useStore(expensesStore);

  useEffect(() => {
    initExpenseStore();
  }, []);

  const totalSpentPaise = expenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);

  const salaryStr = typeof window !== 'undefined' ? localStorage.getItem('drip_user_salary') : null;
  const expensePctStr = typeof window !== 'undefined' ? localStorage.getItem('drip_expense_pct') : null;
  const salaryNum = salaryStr ? parseInt(salaryStr, 10) : 50000;
  const expensePct = expensePctStr ? parseInt(expensePctStr, 10) : 60;
  const budgetPaise = Math.round((salaryNum * 100 * expensePct) / 100);
  const remainingPaise = Math.max(0, budgetPaise - totalSpentPaise);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLocalExpense(id);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic Balance Display */}
      <div className="flex flex-col pt-1">
        <AmountDisplay value={(totalSpentPaise / 100).toString()} showCaret={false} />

        {/* Hairline Divider with Meta Info */}
        <div className="w-full h-[1px] bg-black/15 my-3" />
        <div className="flex justify-between items-center text-[11px] font-medium text-black/60 tracking-wider">
          <div className="flex flex-col">
            <span className="text-black font-semibold">
              Budget ₹{(budgetPaise / 100).toLocaleString('en-IN')} · ₹{(remainingPaise / 100).toLocaleString('en-IN')} remaining
            </span>
            <span className="text-black/50 text-[10px] mt-0.5">Oct 2026 · Monthly Plan</span>
          </div>
          <span className="font-bold text-black tracking-widest text-xs border border-black/20 px-2 py-0.5 rounded">
            LIVE
          </span>
        </div>
      </div>

      {/* Static ActionRow placeholder or injected via layout */}
      <div className="w-full flex items-center gap-3 select-none">
        <a
          href="/income"
          className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center text-black shrink-0 pressable shadow-sm active:bg-[#D8D1FD]"
          aria-label="Add Income"
        >
          <Icons.Download size={22} strokeWidth={1.75} />
        </a>
        <a
          href="/analytics"
          className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center text-black shrink-0 pressable shadow-sm active:bg-[#D8D1FD]"
          aria-label="View Analytics"
        >
          <Icons.ArrowUpRight size={22} strokeWidth={1.75} />
        </a>
        <a
          href="/add"
          className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center text-black shrink-0 pressable shadow-sm active:bg-[#D8D1FD]"
          aria-label="Add Expense"
        >
          <Icons.Plus size={22} strokeWidth={1.75} />
        </a>
        <a
          href="/settings"
          className="flex-1 h-14 rounded-[14px] bg-black flex items-center justify-center text-white pressable active:bg-[#1A1A1D]"
          aria-label="More Options & Settings"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white fill-current">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="15" cy="3" r="1.5" />
            <circle cx="3" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
            <circle cx="15" cy="9" r="1.5" />
            <circle cx="3" cy="15" r="1.5" />
            <circle cx="9" cy="15" r="1.5" />
            <circle cx="15" cy="15" r="1.5" />
          </svg>
        </a>
      </div>

      {/* Dynamic Transactions Section */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-section text-black font-semibold">Transactions</h2>
          <a href="/expenses" className="text-[13px] font-medium text-black/60 hover:text-black">
            View all ({expenses.length}) →
          </a>
        </div>

        {expenses.length === 0 ? (
          <div className="w-full py-8 flex flex-col items-center justify-center text-center bg-white/30 rounded-[20px] border border-black/5 p-6 mt-1">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-black/60 mb-2.5">
              <Icons.Receipt size={22} strokeWidth={1.5} />
            </div>
            <p className="font-body-500 text-[15px] text-black">No expenses logged yet</p>
            <p className="text-[12px] text-black/50 mt-1 max-w-[240px]">
              Tap <span className="font-semibold text-black">+</span> or use the microphone to speak your first expense.
            </p>
            <a
              href="/add"
              className="mt-4 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform"
            >
              + Add First Expense
            </a>
          </div>
        ) : (
          <div className="flex flex-col">
            {expenses.map((tx) => {
              // @ts-ignore
              const IconComp = Icons[tx.iconName] || Icons.ShoppingBag;
              const formatted = formatINR(tx.amountPaise);

              return (
                <React.Fragment key={tx.id}>
                  <div className="w-full flex items-center justify-between py-3 group select-none relative transition-colors hover:bg-black/5 rounded-xl px-2 -mx-2">
                    <a href="/expenses" className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-[14px] bg-white/40 flex items-center justify-center text-black shrink-0 border border-black/5">
                        <IconComp size={20} strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-body-500 text-black truncate leading-tight font-medium">{tx.title}</span>
                        <span className="font-caption text-black/50 truncate mt-0.5 text-[12px]">{tx.category}</span>
                      </div>
                    </a>

                    <div className="flex items-center gap-2.5 shrink-0 pl-2">
                      <div className="text-right">
                        <span className="font-body-500 text-black tabular-nums font-semibold">-{formatted}</span>
                        <span className="block font-micro text-black/40 mt-0.5 text-[11px]">{tx.date}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, tx.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-black/30 hover:text-red-500 hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <Icons.Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-[1px] bg-black/10 my-0.5 last:hidden" />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeDashboard;
