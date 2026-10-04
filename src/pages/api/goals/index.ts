import type { APIRoute } from 'astro';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetPaise: z.number().int().positive('Target amount must be positive'),
  deadline: z.string().optional(),
  icon: z.string().default('Target'),
  color: z.string().default('#B8ACFA'),
  monthlyPlanPaise: z.number().int().optional()
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, targetPaise, deadline, icon, color } = parsed.data;
    const user = locals.user;
    const supabase = locals.supabase;

    if (user) {
      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name,
          target_paise: targetPaise,
          deadline: deadline || null,
          icon,
          color
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Automatically append as a plan_field
      await supabase.from('plan_fields').insert({
        user_id: user.id,
        kind: 'goal',
        goal_id: goal.id,
        name: goal.name,
        planned_paise: parsed.data.monthlyPlanPaise || Math.round(targetPaise / 10),
        sort_order: 3,
        locked: false
      });

      return new Response(JSON.stringify({ ok: true, goal }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        goal: {
          id: 'demo-goal-' + Date.now(),
          name,
          target_paise: targetPaise,
          deadline,
          icon,
          color
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

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  const supabase = locals.supabase;

  if (user) {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*, goal_contributions(*)')
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ goals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ goals: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
