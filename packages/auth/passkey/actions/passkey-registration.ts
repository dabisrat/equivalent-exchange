"use server";

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { createClient } from "@eq-ex/shared/server";
import { supabaseAdmin } from "@eq-ex/shared/server";
import type { AsyncResult } from "@eq-ex/shared";
import { headers } from "next/headers";

const rpName = "Equivalent Exchange";

// Get the actual hostname from the request
// For WebAuthn, the RP ID must match the domain the browser sees
const getHostnameFromRequest = async () => {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const hostname = host.split(':')[0]; // Remove port
  return hostname; // Return full hostname including subdomain
};

const getOriginFromRequest = async () => {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
};

interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: "public-key";
  }>;
  timeout: number;
  attestation: "none" | "indirect" | "direct";
  excludeCredentials: Array<{
    id: string;
    type: "public-key";
    transports?: ("ble" | "internal" | "nfc" | "usb" | "hybrid")[];
  }>;
  authenticatorSelection: {
    authenticatorAttachment?: "platform" | "cross-platform";
    requireResidentKey: boolean;
    residentKey: "discouraged" | "preferred" | "required";
    userVerification: "required" | "preferred" | "discouraged";
  };
}

/**
 * Generate registration options for creating a new passkey
 */
export async function generatePasskeyRegistrationOptions(): Promise<
  AsyncResult<RegistrationOptions>
> {
  try {
    const rpID = await getHostnameFromRequest();
    const origin = await getOriginFromRequest();
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get existing credentials to exclude
    const { data: existingCredentials } = await supabase
      .from("user_credentials")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email || user.id,
      userDisplayName: user.email || "User",
      timeout: 60000,
      attestationType: "none",
      excludeCredentials: (existingCredentials || []).map((cred) => ({
        id: cred.credential_id,
        transports: cred.transports as any,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    // Store challenge in database for later verification
    const { error: insertError } = await supabase
      .from("passkey_challenges")
      .insert({
        user_id: user.id,
        challenge: options.challenge,
        type: "registration",
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      return { success: false, error: "Failed to create challenge" };
    }

    return { success: true, data: options as any };
  } catch (error) {
    console.error("Error generating registration options:", error);
    return { success: false, error: "Failed to generate registration options" };
  }
}

interface RegistrationVerification {
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
}

/**
 * Verify passkey registration response and store credential
 */
export async function verifyPasskeyRegistration(
  attestationResponse: any,
  deviceName?: string
): Promise<AsyncResult<RegistrationVerification>> {
  try {
    const rpID = await getHostnameFromRequest();
    const origin = await getOriginFromRequest();
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get the challenge from database
    const { data: challengeData, error: challengeError } = await supabase
      .from("passkey_challenges")
      .select("challenge")
      .eq("user_id", user.id)
      .eq("type", "registration")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !challengeData) {
      return { success: false, error: "Challenge not found or expired" };
    }

    const expectedChallenge = challengeData.challenge;

    // Verify the registration response
    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch (error) {
      console.error("Verification error:", error);
      return { success: false, error: "Failed to verify registration" };
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Verification failed" };
    }

    const { credential } = verification.registrationInfo;
    const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

    // The credentialID is already a base64url string from the verification library
    const credentialIdString = credentialID;

    // Store the credential
    const { error: insertError } = await supabase.from("user_credentials").insert({
      user_id: user.id,
      credential_id: credentialIdString,
      public_key: Buffer.from(credentialPublicKey).toString("base64url"),
      counter,
      transports: attestationResponse.response.transports || [],
      device_name: deviceName || "Passkey",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, error: "Failed to store credential" };
    }

    // Clean up used challenge
    await supabase
      .from("passkey_challenges")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "registration");

    return {
      success: true,
      data: {
        credential_id: Buffer.from(credentialID).toString("base64url"),
        public_key: Buffer.from(credentialPublicKey).toString("base64url"),
        counter,
        transports: attestationResponse.response.transports || [],
      },
    };
  } catch (error) {
    console.error("Error verifying registration:", error);
    return { success: false, error: "Failed to verify registration" };
  }
}
