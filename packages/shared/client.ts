import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./utils/database.types";
import { SupabaseClient } from "node_modules/@supabase/supabase-js/dist/module";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database>;
}
