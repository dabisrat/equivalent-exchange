"use server";

import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createClient, supabaseAdmin } from "@eq-ex/shared/server";
import type { AsyncResult } from "@eq-ex/shared";
import { headers } from "next/headers";

// Get the actual hostname from the request
// For WebAuthn, the RP ID must match the domain the browser sees
// For subdomains under eqxrewards.com, use the base domain to enable
// passkey sharing across all subdomains (organization sites, www, etc.)
const getHostnameFromRequest = async () => {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const hostname = host.split(":")[0]; // Remove port
  
  // Extract base domain for eqxrewards.com subdomains
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const baseDomain = parts.slice(-2).join(".");
    if (baseDomain === "eqxrewards.com") {
      return baseDomain;
    }
  }
  
  return hostname; // Return full hostname for localhost or other domains
};

const getOriginFromRequest = async () => {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
};

interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    id: string;
    type: "public-key";
    transports?: ("ble" | "internal" | "nfc" | "usb" | "hybrid")[];
  }>;
  userVerification: "required" | "preferred" | "discouraged";
}

/**
 * Generate authentication options for passkey login
 *
 * Uses discoverable credentials (resident keys) so the authenticator
 * can present available passkeys without the server needing to specify them.
 * This is more secure (doesn't leak user existence) and more user-friendly.
 */
export async function generatePasskeyAuthenticationOptions(): Promise<
  AsyncResult<AuthenticationOptions>
> {
  try {
    const rpID = await getHostnameFromRequest();

    // Generate options with empty allowCredentials for discoverable credentials
    // The authenticator will show the user all available passkeys for this RP
    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      // Empty allowCredentials means use discoverable credentials
      // The browser will show all passkeys registered for this domain
      allowCredentials: [],
      userVerification: "preferred",
    });

    // Store challenge in database without a specific user_id
    // We'll link it to the user after successful authentication
    const { error: insertError } = await supabaseAdmin
      .from("passkey_challenges")
      .insert({
        user_id: null, // Will be determined after authentication
        challenge: options.challenge,
        type: "authentication",
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      return { success: false, error: "Failed to create challenge" };
    }

    return { success: true, data: options as any };
  } catch (error) {
    console.error("Error generating authentication options:", error);
    return {
      success: false,
      error: "Failed to generate authentication options",
    };
  }
}

interface AuthenticationVerification {
  success: boolean;
}

/**
 * Verify passkey authentication response and create session
 *
 * This function verifies the passkey and immediately creates a Supabase session.
 * The session is created server-side and the client never sees the token.
 * The user ID is never exposed to the client to prevent impersonation attacks.
 */
export async function verifyPasskeyAuthentication(
  assertionResponse: any
): Promise<AsyncResult<AuthenticationVerification>> {
  try {
    // Parallelize hostname/origin requests
    const [rpID, origin] = await Promise.all([
      getHostnameFromRequest(),
      getOriginFromRequest(),
    ]);

    const credentialId = assertionResponse.id;

    // Parallelize challenge and credential lookups
    const [challengeResult, credentialResult] = await Promise.all([
      supabaseAdmin
        .from("passkey_challenges")
        .select("challenge")
        .eq("type", "authentication")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("user_credentials")
        .select("credential_id, public_key, counter, transports, user_id")
        .eq("credential_id", credentialId)
        .maybeSingle(),
    ]);

    if (!challengeResult.data) {
      return { success: false, error: "Challenge not found or expired" };
    }

    if (!credentialResult.data) {
      return { success: false, error: "Credential not found" };
    }

    const { challenge: expectedChallenge } = challengeResult.data;
    const credentialData = credentialResult.data;

    // Verify the authentication response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credentialData.credential_id,
          publicKey: new Uint8Array(
            Buffer.from(credentialData.public_key, "base64url")
          ),
          counter: credentialData.counter,
          transports: credentialData.transports as any,
        },
        requireUserVerification: true,
      });
    } catch (error) {
      console.error("Verification error:", error);
      return { success: false, error: "Failed to verify authentication" };
    }

    if (!verification.verified) {
      return { success: false, error: "Verification failed" };
    }

    // Parallelize post-verification updates
    const [, , userResult] = await Promise.all([
      // Update credential counter and last used timestamp
      supabaseAdmin
        .from("user_credentials")
        .update({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq("credential_id", credentialId),
      // Delete used challenge to prevent replay
      supabaseAdmin
        .from("passkey_challenges")
        .delete()
        .eq("challenge", expectedChallenge),
      // Get user info for session creation
      supabaseAdmin.auth.admin.getUserById(credentialData.user_id),
    ]);

    if (!userResult.data?.user?.email) {
      return { success: false, error: "User not found" };
    }

    // WORKAROUND: Create a session for the authenticated user
    // Supabase doesn't provide an admin.createSession(userId) API, so we use
    // the magic link flow as a workaround. We generate a magic link token
    // (without sending an email) and immediately verify it to create a session.
    // This is the recommended pattern for server-side session creation after
    // custom authentication flows like passkeys.
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: userResult.data.user.email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Error generating link:", linkError);
      return { success: false, error: "Failed to create session" };
    }

    // Verify the OTP token to create the session server-side
    // IMPORTANT: Use the server client (not admin) to properly set session cookies
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("Session verification failed:", verifyError);
      return { success: false, error: "Failed to create session" };
    }

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return { success: false, error: "Failed to verify authentication" };
  }
}
