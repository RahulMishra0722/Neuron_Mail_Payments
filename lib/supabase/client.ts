import { createBrowserClient } from "@supabase/ssr";

export const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a singleton instance of the Supabase client for Client Components.
// This client is intended for use in client-side components and hooks.
// It will only be initialized if Supabase environment variables are set.
export const supabase = isSupabaseConfigured
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : undefined; // Or a more sophisticated mock if widespread usage without checks

// It's generally recommended that components or hooks using this client
// first check `isSupabaseConfigured` or handle the case where `supabase` might be undefined.
