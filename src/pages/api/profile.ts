import type { APIRoute } from 'astro';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  salary: z.number().int().min(0).optional(),
  expensePct: z.number().min(0).max(100).optional(),
  savingsPct: z.number().min(0).max(100).optional(),
  onboardingDone: z.boolean().optional()
});

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  const supabase = locals.supabase;

  if (!user) {
    return new Response(JSON.stringify({ authenticated: false, user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: planFields } = await supabase
      .from('plan_fields')
      .select('*')
      .eq('user_id', user.id);

    const expenseField = planFields?.find((f: any) => f.kind === 'expenses');
    const savingsField = planFields?.find((f: any) => f.kind === 'savings');

    const salaryPaise = profile?.monthly_salary_paise ?? 5000000;
    const salary = salaryPaise / 100;

    let expensePct = 60;
    let savingsPct = 40;

    if (expenseField && salaryPaise > 0) {
      expensePct = Math.round((Number(expenseField.planned_paise) / salaryPaise) * 100);
      savingsPct = 100 - expensePct;
    }

    const displayName =
      profile?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: displayName,
          salary,
          expensePct,
          savingsPct,
          onboardingDone: profile?.onboarding_done ?? false,
          avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  const supabase = locals.supabase;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, salary, expensePct = 60, savingsPct = 40, onboardingDone = true } = parsed.data;
    const salaryPaise = salary ? salary * 100 : 5000000;

    // Upsert Profile
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name || user.user_metadata?.full_name || user.email?.split('@')[0],
      monthly_salary_paise: salaryPaise,
      onboarding_done: onboardingDone
    });

    // Upsert Plan Fields for budget breakdown
    const expensesPlannedPaise = Math.round((salaryPaise * expensePct) / 100);
    const savingsPlannedPaise = Math.round((salaryPaise * savingsPct) / 100);

    // Delete existing standard fields and reinsert cleanly
    await supabase.from('plan_fields').delete().eq('user_id', user.id).in('kind', ['expenses', 'savings']);

    await supabase.from('plan_fields').insert([
      {
        user_id: user.id,
        kind: 'expenses',
        name: 'Expenses',
        planned_paise: expensesPlannedPaise,
        sort_order: 1,
        locked: false
      },
      {
        user_id: user.id,
        kind: 'savings',
        name: 'Savings',
        planned_paise: savingsPlannedPaise,
        sort_order: 2,
        locked: false
      }
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
