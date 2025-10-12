# Passkey Authentication Module

This module provides WebAuthn/FIDO2 passkey authentication for the Equivalent Exchange platform.

## Features

- 🔐 **WebAuthn/FIDO2 Passkey Authentication** - Industry-standard biometric authentication
- 👆 **Biometric Login** - Face ID, Touch ID, Windows Hello, etc.
- 🔑 **Passwordless** - No passwords needed after registration
- 📱 **Device-based Credentials** - Secure hardware-backed authentication
- 🗂️ **Credential Management** - View, rename, and delete passkeys
- 🏢 **Multi-tenant Support** - Works with subdomain-based multi-tenancy
- 🔒 **RLS Policies** - Secure credential storage with Row Level Security

## Installation

This package is already installed as part of `@eq-ex/auth`. Dependencies:

- `@simplewebauthn/browser` - Client-side WebAuthn
- `@simplewebhn/server` - Server-side verification
- `@eq-ex/shared` - Shared utilities and Supabase clients
- `@eq-ex/ui` - UI components

## Usage

### Components

#### PasskeyLogin

Renders a button that initiates passkey authentication.

```tsx
import { PasskeyLogin } from "@eq-ex/auth";

<PasskeyLogin
  email="user@example.com" // Optional: pre-filter to user's passkeys
  redirectTo="/dashboard" // Where to redirect after successful login
/>;
```

#### PasskeyRegistration

Dialog component for registering a new passkey.

```tsx
import { PasskeyRegistration } from "@eq-ex/auth";

<PasskeyRegistration onSuccess={() => console.log("Passkey registered!")} />;
```

#### PasskeyManager

Complete passkey management UI with list, registration, and deletion.

```tsx
import { PasskeyManager } from "@eq-ex/auth";

<PasskeyManager />;
```

### Server Actions

#### Registration

```tsx
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@eq-ex/auth";

// Generate options for browser WebAuthn API
const options = await generatePasskeyRegistrationOptions();

// Verify attestation response from browser
const result = await verifyPasskeyRegistration(
  attestationResponse,
  "My Device Name"
);
```

#### Authentication

```tsx
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "@eq-ex/auth";
import { createClient } from "@eq-ex/shared/client";

// Generate challenge (no email needed - uses discoverable credentials)
const options = await generatePasskeyAuthenticationOptions();

// Verify assertion (returns session token atomically)
const verification = await verifyPasskeyAuthentication(assertionResponse);

// Create Supabase session with the hashed token
const supabase = createClient();
await supabase.auth.verifyOtp({
  token_hash: verification.data.hashedToken,
  type: "magiclink",
});
```

#### Management

```tsx
import {
  listUserPasskeys,
  deletePasskey,
  updatePasskeyName,
} from "@eq-ex/auth";

// List user's passkeys
const passkeys = await listUserPasskeys();

// Delete a passkey
await deletePasskey(credentialId);

// Rename a passkey
await updatePasskeyName(credentialId, "New Name");
```

## Implementation Notes

### RP ID (Relying Party ID)

The RP ID is dynamically determined from the request hostname:

- For `localhost:3000` → RP ID: `localhost`
- For `*.eqxrewards.com` → RP ID: `eqxrewards.com` (base domain)
- For `eqxrewards.com` → RP ID: `eqxrewards.com`
- For other custom domains → RP ID: full hostname

**Cross-subdomain Passkey Sharing**: For the eqxrewards.com domain, the RP ID is set to the base domain (`eqxrewards.com`) rather than individual subdomains. This means:

- A passkey registered on `www.eqxrewards.com` works on `alchemist.eqxrewards.com`
- A passkey registered on `alchemist.eqxrewards.com` works on `lemon-sweets.eqxrewards.com`
- Users only need to register their passkey once, and it works across all organization subdomains

This is the correct UX for multi-tenant apps where a single user account can access multiple organization subdomains. The security boundary is at the domain level (eqxrewards.com), not the subdomain level.

### Security

- All credentials are stored in the `user_credentials` table with RLS policies
- Challenges are stored in `passkey_challenges` with automatic cleanup
- Public keys are stored as base64url-encoded strings
- Credential counters prevent replay attacks
- Passkeys are scoped to the base domain for cross-subdomain access

## Database Schema

### user_credentials

Stores passkey credentials:

```sql
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  transports TEXT[],
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### passkey_challenges

Temporary storage for authentication challenges:

```sql
CREATE TABLE passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Browser Support

Passkeys work on:

- ✅ Chrome/Edge 108+
- ✅ Safari 16+
- ✅ Firefox 119+
- ✅ iOS 16+ (Face ID/Touch ID)
- ✅ Android 9+ (biometric)
- ✅ Windows 10+ (Windows Hello)
- ✅ macOS (Touch ID)

## Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn Docs](https://simplewebauthn.dev/)
- [W3C WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
