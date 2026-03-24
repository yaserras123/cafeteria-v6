import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "") as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "") as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Login will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel."
  );
}

// Create client even with empty strings to avoid crashing the whole app, 
// though auth calls will fail gracefully with an error message.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);
