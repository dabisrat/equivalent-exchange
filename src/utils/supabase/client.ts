import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../data-access/database.types";

export const createClient = () =>
  // make sure this is a sigleton
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
