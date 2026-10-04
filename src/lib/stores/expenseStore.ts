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

// Initialize from localStorage and sync with cloud database in browser
export function initExpenseStore() {
  if (typeof window === 'undefined') return;

  // 1. Instant local read for zero-delay UI rendering
  try {
    const saved = localStorage.getItem('drip_local_expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        expensesStore.set(parsed);
      }
    }
  } catch {}

  // 2. Sync expenses with Supabase cloud database
  fetch('/api/expenses')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.expenses) && data.expenses.length > 0) {
        const cloudExpenses: ExpenseItem[] = data.expenses.map((e: any) => ({
          id: e.id,
          title: e.label,
          category: e.categories?.name || 'General',
          iconName: e.categories?.icon || 'Receipt',
          amountPaise: e.amount_paise,
          date: new Date(e.spent_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
          })
        }));

        const currentLocal = expensesStore.get();
        const combined = [...cloudExpenses];

        // Keep local expenses that are not yet in cloud
        for (const local of currentLocal) {
          if (!combined.some((c) => c.id === local.id || (c.title === local.title && c.amountPaise === local.amountPaise))) {
            combined.unshift(local);
          }
        }

        expensesStore.set(combined);
        try {
          localStorage.setItem('drip_local_expenses', JSON.stringify(combined));
        } catch {}
      }
    })
    .catch(() => {});

  // 3. Sync profile and budget preferences across devices
  fetch('/api/profile')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.authenticated && data.user) {
        if (data.user.name) localStorage.setItem('drip_user_name', data.user.name);
        if (data.user.salary) localStorage.setItem('drip_user_salary', data.user.salary.toString());
        if (data.user.expensePct) localStorage.setItem('drip_expense_pct', data.user.expensePct.toString());
        if (data.user.savingsPct) localStorage.setItem('drip_savings_pct', data.user.savingsPct.toString());
      }
    })
    .catch(() => {});
}

export function addLocalExpense(expense: Omit<ExpenseItem, 'id' | 'date'>) {
  const tempId = 'tx-' + Date.now();
  const newTx: ExpenseItem = {
    ...expense,
    id: tempId,
    date: 'Just now'
  };

  const current = expensesStore.get();
  const updated = [newTx, ...current];
  expensesStore.set(updated);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('drip_local_expenses', JSON.stringify(updated));
    } catch {}

    // Persist to backend database
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaise: expense.amountPaise,
        categoryId: expense.category,
        label: expense.title,
        source: 'manual'
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res?.expense?.id) {
          const store = expensesStore.get();
          const refreshed = store.map((item) =>
            item.id === tempId ? { ...item, id: res.expense.id } : item
          );
          expensesStore.set(refreshed);
          try {
            localStorage.setItem('drip_local_expenses', JSON.stringify(refreshed));
          } catch {}
        }
      })
      .catch(() => {});
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

