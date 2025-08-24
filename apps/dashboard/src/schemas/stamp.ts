import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import { z } from "zod";

// 1. Database types (source of truth)
export type StampTable = Tables<"stamp">;
export type StampInsert = TablesInsert<"stamp">;

// 2. Full entity schema (matches database structure exactly)
export const stampSchema = z.object({
  created_at: commonValidations.timestamp,
  reward_card_id: commonValidations.id,
  stamp_index: z.number().int(),
  stamped: z.boolean().nullable(),
  stamper_id: commonValidations.id.nullable(),
  updated_at: commonValidations.timestamp.nullable(),
}) satisfies z.ZodType<StampTable>;

// 3. Input validation schemas (for API boundaries)
export const createStampSchema = z.object({
  reward_card_id: commonValidations.id,
  stamp_index: z.number().int().min(0).max(20),
  stamped: z.boolean().default(false),
  stamper_id: commonValidations.id.optional(),
}) satisfies z.ZodType<Pick<StampInsert, 'reward_card_id' | 'stamp_index' | 'stamped' | 'stamper_id'>>;

// 4. Update schema (partial input validation)
export const updateStampSchema = z.object({
  stamped: z.boolean(),
  stamper_id: commonValidations.id.nullable(),
}) satisfies z.ZodType<Pick<StampInsert, 'stamped' | 'stamper_id'>>;

// 5. Inferred types
export type Stamp = z.infer<typeof stampSchema>;
export type CreateStampInput = z.infer<typeof createStampSchema>;
export type UpdateStampInput = z.infer<typeof updateStampSchema>;
