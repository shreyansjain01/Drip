import { atom } from 'nanostores';

export interface GoalItem {
  id: string;
  name: string;
  savedPaise: number;
  targetPaise: number;
  deadline?: string;
  color?: string;
  iconName?: string;
}

export const goalsStore = atom<GoalItem[]>([]);

export function initGoalStore() {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('drip_user_goals');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Clean out legacy hardcoded goals if any
        const isLegacyMock = parsed.some(p => p.id === 'goal-1' && p.savedPaise === 8500000);
        if (isLegacyMock) {
          localStorage.setItem('drip_user_goals', JSON.stringify([]));
          goalsStore.set([]);
          return;
        }
        goalsStore.set(parsed);
        return;
      }
    }
    goalsStore.set([]);
    localStorage.setItem('drip_user_goals', JSON.stringify([]));
  } catch {}
}

export function addGoal(goal: Omit<GoalItem, 'id'>) {
  const newGoal: GoalItem = {
    ...goal,
    id: 'goal-' + Date.now()
  };
  const current = goalsStore.get();
  const updated = [...current, newGoal];
  goalsStore.set(updated);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('drip_user_goals', JSON.stringify(updated));
    } catch {}
  }
}
