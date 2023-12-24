"use client";
import { supabaseClient } from "@PNN/libs/supabaseClient";
import RewardsCard from "./rewards-card/rewards-card";
import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>({} as any);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("event", event);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (session?.user) {
    console.log("session", session);
    return <RewardsCard points={7} />;
  } else {
    return (
      <Auth
        supabaseClient={supabaseClient}
        appearance={{
          theme: ThemeSupa,
          style: {
            container: {
              padding: "1rem",
            },
          },
        }}
        socialLayout="horizontal"
        theme="dark"
        providers={["google", "apple", "facebook"]}
      />
    );
  }
}
