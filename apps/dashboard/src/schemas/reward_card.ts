import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import { z } from "zod";

// 1. Database types (source of truth)
export type RewardCardTable = Tables<"reward_card">;
export type RewardCardInsert = TablesInsert<"reward_card">;

// 2. Full entity schema (matches database structure exactly)
export const rewardCardSchema = z.object({
  created_at: commonValidations.timestamp,
  id: commonValidations.id,
  organization_id: commonValidations.id,
  points: z.number().int(),
  user_id: commonValidations.id,
}) satisfies z.ZodType<RewardCardTable>;

// 3. Input validation schemas (for API boundaries)
export const createRewardCardSchema = z.object({
  organization_id: commonValidations.id,
  user_id: commonValidations.id,
  points: z.number().int().min(0).max(10000).default(0),
}) satisfies z.ZodType<Pick<RewardCardInsert, 'organization_id' | 'user_id' | 'points'>>;

// 4. Update schema (partial input validation)
export const updateRewardCardSchema = z.object({
  points: z.number().int().min(0).max(10000),
}) satisfies z.ZodType<Pick<RewardCardInsert, 'points'>>;

// 5. Inferred types
export type RewardCard = z.infer<typeof rewardCardSchema>;
export type CreateRewardCardInput = z.infer<typeof createRewardCardSchema>;
export type UpdateRewardCardInput = z.infer<typeof updateRewardCardSchema>;
