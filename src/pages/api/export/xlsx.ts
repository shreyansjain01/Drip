import type { APIRoute } from 'astro';
import { generateExcelReport } from '../../../lib/export/xlsx';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const buffer = await generateExcelReport({
      expenses: [],
      goals: [],
      incomes: [],
      categories: []
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Drip-Expense-Report.xlsx"'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
