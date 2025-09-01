import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Only create Supabase client if we have a valid Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log("🔧 Supabase Config:", {
  nodeEnv: process.env.NODE_ENV,
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  supabaseUrl: supabaseUrl?.substring(0, 30) + "..."
});

// Optimized Supabase client configuration
export const supabaseAdmin: SupabaseClient | null = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false, // Disable session persistence for server-side
        autoRefreshToken: false, // Disable auto refresh for service key
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'tabby-miniapp',
        },
      },
      // Connection pooling and performance settings
      realtime: {
        params: {
          eventsPerSecond: 10, // Limit real-time events
        },
      },
    })
  : null;

// Connection monitoring
if (supabaseAdmin) {
  // Log connection info (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase Admin client initialized');
  }
}
