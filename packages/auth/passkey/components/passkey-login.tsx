"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@eq-ex/ui/components/button";
import { Fingerprint, Loader2 } from "lucide-react";
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "../actions/passkey-authentication";

interface PasskeyLoginProps {
  redirectTo?: string;
}

export function PasskeyLogin({ redirectTo = "/" }: PasskeyLoginProps) {
  const [error, setError] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handlePasskeyLogin = async () => {
    try {
      setIsAuthenticating(true);
      setError("");

      // Generate authentication options (no email needed - uses discoverable credentials)
      const optionsResult = await generatePasskeyAuthenticationOptions();

      if (!optionsResult.success) {
        setError(optionsResult.error);
        return;
      }

      // Start WebAuthn authentication
      let assertionResponse;
      try {
        assertionResponse = await startAuthentication({
          optionsJSON: optionsResult.data as any,
        });
      } catch (err: any) {
        console.error("WebAuthn authentication error:", err);
        if (err.name === "NotAllowedError") {
          setError("Authentication cancelled or not allowed");
        } else if (err.name === "NotSupportedError") {
          setError("Passkeys are not supported on this device or browser");
        } else {
          setError(
            `Failed to authenticate: ${err.message || "Please try again"}`
          );
        }
        return;
      }

      // Verify authentication with server
      // This verifies the passkey AND creates the session server-side
      const verificationResult =
        await verifyPasskeyAuthentication(assertionResponse);

      if (!verificationResult.success) {
        setError(verificationResult.error);
        return;
      }

      // Successfully authenticated - redirect
      // Use window.location for a hard redirect to ensure auth state is refreshed
      window.location.href = redirectTo;
    } catch (err) {
      console.error("Passkey login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={handlePasskeyLogin}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="mr-2 h-4 w-4" />
            Sign in with Passkey
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
