import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder';

export const isSupabaseSchemaReady =
  isSupabaseConfigured && process.env.NEXT_PUBLIC_SUPABASE_SCHEMA_READY === 'true';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
