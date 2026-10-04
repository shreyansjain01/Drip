import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get('code');

  if (authCode) {
    const supabase = createSupabaseServerClient(cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (!error) {
      return redirect('/onboarding');
    }
    console.error('Supabase auth callback error:', error);
  }

  // Fallback
  return redirect('/onboarding');
};
