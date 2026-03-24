import { createClient } from "@supabase/supabase-js";

// Hardcoded credentials for immediate production fix as Vercel env vars are currently missing.
// This ensures the frontend can communicate with Supabase Auth immediately.
const supabaseUrl = "https://plqnuwrylwhtgxmjktst.supabase.co";
const supabaseAnonKey = "sb_publishable_O-XD2Nu00tjdwsMPfd2OtA_uvgbrNp7";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
