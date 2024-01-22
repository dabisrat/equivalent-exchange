"use client";
import { getUser } from "@PNN/utils/data-access/data-acess";
import { createClient } from "@PNN/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const getUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  } else {
    return "http://localhost:3000/";
  }
};

export default function PasswordUpdate() {
  const client = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/login");
      }

      if (event === "USER_UPDATED") {
        router.replace("/");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <Auth
      supabaseClient={client}
      view="update_password"
      appearance={{
        theme: ThemeSupa,
        style: {
          container: {
            padding: "1rem",
          },
        },
      }}
      theme="dark"
    />
  );
}
