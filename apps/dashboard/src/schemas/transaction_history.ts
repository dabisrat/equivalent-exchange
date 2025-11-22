import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import { z } from "zod";

// 1. Database types (source of truth)
export type TransactionHistoryTable = Tables<"transaction_history">;
export type TransactionHistoryInsert = TablesInsert<"transaction_history">;

// 2. Full entity schema (matches database structure exactly)
export const transactionHistorySchema = z.object({
  id: commonValidations.id,
  created_at: commonValidations.timestamp,
  organization_id: commonValidations.id,
  user_id: commonValidations.id,
  card_id: commonValidations.id,
  stamper_id: commonValidations.id.nullable(),
  action_type: z.string(),
  metadata: z.record(z.any()).nullable(),
}) satisfies z.ZodType<TransactionHistoryTable>;

// 3. Input validation schemas (for API boundaries)
export const createTransactionHistorySchema = z.object({
  organization_id: commonValidations.id,
  user_id: commonValidations.id,
  card_id: commonValidations.id,
  stamper_id: commonValidations.id.optional(),
  action_type: z.enum(["stamp", "unstamp", "redeem"]),
  metadata: z.record(z.any()).optional(),
}) satisfies z.ZodType<
  Pick<
    TransactionHistoryInsert,
    | "organization_id"
    | "user_id"
    | "card_id"
    | "stamper_id"
    | "action_type"
    | "metadata"
  >
>;

// 4. Inferred types
export type TransactionHistory = z.infer<typeof transactionHistorySchema>;
export type CreateTransactionHistoryInput = z.infer<
  typeof createTransactionHistorySchema
>;
