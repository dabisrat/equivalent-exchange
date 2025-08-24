import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import z from "zod";

export type OrganizationMembersTable = Tables<"organization_members">;
export type OrganizationMembersInsert = TablesInsert<"organization_members">;

// Define the role type based on the expected values
export const organizationRole = ["owner", "admin", "member"] as const;

export const organizationMembers = z.object({
  created_at: commonValidations.timestamp,
  email: commonValidations.email.nullable(),
  invited_at: commonValidations.timestamp.nullable(),
  invited_by: commonValidations.id.nullable(),
  is_active: z.boolean(),
  last_active_at: commonValidations.timestamp,
  name: z.string().nullable(),
  organization_id: commonValidations.id,
  role: z.enum(organizationRole),
  user_id: commonValidations.id,
}) satisfies z.ZodType<OrganizationMembersTable>;

export const createOrganizationMember = z.object({
  email: commonValidations.email,
  name: z.string().min(2).max(100),
  role: z.enum(organizationRole),
}) satisfies z.ZodType<
  Pick<OrganizationMembersInsert, "email" | "name" | "role">
>;

export const updateOrganizationMember = createOrganizationMember.partial();

export type OrganizationMembers = z.infer<typeof organizationMembers>;
export type CreateOrganizationMember = z.infer<typeof createOrganizationMember>;
export type UpdateOrganizationMember = z.infer<typeof updateOrganizationMember>;
