import ExcelJS from 'exceljs';
import { paiseToRupees } from '../money';

export async function generateExcelReport(data: {
  userName?: string;
  salaryPaise?: number;
  expensePct?: number;
  savingsPct?: number;
  dateRangeLabel?: string;
  expenses: any[];
  goals: any[];
  incomes?: any[];
  categories?: any[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Drip Expense Tracker';
  workbook.created = new Date();

  const userName = data.userName || 'User';
  const salaryPaise = data.salaryPaise || 0;
  const expensePct = data.expensePct ?? 60;
  const savingsPct = data.savingsPct ?? 40;
  const budgetPaise = Math.round((salaryPaise * expensePct) / 100);

  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];

  const totalSpentPaise = expenses.reduce(
    (acc, e) => acc + (e.amount_paise || e.amountPaise || 0),
    0
  );
  const totalSavedPaise = goals.reduce(
    (acc, g) => acc + (g.saved_paise || g.savedPaise || 0),
    0
  );
  const remainingBudgetPaise = Math.max(0, budgetPaise - totalSpentPaise);

  const lavenderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB8ACFA' }
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: 'FF000000' }
  };

  // 1. SUMMARY SHEET
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.views = [{ state: 'frozen', ySplit: 1 }];
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 34 },
    { header: 'Value', key: 'value', width: 24 }
  ];
  summarySheet.getRow(1).fill = lavenderFill;
  summarySheet.getRow(1).font = headerFont;

  summarySheet.addRow({ metric: 'User Profile', value: userName });
  summarySheet.addRow({ metric: 'Report Period', value: data.dateRangeLabel || 'All Time' });
  summarySheet.addRow({ metric: 'Monthly Planned Salary', value: paiseToRupees(salaryPaise) });
  summarySheet.addRow({ metric: `Monthly Expense Budget (${expensePct}%)`, value: paiseToRupees(budgetPaise) });
  summarySheet.addRow({ metric: 'Total Expenses Logged', value: paiseToRupees(totalSpentPaise) });
  summarySheet.addRow({ metric: 'Remaining Expense Budget', value: paiseToRupees(remainingBudgetPaise) });
  summarySheet.addRow({ metric: 'Total Saved in Goals', value: paiseToRupees(totalSavedPaise) });
  summarySheet.addRow({ metric: 'Active Savings Goals Count', value: goals.length });

  // Format currency cells
  summarySheet.getCell('B3').numFmt = '₹#,##0.00';
  summarySheet.getCell('B4').numFmt = '₹#,##0.00';
  summarySheet.getCell('B5').numFmt = '₹#,##0.00';
  summarySheet.getCell('B6').numFmt = '₹#,##0.00';
  summarySheet.getCell('B7').numFmt = '₹#,##0.00';

  // 2. EXPENSES SHEET
  const expSheet = workbook.addWorksheet('Expenses');
  expSheet.views = [{ state: 'frozen', ySplit: 1 }];
  expSheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Label / Description', key: 'label', width: 28 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Amount (INR)', key: 'amount', width: 20 },
    { header: 'Source', key: 'source', width: 16 }
  ];
  expSheet.getRow(1).fill = lavenderFill;
  expSheet.getRow(1).font = headerFont;
  expSheet.autoFilter = 'A1:E1';

  if (expenses.length > 0) {
    expenses.forEach((e) => {
      let dateFormatted = '-';
      const dateVal = e.spent_at || e.spentAt || e.date;
      if (dateVal) {
        try {
          dateFormatted = new Date(dateVal).toISOString().split('T')[0];
        } catch {
          dateFormatted = String(dateVal);
        }
      }
      expSheet.addRow({
        date: dateFormatted,
        label: e.label || e.title || 'Expense',
        category: e.category || e.categories?.name || 'General',
        amount: paiseToRupees(e.amount_paise || e.amountPaise || 0),
        source: e.source || 'manual'
      });
    });
    expSheet.getColumn(4).numFmt = '₹#,##0.00';
  } else {
    expSheet.addRow({
      date: '-',
      label: 'No expenses recorded for this period',
      category: '-',
      amount: 0,
      source: '-'
    });
    expSheet.getColumn(4).numFmt = '₹#,##0.00';
  }

  // 3. GOALS SHEET
  const goalSheet = workbook.addWorksheet('Goals');
  goalSheet.views = [{ state: 'frozen', ySplit: 1 }];
  goalSheet.columns = [
    { header: 'Goal Name', key: 'name', width: 26 },
    { header: 'Target (INR)', key: 'target', width: 22 },
    { header: 'Saved (INR)', key: 'saved', width: 22 },
    { header: 'Progress %', key: 'progress', width: 16 },
    { header: 'Deadline', key: 'deadline', width: 18 }
  ];
  goalSheet.getRow(1).fill = lavenderFill;
  goalSheet.getRow(1).font = headerFont;

  if (goals.length > 0) {
    goals.forEach((g) => {
      const target = paiseToRupees(g.target_paise || g.targetPaise || 0);
      const saved = paiseToRupees(g.saved_paise || g.savedPaise || 0);
      const progressRatio = target > 0 ? saved / target : 0;
      goalSheet.addRow({
        name: g.name || 'Savings Goal',
        target,
        saved,
        progress: progressRatio,
        deadline: g.deadline || '-'
      });
    });
    goalSheet.getColumn(2).numFmt = '₹#,##0.00';
    goalSheet.getColumn(3).numFmt = '₹#,##0.00';
    goalSheet.getColumn(4).numFmt = '0.0%';
  } else {
    goalSheet.addRow({
      name: 'No active savings goals',
      target: 0,
      saved: 0,
      progress: 0,
      deadline: '-'
    });
    goalSheet.getColumn(2).numFmt = '₹#,##0.00';
    goalSheet.getColumn(3).numFmt = '₹#,##0.00';
    goalSheet.getColumn(4).numFmt = '0.0%';
  }

  // 4. CATEGORIES SHEET - Grouped dynamically from actual expenses
  const catSheet = workbook.addWorksheet('Categories');
  catSheet.views = [{ state: 'frozen', ySplit: 1 }];
  catSheet.columns = [
    { header: 'Category Name', key: 'name', width: 26 },
    { header: 'Total Spend (INR)', key: 'spend', width: 22 },
    { header: '% of Total Spend', key: 'pct', width: 18 }
  ];
  catSheet.getRow(1).fill = lavenderFill;
  catSheet.getRow(1).font = headerFont;

  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    const catName = exp.category || exp.categories?.name || 'General';
    const amount = exp.amount_paise || exp.amountPaise || 0;
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + amount);
  }

  if (categoryMap.size > 0) {
    for (const [catName, amountPaise] of categoryMap.entries()) {
      const catSpendRupees = paiseToRupees(amountPaise);
      const catPct = totalSpentPaise > 0 ? amountPaise / totalSpentPaise : 0;
      catSheet.addRow({
        name: catName,
        spend: catSpendRupees,
        pct: catPct
      });
    }
    catSheet.getColumn(2).numFmt = '₹#,##0.00';
    catSheet.getColumn(3).numFmt = '0.0%';
  } else {
    catSheet.addRow({
      name: 'No expense categories recorded',
      spend: 0,
      pct: 0
    });
    catSheet.getColumn(2).numFmt = '₹#,##0.00';
    catSheet.getColumn(3).numFmt = '0.0%';
  }

  // 5. TARGETS & SETTINGS SHEET
  const settingsSheet = workbook.addWorksheet('Targets & Settings');
  settingsSheet.views = [{ state: 'frozen', ySplit: 1 }];
  settingsSheet.columns = [
    { header: 'Setting', key: 'key', width: 34 },
    { header: 'Configuration', key: 'value', width: 30 }
  ];
  settingsSheet.getRow(1).fill = lavenderFill;
  settingsSheet.getRow(1).font = headerFont;

  settingsSheet.addRow({ key: 'User Name', value: userName });
  settingsSheet.addRow({ key: 'Currency', value: 'INR (₹)' });
  settingsSheet.addRow({ key: 'Default Timezone', value: 'Asia/Kolkata' });
  settingsSheet.addRow({ key: 'Monthly Salary', value: paiseToRupees(salaryPaise) });
  settingsSheet.addRow({ key: `Expense Budget Allocation (${expensePct}%)`, value: paiseToRupees(budgetPaise) });
  settingsSheet.addRow({ key: `Savings Target Allocation (${savingsPct}%)`, value: paiseToRupees(Math.round((salaryPaise * savingsPct) / 100)) });

  settingsSheet.getCell('B4').numFmt = '₹#,##0.00';
  settingsSheet.getCell('B5').numFmt = '₹#,##0.00';
  settingsSheet.getCell('B6').numFmt = '₹#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
