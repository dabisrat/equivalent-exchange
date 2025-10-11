export { authUiConfig } from "./auth-ui-config";
export { createClient as createBrowserClient } from "./client";
export { updateSession } from "./middleware";

// Common types
export type AsyncResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
