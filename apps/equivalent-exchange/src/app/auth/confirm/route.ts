import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@eq-ex/shared/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "email") as EmailOtpType;
  let redirectTo = searchParams.get("redirectTo") ?? "/";
  console.log("____--------____-----__", request);
  // Validate redirect URL is relative
  if (!redirectTo.startsWith("/")) {
    redirectTo = "/";
  }

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Success - redirect with proper subdomain handling
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const host = request.headers.get("host"); // current host including subdomain
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // In development, preserve the subdomain from the host header
        if (host && host.includes(".localhost")) {
          // Extract subdomain and preserve it
          const protocol = origin.startsWith("https") ? "https" : "http";
          return NextResponse.redirect(`${protocol}://${host}${redirectTo}`);
        } else {
          // Fallback to origin if no subdomain
          return NextResponse.redirect(`${origin}${redirectTo}`);
        }
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
      } else {
        // In production, use host header to preserve subdomain
        if (host) {
          const protocol = origin.startsWith("https") ? "https" : "http";
          return NextResponse.redirect(`${protocol}://${host}${redirectTo}`);
        } else {
          return NextResponse.redirect(`${origin}${redirectTo}`);
        }
      }
    } else {
      return NextResponse.redirect(
        `${origin}/auth/error?error=${error.message}`
      );
    }
  }

  // Error - redirect to auth error page
  return NextResponse.redirect(
    `${origin}/auth/error?error=Invalid or expired confirmation link`
  );
}
