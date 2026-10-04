import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const shortcutConfig = {
    version: 1,
    categories: [
      {
        name: 'Drip Expense Tracker',
        shortcuts: [
          {
            name: 'Add Expense by Voice',
            description: 'Log expense quickly using Drip NLP parser',
            icon: 'cash',
            url: `${origin}/api/quick-add`,
            method: 'POST',
            headers: [
              { key: 'Authorization', value: 'Bearer YOUR_PERSONAL_TOKEN_HERE' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: JSON.stringify({ text: '{input_text}' }),
            responseHandling: {
              successMessage: '{response.message}',
              speakResponse: true
            }
          }
        ]
      }
    ]
  };

  return new Response(JSON.stringify(shortcutConfig, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="drip-shortcuts.json"'
    }
  });
};
