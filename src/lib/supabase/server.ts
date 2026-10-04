import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './types';

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://zylnyxgpfsdpuwnpxnnp.supabase.co';
const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bG55eGdwZnNkcHV3bnB4bm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTMyMzQsImV4cCI6MjEwNjYyOTIzNH0.HVrN3G1zTI_2K3jwPmYzSHHnICpL6IgP3dr4cLA68P0';


export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options as any);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options as any);
      }
    }
  });
}
