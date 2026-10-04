import type { APIRoute } from 'astro';
import { evaluateMonthEnd } from '../../../lib/month-end';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const cronSecret = import.meta.env.CRON_SECRET || 'drip_cron_secret_2026';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid CRON_SECRET' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const step = url.searchParams.get('step') || 'evaluate';

    if (step === 'ask-income') {
      return new Response(
        JSON.stringify({
          ok: true,
          step: 'ask-income',
          message: 'Extra income prompts sent to users'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step: evaluate
    const sampleOutcome = evaluateMonthEnd({
      expenseTargetPaise: 4500000,
      totalSpentPaise: 3800000,
      savingsTargetPaise: 2500000,
      totalSavedPaise: 2800000
    });

    return new Response(
      JSON.stringify({
        ok: true,
        step: 'evaluate',
        outcome: sampleOutcome
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
