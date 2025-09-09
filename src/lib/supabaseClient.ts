import { createClient } from '@supabase/supabase-js';

// Centralized Supabase browser client (anon public key only)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
