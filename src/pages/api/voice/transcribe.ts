import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData().catch(() => null);
    const file = (formData?.get('audio') as Blob) || null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const arrayBuffer = await file.arrayBuffer();

    // 1. Cloudflare Workers AI Whisper (if available in production)
    // @ts-ignore
    const ai = locals.runtime?.env?.AI;
    if (ai) {
      try {
        const response = await ai.run('@cf/openai/whisper', {
          audio: [...new Uint8Array(arrayBuffer)]
        });
        if (response && response.text) {
          return new Response(JSON.stringify({ text: response.text.trim() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (cfErr) {
        console.error('Cloudflare AI Whisper error:', cfErr);
      }
    }

    // 2. Fallback to LLM / Gemini API if configured
    const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = (file.type || 'audio/mp4').split(';')[0];
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'Transcribe this expense voice audio clip into English text. Return ONLY the spoken words (e.g. "paid 150 for lunch" or "petrol 500"). Do not add formatting, markdown, quotes or extra explanation.'
                    },
                    {
                      inlineData: {
                        mimeType,
                        data: base64Audio
                      }
                    }
                  ]
                }
              ]
            })
          }
        );
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (text) {
          return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (gemErr) {
        console.error('Gemini transcribe error:', gemErr);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Server transcription service not configured' }),
      {
        status: 503,
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
