import { Tables, TablesInsert } from "@eq-ex/shared/utils/database.types";
import { commonValidations } from "./common";
import { z } from "zod";

// 1. Database types (source of truth)
export type UserSubscriptionsTable = Tables<"user_subscriptions">;
export type UserSubscriptionsInsert = TablesInsert<"user_subscriptions">;

// Define subscription status enum based on Stripe statuses
export const subscriptionStatus = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid",
] as const;

// 2. Full entity schema (matches database structure exactly)
export const userSubscriptionsSchema = z.object({
  cancel_at_period_end: z.boolean().nullable(),
  created_at: commonValidations.timestamp,
  current_period_end: commonValidations.timestamp.nullable(),
  current_period_start: commonValidations.timestamp.nullable(),
  payment_brand: z.string().nullable(),
  payment_last4: z.string().nullable(),
  price_id: z.string().nullable(),
  status: z.string(),
  stripe_customer_id: z.string().nullable(),
  stripe_subscription_id: z.string().nullable(),
  updated_at: commonValidations.timestamp,
  user_id: commonValidations.id,
}) satisfies z.ZodType<UserSubscriptionsTable>;

// 3. Input validation schemas (for API boundaries)
export const createUserSubscriptionSchema = z.object({
  user_id: commonValidations.id,
  stripe_customer_id: z.string().min(1),
  stripe_subscription_id: z.string().min(1),
  status: z.enum(subscriptionStatus),
  price_id: z.string().optional(),
  current_period_start: commonValidations.timestamp.optional(),
  current_period_end: commonValidations.timestamp.optional(),
}) satisfies z.ZodType<Pick<UserSubscriptionsInsert, 'user_id' | 'stripe_customer_id' | 'stripe_subscription_id' | 'status' | 'price_id' | 'current_period_start' | 'current_period_end'>>;

// 4. Update schema (partial input validation)
export const updateUserSubscriptionSchema = z.object({
  status: z.enum(subscriptionStatus),
  cancel_at_period_end: z.boolean(),
  current_period_start: commonValidations.timestamp,
  current_period_end: commonValidations.timestamp,
  payment_brand: z.string(),
  payment_last4: z.string().length(4),
}) satisfies z.ZodType<Pick<UserSubscriptionsInsert, 'status' | 'cancel_at_period_end' | 'current_period_start' | 'current_period_end' | 'payment_brand' | 'payment_last4'>>;

// 5. Inferred types
export type UserSubscriptions = z.infer<typeof userSubscriptionsSchema>;
export type CreateUserSubscriptionInput = z.infer<typeof createUserSubscriptionSchema>;
export type UpdateUserSubscriptionInput = z.infer<typeof updateUserSubscriptionSchema>;
