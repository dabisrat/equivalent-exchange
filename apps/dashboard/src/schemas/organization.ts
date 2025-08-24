import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { z } from "zod";
import {
  commonValidations,
  createSlugValidator,
  reservedWords,
} from "./common";

// 1. Database types (source of truth)
export type OrganizationTable = Tables<"organization">;
export type OrganizationInsert = TablesInsert<"organization">;

// 2. Full entity schema (matches database structure exactly)
export const organizationSchema = z.object({
  id: commonValidations.id,
  created_at: commonValidations.timestamp,
  email: commonValidations.email.nullable(),
  is_active: z.boolean().nullable(),
  logo_url: commonValidations.url.nullable(),
  max_points: commonValidations.positiveInt,
  organization_name: z.string().nullable(),
  primary_color: commonValidations.hexColor.nullable(),
  secondary_color: commonValidations.hexColor.nullable(),
  subdomain: z.string().nullable(),
}) satisfies z.ZodType<OrganizationTable>;

// 3. Input validation schemas (for API boundaries)
export const createOrganizationSchema = z.object({
  organization_name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  max_points: z
    .number()
    .int("Max points must be an integer")
    .min(1, "Max points must be at least 1")
    .max(100, "Max points cannot exceed 100"),
  subdomain: createSlugValidator(reservedWords),
  primary_color: commonValidations.hexColor.default("#3b82f6"),
  secondary_color: commonValidations.hexColor.default("#64748b"),
  logo_url: commonValidations.url.optional(),
}) satisfies z.ZodType<
  Pick<
    OrganizationInsert,
    | "organization_name"
    | "max_points"
    | "subdomain"
    | "primary_color"
    | "secondary_color"
    | "logo_url"
  >
>;

// 4. Update schema (partial input validation)
export const updateOrganizationSchema = createOrganizationSchema.partial();

// 5. Inferred types
export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
