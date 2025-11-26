/**
 * Edge-compatible database client using Supabase REST API
 * This works in Edge runtime (Vercel)
 */
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable is not set');
}

// Create Supabase client for Edge runtime
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

