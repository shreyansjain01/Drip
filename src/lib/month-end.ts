/**
 * Pure evaluation functions for month-end results and congratulations logic.
 */

export interface MonthEndEvaluationInput {
  expenseTargetPaise: number;
  totalSpentPaise: number;
  savingsTargetPaise: number;
  totalSavedPaise: number;
}

export interface MonthEndOutcome {
  expenseGoalMet: boolean;
  savingsGoalMet: boolean;
  message: string;
  congratsType: 'both' | 'under_budget' | 'savings_hit' | 'none';
}

export function evaluateMonthEnd(input: MonthEndEvaluationInput): MonthEndOutcome {
  const hasExpenseTarget = input.expenseTargetPaise > 0;
  const hasSavingsTarget = input.savingsTargetPaise > 0;

  const expenseGoalMet = hasExpenseTarget && input.totalSpentPaise <= input.expenseTargetPaise;
  const savingsGoalMet = hasSavingsTarget && input.totalSavedPaise >= input.savingsTargetPaise;

  let congratsType: 'both' | 'under_budget' | 'savings_hit' | 'none' = 'none';
  let message = '';

  if (expenseGoalMet && savingsGoalMet) {
    congratsType = 'both';
    message = 'You stayed under budget AND hit your savings target this month! 🎉💜';
  } else if (expenseGoalMet) {
    congratsType = 'under_budget';
    message = 'You stayed under budget this month 🎉 Your wallet is proud.';
  } else if (savingsGoalMet) {
    congratsType = 'savings_hit';
    message = 'Savings target smashed 💜 Great job on your savings plan.';
  }

  return {
    expenseGoalMet,
    savingsGoalMet,
    message,
    congratsType
  };
}
