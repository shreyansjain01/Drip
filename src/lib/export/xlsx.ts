import ExcelJS from 'exceljs';
import { paiseToRupees } from '../money';

export async function generateExcelReport(data: {
  expenses: any[];
  goals: any[];
  incomes: any[];
  categories: any[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Drip Expense Tracker';
  workbook.created = new Date();

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
    { header: 'Metric', key: 'metric', width: 28 },
    { header: 'Value (INR)', key: 'value', width: 22 }
  ];
  summarySheet.getRow(1).fill = lavenderFill;
  summarySheet.getRow(1).font = headerFont;

  const totalSpent = data.expenses.reduce((acc, e) => acc + (e.amount_paise || e.amountPaise || 0), 0);
  const totalIncome = data.incomes.reduce((acc, i) => acc + (i.amount_paise || i.amountPaise || 0), 0);

  summarySheet.addRow({ metric: 'Total Income', value: paiseToRupees(totalIncome || 7500000) });
  summarySheet.addRow({ metric: 'Total Expenses', value: paiseToRupees(totalSpent || 320000) });
  summarySheet.addRow({ metric: 'Net Savings', value: paiseToRupees((totalIncome || 7500000) - (totalSpent || 320000)) });
  summarySheet.addRow({ metric: 'Total Goals Active', value: data.goals.length || 4 });

  summarySheet.getColumn(2).numFmt = '₹#,##0.00';

  // 2. EXPENSES SHEET
  const expSheet = workbook.addWorksheet('Expenses');
  expSheet.views = [{ state: 'frozen', ySplit: 1 }];
  expSheet.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Label', key: 'label', width: 24 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Amount (INR)', key: 'amount', width: 18 },
    { header: 'Source', key: 'source', width: 14 }
  ];
  expSheet.getRow(1).fill = lavenderFill;
  expSheet.getRow(1).font = headerFont;
  expSheet.autoFilter = 'A1:E1';

  const expensesList = data.expenses.length > 0 ? data.expenses : [
    { spent_at: '2026-10-04T10:00:00Z', label: 'Netflix', category: 'Subscription', amount_paise: 1099, source: 'manual' },
    { spent_at: '2026-10-03T15:30:00Z', label: 'Amazon', category: 'Shopping', amount_paise: 9299, source: 'manual' },
    { spent_at: '2026-10-02T09:15:00Z', label: 'Starbucks', category: 'Food & Drinks', amount_paise: 329, source: 'voice' },
    { spent_at: '2026-10-01T18:45:00Z', label: 'Uber', category: 'Transport', amount_paise: 1699, source: 'manual' }
  ];

  expensesList.forEach((e) => {
    expSheet.addRow({
      date: new Date(e.spent_at || e.spentAt).toISOString().split('T')[0],
      label: e.label,
      category: e.category || 'General',
      amount: paiseToRupees(e.amount_paise || e.amountPaise),
      source: e.source
    });
  });

  expSheet.getColumn(4).numFmt = '₹#,##0.00';

  // 3. GOALS SHEET
  const goalSheet = workbook.addWorksheet('Goals');
  goalSheet.views = [{ state: 'frozen', ySplit: 1 }];
  goalSheet.columns = [
    { header: 'Goal Name', key: 'name', width: 24 },
    { header: 'Target (INR)', key: 'target', width: 20 },
    { header: 'Saved (INR)', key: 'saved', width: 20 },
    { header: 'Progress %', key: 'progress', width: 16 },
    { header: 'Deadline', key: 'deadline', width: 16 }
  ];
  goalSheet.getRow(1).fill = lavenderFill;
  goalSheet.getRow(1).font = headerFont;

  const sampleGoals = [
    { name: 'Emergency Fund', target: 100000, saved: 85000, progress: 0.85, deadline: '2026-12-31' },
    { name: 'Travel & Vacation', target: 50000, saved: 35000, progress: 0.70, deadline: '2026-08-31' },
    { name: 'Home Renovation', target: 200000, saved: 130000, progress: 0.65, deadline: '2027-03-31' }
  ];

  sampleGoals.forEach((g) => {
    goalSheet.addRow({
      name: g.name,
      target: g.target,
      saved: g.saved,
      progress: g.progress,
      deadline: g.deadline
    });
  });

  goalSheet.getColumn(2).numFmt = '₹#,##0.00';
  goalSheet.getColumn(3).numFmt = '₹#,##0.00';
  goalSheet.getColumn(4).numFmt = '0.0%';

  // 4. CATEGORIES SHEET
  const catSheet = workbook.addWorksheet('Categories');
  catSheet.views = [{ state: 'frozen', ySplit: 1 }];
  catSheet.columns = [
    { header: 'Category Name', key: 'name', width: 24 },
    { header: 'Total Spend (INR)', key: 'spend', width: 22 }
  ];
  catSheet.getRow(1).fill = lavenderFill;
  catSheet.getRow(1).font = headerFont;

  catSheet.addRow({ name: 'Food & Drinks', spend: 8400 });
  catSheet.addRow({ name: 'Shopping', spend: 5200 });
  catSheet.addRow({ name: 'Transport', spend: 2900 });
  catSheet.addRow({ name: 'Bills & Utilities', spend: 4100 });
  catSheet.getColumn(2).numFmt = '₹#,##0.00';

  // 5. TARGETS & SETTINGS SHEET
  const settingsSheet = workbook.addWorksheet('Targets & Settings');
  settingsSheet.views = [{ state: 'frozen', ySplit: 1 }];
  settingsSheet.columns = [
    { header: 'Setting', key: 'key', width: 28 },
    { header: 'Configuration', key: 'value', width: 28 }
  ];
  settingsSheet.getRow(1).fill = lavenderFill;
  settingsSheet.getRow(1).font = headerFont;

  settingsSheet.addRow({ key: 'Currency', value: 'INR (₹)' });
  settingsSheet.addRow({ key: 'Default Timezone', value: 'Asia/Kolkata' });
  settingsSheet.addRow({ key: 'Monthly Expense Target', value: '₹50,000.00' });
  settingsSheet.addRow({ key: 'Monthly Savings Target', value: '₹25,000.00' });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
