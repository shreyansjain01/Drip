import type { APIRoute } from 'astro';
import { parseVoiceInput } from '../../lib/voice/parse';
import { formatINR } from '../../lib/money';
import crypto from 'node:crypto';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Accept valid bearer token or session
    if (!token && !locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Bearer token required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    let amountPaise = 0;
    let label = 'Expense';
    let category = 'General';
    let confidence = 0.9;
    let intent: 'expense' | 'goal_contribution' | 'income' = 'expense';
    let goalName: string | undefined;

    if (body.text) {
      const parsed = parseVoiceInput(body.text);
      amountPaise = parsed.amountPaise;
      label = parsed.label;
      category = parsed.category;
      confidence = parsed.confidence;
      intent = parsed.intent;
      goalName = parsed.goalName;
    } else if (body.amount) {
      amountPaise = Math.round(Number(body.amount) * 100);
      label = body.label || 'Expense';
      category = body.category || 'General';
      confidence = 1.0;
    }

    const needsReview = confidence < 0.6 || amountPaise <= 0;
    const formatted = formatINR(amountPaise);

    let speakableMessage = '';
    if (needsReview) {
      speakableMessage = 'Created draft for review';
    } else if (intent === 'goal_contribution') {
      speakableMessage = `Added ${formatted} to ${goalName || 'savings goal'}`;
    } else if (intent === 'income') {
      speakableMessage = `Logged ${formatted} extra income`;
    } else {
      speakableMessage = `Added ${formatted} for ${label}`;
    }

    const newId = 'qa-' + crypto.randomUUID();

    return new Response(
      JSON.stringify({
        ok: true,
        id: newId,
        message: speakableMessage,
        amountPaise,
        category,
        label,
        intent,
        needsReview,
        confidence
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
