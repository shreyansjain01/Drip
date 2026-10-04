import type { APIRoute } from 'astro';
import { generatePdfReport } from '../../../lib/export/pdf';

function getRangeFilter(range: string = 'all') {
  const now = new Date();
  let filterDate: Date | null = null;
  let label = 'All Time';

  if (range === 'this_month') {
    filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    label = 'This Month (' + now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) + ')';
  } else if (range === '3_months') {
    filterDate = new Date();
    filterDate.setMonth(now.getMonth() - 3);
    label = 'Last 3 Months';
  } else if (range === 'this_year') {
    filterDate = new Date(now.getFullYear(), 0, 1);
    label = 'This Year (' + now.getFullYear() + ')';
  }

  return { filterDate, label };
}

function filterExpenses(expenses: any[], filterDate: Date | null) {
  if (!filterDate) return expenses;
  return expenses.filter((e) => {
    const rawDate = e.spent_at || e.spentAt || e.date;
    if (!rawDate) return true;
    const d = new Date(rawDate);
    return isNaN(d.getTime()) || d >= filterDate;
  });
}

async function prepareReportData(url: URL, request: Request, locals: any) {
  const range = url.searchParams.get('range') || 'all';
  const { filterDate, label: dateRangeLabel } = getRangeFilter(range);

  let clientPayload: any = null;
  if (request.method === 'POST') {
    try {
      clientPayload = await request.json();
    } catch {}
  }

  const user = locals.user;
  const supabase = locals.supabase;

  let userName = clientPayload?.userName || 'User';
  let salaryPaise = clientPayload?.salary ? Number(clientPayload.salary) * 100 : (clientPayload?.salaryPaise || 5000000);
  let expensePct = clientPayload?.expensePct ?? 60;
  let savingsPct = clientPayload?.savingsPct ?? 40;
  let expenses: any[] = Array.isArray(clientPayload?.expenses) ? clientPayload.expenses : [];
  let goals: any[] = Array.isArray(clientPayload?.goals) ? clientPayload.goals : [];

  if (user && supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.display_name) userName = profile.display_name;
        if (profile.monthly_salary_paise) salaryPaise = profile.monthly_salary_paise;
      }

      const { data: planFields } = await supabase
        .from('plan_fields')
        .select('*')
        .eq('user_id', user.id);

      const expField = planFields?.find((f: any) => f.kind === 'expenses');
      if (expField && salaryPaise > 0) {
        expensePct = Math.round((Number(expField.planned_paise) / salaryPaise) * 100);
        savingsPct = 100 - expensePct;
      }

      // Fetch cloud expenses
      const { data: cloudExpenses } = await supabase
        .from('expenses')
        .select('*, categories(name, icon)')
        .eq('user_id', user.id)
        .order('spent_at', { ascending: false });

      if (cloudExpenses && cloudExpenses.length > 0) {
        // Merge cloud with client payload if client had extra items
        const combined = [...cloudExpenses];
        for (const exp of expenses) {
          if (!combined.some((c) => c.id === exp.id || (c.label === exp.title && c.amount_paise === exp.amountPaise))) {
            combined.unshift(exp);
          }
        }
        expenses = combined;
      }

      // Fetch cloud goals
      const { data: cloudGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (cloudGoals && cloudGoals.length > 0) {
        goals = cloudGoals;
      }
    } catch (err) {
      console.error('Supabase query error during PDF export:', err);
    }
  }

  // Filter expenses according to date range
  const filteredExpenses = filterExpenses(expenses, filterDate);

  return {
    userName,
    salaryPaise,
    expensePct,
    savingsPct,
    dateRangeLabel: clientPayload?.dateRangeLabel || dateRangeLabel,
    expenses: filteredExpenses,
    goals
  };
}

export const GET: APIRoute = async ({ url, request, locals }) => {
  try {
    const data = await prepareReportData(url, request, locals);
    const buffer = await generatePdfReport(data);

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

export const POST: APIRoute = async ({ url, request, locals }) => {
  try {
    const data = await prepareReportData(url, request, locals);
    const buffer = await generatePdfReport(data);

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
