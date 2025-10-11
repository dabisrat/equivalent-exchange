"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import { Label } from "@eq-ex/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@eq-ex/ui/components/dialog";
import { Fingerprint, Loader2 } from "lucide-react";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "../actions/passkey-registration";

interface PasskeyRegistrationProps {
  onSuccess?: () => void;
}

export function PasskeyRegistration({ onSuccess }: PasskeyRegistrationProps) {
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      setError(null);

      // Get registration options from server
      const optionsResult = await generatePasskeyRegistrationOptions();
      if (!optionsResult.success) {
        setError(optionsResult.error);
        return;
      }

      // Start WebAuthn registration
      let attestationResponse;
      try {
        attestationResponse = await startRegistration({
          optionsJSON: optionsResult.data as any,
        });
      } catch (err: any) {
        if (err.name === "NotAllowedError") {
          setError("Registration cancelled or not allowed");
        } else {
          setError("Failed to create passkey. Please try again.");
        }
        return;
      }

      // Verify registration with server
      const verificationResult = await verifyPasskeyRegistration(
        attestationResponse,
        deviceName || undefined
      );

      if (!verificationResult.success) {
        setError(verificationResult.error);
        return;
      }

      // Success!
      setOpen(false);
      setDeviceName("");
      onSuccess?.();
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Fingerprint className="mr-2 h-4 w-4" />
          Add Passkey
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a new passkey</DialogTitle>
          <DialogDescription>
            Passkeys let you sign in securely with your device&apos;s biometric
            authentication or PIN.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="device-name">Device name (optional)</Label>
            <Input
              id="device-name"
              placeholder="e.g., My iPhone"
              value={deviceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeviceName(e.target.value)
              }
              disabled={isRegistering}
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRegistering}
          >
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={isRegistering}>
            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Passkey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
