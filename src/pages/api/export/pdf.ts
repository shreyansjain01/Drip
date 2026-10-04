import type { APIRoute } from 'astro';
import { generatePdfReport } from '../../../lib/export/pdf';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const buffer = await generatePdfReport({
      expenses: [],
      goals: []
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Drip-Expense-Report.pdf"'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
