"use client";

import { Auth } from "@supabase/auth-ui-react";
import { createBrowserClient, authUiConfig } from "@eq-ex/shared";
import { AuthCard } from "@eq-ex/ui/components/auth-card";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

const getUrl = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3001/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export default function LoginPage() {
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    window.location.hash = "";
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        const invitedOrg = session.user.user_metadata.invited_org;
        if (invitedOrg) {
          // Handle invite callback
          fetch("/api/organization/members/invite-callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }).then(() => {
            redirect("/dashboard");
          });
        } else {
          router.replace("/dashboard");
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthCard
      title="Dashboard"
      description="Sign in or create an account to access your dashboard"
    >
      <Auth
        supabaseClient={supabase}
        appearance={authUiConfig}
        providers={["google"]}
        redirectTo={`${getUrl()}callback`}
        showLinks={true}
        view="sign_in"
        theme="dark"
      />
    </AuthCard>
  );
}
