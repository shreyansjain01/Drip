import type { APIRoute } from 'astro';
import { z } from 'zod';

const createExpenseSchema = z.object({
  amountPaise: z.number().int().positive('Amount must be greater than 0'),
  categoryId: z.string().uuid().or(z.string().min(1)),
  label: z.string().min(1, 'Label is required'),
  source: z.enum(['voice', 'manual', 'shortcut']).default('manual'),
  spentAt: z.string().datetime().optional()
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const result = createExpenseSchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { amountPaise, categoryId, label, source, spentAt } = result.data;
    const user = locals.user;
    const supabase = locals.supabase;

    if (user) {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          amount_paise: amountPaise,
          category_id: categoryId,
          label,
          source,
          spent_at: spentAt || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ ok: true, expense: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In local demo mode if not authenticated
    return new Response(
      JSON.stringify({
        ok: true,
        expense: {
          id: 'demo-' + Date.now(),
          amount_paise: amountPaise,
          category_id: categoryId,
          label,
          source,
          spent_at: spentAt || new Date().toISOString()
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  const supabase = locals.supabase;

  if (user) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .is('deleted_at', null)
      .order('spent_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ expenses: data || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ expenses: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { id } = await request.json();
    const user = locals.user;
    const supabase = locals.supabase;

    if (user && id) {
      await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

