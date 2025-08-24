import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import { z } from "zod";

// 1. Database types (source of truth)
export type UserPreferencesTable = Tables<"user_preferences">;
export type UserPreferencesInsert = TablesInsert<"user_preferences">;

// 2. Full entity schema (matches database structure exactly)
export const userPreferencesSchema = z.object({
  active_organization_id: commonValidations.id.nullable(),
  created_at: commonValidations.timestamp,
  id: commonValidations.id,
  updated_at: commonValidations.timestamp,
  user_id: commonValidations.id.nullable(),
}) satisfies z.ZodType<UserPreferencesTable>;

// 3. Input validation schemas (for API boundaries)
export const createUserPreferencesSchema = z.object({
  active_organization_id: commonValidations.id.optional(),
  user_id: commonValidations.id,
}) satisfies z.ZodType<Pick<UserPreferencesInsert, 'active_organization_id' | 'user_id'>>;

// 4. Update schema (partial input validation)
export const updateUserPreferencesSchema = z.object({
  active_organization_id: commonValidations.id.nullable(),
}) satisfies z.ZodType<Pick<UserPreferencesInsert, 'active_organization_id'>>;

// 5. Inferred types
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type CreateUserPreferencesInput = z.infer<typeof createUserPreferencesSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
