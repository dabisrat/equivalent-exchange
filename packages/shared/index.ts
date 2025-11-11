export { createClient as createBrowserClient } from "./client";
export { updateSession } from "./middleware";
export { createLogger, logger } from "./logger";

// Common types
export type AsyncResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
