import { createClient } from "@supabase/supabase-js";

// Only create Supabase client if we have a valid Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client only if we have the required environment variables
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
