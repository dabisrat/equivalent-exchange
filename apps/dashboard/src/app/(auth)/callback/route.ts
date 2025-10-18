import { createClient as createServerClient } from "@eq-ex/shared/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // The `/callback` route is required for the server-side auth flow implemented
  // by the Auth Helpers package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-sign-in-with-code-exchange
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  let type = (requestUrl.searchParams.get("type") || "email") as EmailOtpType;

  if (token_hash && type) {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error || !data.session) {
      // Redirect to login with error if exchange fails
      const errorMessage = error?.message || "Authentication failed";
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  if (code) {
    const supabase = await createServerClient();
    const {
      data: { session, user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !session) {
      // Redirect to login with error if exchange fails
      const errorMessage = error?.message || "Authentication failed";
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`
      );
    }

    if (session) {
      const payload = JSON.parse(atob(session.access_token.split(".")[1]));
      if (payload.amr.some((method: any) => method.method === "recovery")) {
        type = "recovery";
      }
    }

    if (type === "recovery" && session && user) {
      return NextResponse.redirect(requestUrl.origin + "/reset-password");
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard");
}
