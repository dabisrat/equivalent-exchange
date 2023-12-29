"use client";
import { supabaseClient } from "@PNN/libs/supabaseClient";
import RewardsCard from "./rewards-card/rewards-card";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import Authentication from "./auth/auth";
import Loading from "./loading";

export default function App() {
  const [session, setSession] = useState<Session | null>({} as any);
  const [isLoading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    supabaseClient.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        setSession(session);
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) return <Loading />;

  if (session?.user) {
    return (
      <div>
        <button onClick={(e) => supabaseClient.auth.signOut()}> logout </button>
        <RewardsCard points={7} />
      </div>
    );
  } else {
    return <Authentication />;
  }
}
