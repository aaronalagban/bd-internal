import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== "undefined") {
    console.error("Missing Supabase environment variables. Check your .env file.");
  }
}

// Singleton instance to prevent multiple client warnings
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
