import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { expensesStore, initExpenseStore, deleteLocalExpense } from '../../lib/stores/expenseStore';
import { formatINR } from '../../lib/money';
import * as Icons from 'lucide-react';

export const ExpensesListView: React.FC = () => {
  const expenses = useStore(expensesStore);
  const [search, setSearch] = useState('');

  useEffect(() => {
    initExpenseStore();
  }, []);

  const filtered = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalFilteredPaise = filtered.reduce((acc, e) => acc + (e.amountPaise || 0), 0);

  const handleDelete = (id: string) => {
    deleteLocalExpense(id);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="px-1">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses or categories..."
          className="w-full h-11 px-4 bg-white/40 placeholder:text-black/40 text-black border border-black/10 rounded-[14px] text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="flex justify-between items-center text-black/60 text-[12px] font-medium border-b border-black/10 pb-2 px-1">
        <span>Showing {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}</span>
        <span>Total: {formatINR(totalFilteredPaise)}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-white/30 rounded-[20px] border border-black/5 p-6 mt-2">
          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-black/60 mb-2.5">
            <Icons.Receipt size={22} strokeWidth={1.5} />
          </div>
          <p className="font-body-500 text-[15px] text-black">
            {search ? 'No matching expenses found' : 'No expenses logged yet'}
          </p>
          <p className="text-[12px] text-black/50 mt-1 max-w-[240px]">
            {search ? 'Try searching for something else' : 'Add your first expense with the voice mic or keypad.'}
          </p>
          <a
            href="/add"
            className="mt-4 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full active:scale-95 transition-transform"
          >
            + Add Expense
          </a>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((tx) => {
            // @ts-ignore
            const IconComp = Icons[tx.iconName] || Icons.ShoppingBag;
            const formatted = formatINR(tx.amountPaise);

            return (
              <React.Fragment key={tx.id}>
                <div className="w-full flex items-center justify-between py-3 group select-none relative transition-colors hover:bg-black/5 rounded-xl px-2 -mx-2">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-[14px] bg-white/40 flex items-center justify-center text-black shrink-0 border border-black/5">
                      <IconComp size={20} strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col text-left truncate">
                      <span className="font-body-500 text-black truncate leading-tight font-medium">{tx.title}</span>
                      <span className="font-caption text-black/50 truncate mt-0.5 text-[12px]">{tx.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    <div className="text-right">
                      <span className="font-body-500 text-black tabular-nums font-semibold">-{formatted}</span>
                      <span className="block font-micro text-black/40 mt-0.5 text-[11px]">{tx.date}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
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
  );
};

export default ExpensesListView;
