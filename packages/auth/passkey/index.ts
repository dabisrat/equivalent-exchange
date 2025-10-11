// Passkey Actions
export {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "./actions/passkey-registration";

export {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "./actions/passkey-authentication";

export {
  listUserPasskeys,
  deletePasskey,
  updatePasskeyName,
} from "./actions/passkey-management";

// Passkey Components
export { PasskeyLogin } from "./components/passkey-login";
export { PasskeyRegistration } from "./components/passkey-registration";
export { PasskeyManager } from "./components/passkey-manager";
