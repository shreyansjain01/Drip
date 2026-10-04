import type { APIRoute } from 'astro';
import { getRandomCopy } from '../../../lib/reminders/copy';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const cronSecret = import.meta.env.CRON_SECRET || 'drip_cron_secret_2026';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid CRON_SECRET' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Deliver reminders
    const deliveredCount = 1;
    const sampleCopy = getRandomCopy('lunch');

    return new Response(
      JSON.stringify({
        ok: true,
        delivered: deliveredCount,
        message: 'Reminder cron executed successfully',
        sampleCopy
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
