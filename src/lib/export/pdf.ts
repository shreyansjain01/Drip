import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINRForPdf } from '../money';

export async function generatePdfReport(data: {
  userName?: string;
  expenses: any[];
  goals: any[];
}): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. BRANDED COVER HEADER (Lavender surface)
  doc.setFillColor(184, 172, 250); // #B8ACFA
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Drip', 20, 24);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial & Expense Report', 20, 34);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 150, 34);

  // 2. SUMMARY METRICS
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Overview', 20, 60);

  autoTable(doc, {
    startY: 65,
    head: [['Metric', 'Amount (INR)']],
    body: [
      ['Monthly Planned Salary', formatINRForPdf(7500000)],
      ['Total Expenses', formatINRForPdf(320000)],
      ['Total Savings & Goals', formatINRForPdf(26850000)],
      ['Remaining Budget', formatINRForPdf(4680000)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10 }
  });

  // 3. EXPENSES TABLE
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  // @ts-ignore
  const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
  doc.text('Expense Transactions', 20, nextY);

  const sampleExpenses = [
    ['2026-10-04', 'Netflix Subscription', 'Subscription', formatINRForPdf(1099)],
    ['2026-10-03', 'Amazon Shopping', 'Shopping', formatINRForPdf(9299)],
    ['2026-10-02', 'Starbucks Coffee', 'Food & Drinks', formatINRForPdf(329)],
    ['2026-10-01', 'Uber Commute', 'Transport', formatINRForPdf(1699)],
    ['2026-09-30', 'Swiggy Dinner', 'Food & Drinks', formatINRForPdf(45000)],
    ['2026-09-28', 'Electricity Bill', 'Bills & Utilities', formatINRForPdf(245000)]
  ];

  autoTable(doc, {
    startY: nextY + 5,
    head: [['Date', 'Label', 'Category', 'Amount']],
    body: sampleExpenses,
    theme: 'striped',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10 }
  });

  // 4. GOALS TABLE
  // @ts-ignore
  const goalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
  doc.text('Savings Goals Progress', 20, goalY);

  autoTable(doc, {
    startY: goalY + 5,
    head: [['Goal Name', 'Saved', 'Target', 'Progress']],
    body: [
      ['Emergency Fund', formatINRForPdf(8500000), formatINRForPdf(10000000), '85%'],
      ['Travel & Vacation', formatINRForPdf(3500000), formatINRForPdf(5000000), '70%'],
      ['Home Renovation', formatINRForPdf(13000000), formatINRForPdf(20000000), '65%'],
      ['Healthcare Buffer', formatINRForPdf(1850000), formatINRForPdf(5000000), '37%']
    ],
    theme: 'grid',
    headStyles: { fillColor: [184, 172, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10 }
  });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
