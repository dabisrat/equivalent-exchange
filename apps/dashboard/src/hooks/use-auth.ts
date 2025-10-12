"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@eq-ex/shared";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@eq-ex/shared/utils/database.types";
import { useRouter } from "next/navigation";
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: (path?: string) => Promise<void>;
  supabase: SupabaseClient<Database>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async (path?: string) => {
    await supabase.auth.signOut();
    if (path) {
      router.push(path);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    supabase: supabase as SupabaseClient<Database>,
  };
}
