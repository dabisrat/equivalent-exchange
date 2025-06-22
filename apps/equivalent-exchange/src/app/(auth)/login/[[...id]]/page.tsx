"use client";
import { createBrowserClient } from "@eq-ex/shared";
import { Auth } from "@supabase/auth-ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authUiConfig } from "@eq-ex/shared";
import { AuthCard } from "@eq-ex/ui/components/auth-card";

const getUrl = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export default function Login({ params }: any) {
  const client = createBrowserClient();
  const router = useRouter();
  const route = params?.id?.join("/") ?? "";
  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      // Only redirect on successful sign in, not on initial session
      if (session && event === "SIGNED_IN") {
        router.replace(`/${route}`);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthCard
      title="Equivalent Exchange"
      description="Sign in or create an account to continue"
    >
      <Auth
        supabaseClient={client}
        appearance={authUiConfig}
        socialLayout="horizontal"
        redirectTo={`${getUrl()}/callback/${route}`}
        magicLink
        otpType="email"
        providers={["google"]}
        queryParams={{
          access_type: "offline",
          prompt: "consent",
        }}
      />
    </AuthCard>
  );
}
