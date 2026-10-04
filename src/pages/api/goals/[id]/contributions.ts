import type { APIRoute } from 'astro';
import { z } from 'zod';

const createContributionSchema = z.object({
  amountPaise: z.number().int(), // Positive for deposit, negative for withdraw
  note: z.string().optional(),
  source: z.enum(['manual', 'voice', 'shortcut', 'extra_income_allocation']).default('manual')
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const goalId = params.id;
    const body = await request.json();
    const parsed = createContributionSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { amountPaise, note, source } = parsed.data;
    const user = locals.user;
    const supabase = locals.supabase;

    if (user && goalId) {
      const { data, error } = await supabase
        .from('goal_contributions')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          amount_paise: amountPaise,
          note: note || (amountPaise > 0 ? 'Contribution' : 'Withdrawal'),
          source
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ ok: true, contribution: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        contribution: {
          id: 'demo-contrib-' + Date.now(),
          goal_id: goalId,
          amount_paise: amountPaise,
          note,
          source,
          contributed_at: new Date().toISOString()
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
