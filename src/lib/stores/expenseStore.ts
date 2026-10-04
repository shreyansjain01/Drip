import { atom } from 'nanostores';

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  iconName: string;
  amountPaise: number;
  date: string;
}

export const expensesStore = atom<ExpenseItem[]>([]);

// Initialize from localStorage in browser
export function initExpenseStore() {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('drip_local_expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(p => p.id === 'tx-1' && p.title === 'Netflix');
        if (isLegacyMock) {
          localStorage.setItem('drip_local_expenses', JSON.stringify([]));
          expensesStore.set([]);
          return;
        }
        expensesStore.set(parsed);
        return;
      }
    }
    expensesStore.set([]);
    localStorage.setItem('drip_local_expenses', JSON.stringify([]));
  } catch {}
}

export function addLocalExpense(expense: Omit<ExpenseItem, 'id' | 'date'>) {
  const newTx: ExpenseItem = {
    ...expense,
    id: 'tx-' + Date.now(),
    date: 'Just now'
  };

  const current = expensesStore.get();
  const updated = [newTx, ...current];
  expensesStore.set(updated);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('drip_local_expenses', JSON.stringify(updated));
    } catch {}
  }
}

export function deleteLocalExpense(id: string) {
  const current = expensesStore.get();
  const updated = current.filter((e) => e.id !== id);
  expensesStore.set(updated);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('drip_local_expenses', JSON.stringify(updated));
    } catch {}

    // Also send backend delete request
    fetch('/api/expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});
  }
}
