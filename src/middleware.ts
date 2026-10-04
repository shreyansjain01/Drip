import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/server';

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect, locals } = context;
  const supabase = createSupabaseServerClient(cookies);

  // Get current user session
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Attach to locals for use in Astro pages and API endpoints
  locals.user = user;
  locals.supabase = supabase;

  const pathname = url.pathname;
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/quick-add') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/dev/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icons/');

  // Whenever a user is unauthenticated on any new device or session, redirect them to /login
  const hasAuth =
    user ||
    cookies.get('drip_auth_session')?.value ||
    cookies.get('sb-access-token')?.value ||
    cookies.get('drip_demo_session')?.value;

  if (!hasAuth && !isPublicRoute) {
    return redirect('/login');
  }

  return next();
});
