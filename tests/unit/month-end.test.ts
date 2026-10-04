import { describe, it, expect } from 'vitest';
import { evaluateMonthEnd } from '../../src/lib/month-end';

describe('Month-End Evaluation Rules', () => {
  it('evaluates under-budget and met savings target', () => {
    const outcome = evaluateMonthEnd({
      expenseTargetPaise: 5000000,
      totalSpentPaise: 4200000, // Under budget
      savingsTargetPaise: 2000000,
      totalSavedPaise: 2500000  // Smashed savings target
    });
    expect(outcome.expenseGoalMet).toBe(true);
    expect(outcome.savingsGoalMet).toBe(true);
    expect(outcome.congratsType).toBe('both');
  });

  it('evaluates over-budget but savings target met', () => {
    const outcome = evaluateMonthEnd({
      expenseTargetPaise: 5000000,
      totalSpentPaise: 5500000, // Over budget
      savingsTargetPaise: 2000000,
      totalSavedPaise: 2200000  // Met savings
    });
    expect(outcome.expenseGoalMet).toBe(false);
    expect(outcome.savingsGoalMet).toBe(true);
    expect(outcome.congratsType).toBe('savings_hit');
  });

  it('evaluates missing targets gracefully', () => {
    const outcome = evaluateMonthEnd({
      expenseTargetPaise: 0,
      totalSpentPaise: 3000000,
      savingsTargetPaise: 0,
      totalSavedPaise: 1000000
    });
    expect(outcome.expenseGoalMet).toBe(false);
    expect(outcome.savingsGoalMet).toBe(false);
    expect(outcome.congratsType).toBe('none');
  });
});
