import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://drip-mock-project.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'mock_anon_key';

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
