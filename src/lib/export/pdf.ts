import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINRForPdf } from '../money';

export async function generatePdfReport(data: {
  userName?: string;
  salaryPaise?: number;
  expensePct?: number;
  savingsPct?: number;
  dateRangeLabel?: string;
  expenses: any[];
  goals: any[];
}): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const userName = data.userName || 'User';
  const salaryPaise = data.salaryPaise || 0;
  const expensePct = data.expensePct ?? 60;
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

  // 1. BRANDED COVER HEADER (Lavender surface)
  doc.setFillColor(184, 172, 250); // #B8ACFA
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Drip', 20, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Financial & Expense Report · ${userName}`, 20, 30);

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Generated: ${dateStr}`, 20, 38);
  doc.text(`Period: ${data.dateRangeLabel || 'All Time'}`, 140, 38);

  // 2. SUMMARY METRICS
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Financial Overview', 20, 56);

  autoTable(doc, {
    startY: 60,
    head: [['Financial Metric', 'Amount (INR)']],
    body: [
      ['Monthly Planned Salary', formatINRForPdf(salaryPaise)],
      [`Monthly Expense Budget (${expensePct}%)`, formatINRForPdf(budgetPaise)],
      ['Total Expenses Logged', formatINRForPdf(totalSpentPaise)],
      ['Remaining Expense Budget', formatINRForPdf(remainingBudgetPaise)],
      ['Total Saved in Goals', formatINRForPdf(totalSavedPaise)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9.5 }
  });

  // 3. CATEGORY BREAKDOWN
  // @ts-ignore
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 110;

  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    const catName = exp.category || exp.categories?.name || 'General';
    const amount = exp.amount_paise || exp.amountPaise || 0;
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + amount);
  }

  if (categoryMap.size > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Spending by Category', 20, currentY);

    const categoryRows = Array.from(categoryMap.entries()).map(([cat, amt]) => {
      const pct = totalSpentPaise > 0 ? Math.round((amt / totalSpentPaise) * 100) : 0;
      return [cat, formatINRForPdf(amt), `${pct}%`];
    });

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Category', 'Total Spent', '% of Total']],
      body: categoryRows,
      theme: 'grid',
      headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 9 }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 4. EXPENSES TABLE
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Expense Transactions (${expenses.length})`, 20, currentY);

  const expenseRows =
    expenses.length > 0
      ? expenses.map((e) => {
          const rawDate = e.spent_at || e.spentAt || e.date;
          let formattedDate = '-';
          try {
            formattedDate = new Date(rawDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            if (formattedDate === 'Invalid Date') formattedDate = String(rawDate);
          } catch {
            formattedDate = String(rawDate || '-');
          }
          return [
            formattedDate,
            e.label || e.title || 'Expense',
            e.category || e.categories?.name || 'General',
            formatINRForPdf(e.amount_paise || e.amountPaise || 0)
          ];
        })
      : [['-', 'No expenses recorded for this period', '-', formatINRForPdf(0)]];

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Label / Description', 'Category', 'Amount']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  // 5. GOALS TABLE
  // @ts-ignore
  let goalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;
  if (goalY > 230) {
    doc.addPage();
    goalY = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Savings Goals (${goals.length})`, 20, goalY);

  const goalRows =
    goals.length > 0
      ? goals.map((g) => {
          const target = g.target_paise || g.targetPaise || 0;
          const saved = g.saved_paise || g.savedPaise || 0;
          const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
          return [
            g.name || 'Savings Goal',
            formatINRForPdf(saved),
            formatINRForPdf(target),
            `${pct}%`
          ];
        })
      : [['-', 'No active savings goals', '-', '-']];

  autoTable(doc, {
    startY: goalY + 4,
    head: [['Goal Name', 'Saved', 'Target', 'Progress']],
    body: goalRows,
    theme: 'grid',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
