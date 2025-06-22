import { createServerClient } from "@eq-ex/shared";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // The `/callback` route is required for the server-side auth flow implemented
  // by the Auth Helpers package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-sign-in-with-code-exchange
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { session, user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (type === "password-reset" && session && user) {
      return NextResponse.redirect(requestUrl.origin + "/reset-password");
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard");
} 