import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get('code');

  if (authCode) {
    const supabase = createSupabaseServerClient(cookies);
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (!error && data?.user) {
      cookies.set('drip_auth_session', '1', {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax'
      });

      // Check if user already finished onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile && profile.onboarding_done) {
        return redirect('/');
      }

      return redirect('/onboarding');
    }

    if (error) {
      console.error('Supabase auth callback error:', error);
    }
  }

  // Fallback
  return redirect('/onboarding');
};

