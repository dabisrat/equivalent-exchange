import { z } from "zod";

// Common validation patterns
export const commonValidations = {
  id: z.string().uuid("Invalid ID format"),
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format"),
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format"),
  slug: z
    .string()
    .min(3, "Must be at least 3 characters")
    .max(50, "Must be less than 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Invalid slug format"),
  timestamp: z.string().datetime("Invalid timestamp"),
  positiveInt: z.number().int().positive("Must be a positive integer"),
};

// Reserved words for subdomains, usernames, etc.
export const reservedWords = [
  "www",
  "api",
  "admin",
  "dashboard",
  "app",
  "mail",
  "ftp",
  "blog",
  "dev",
  "test",
  "staging",
  "prod",
  "production",
];

export const createSlugValidator = (reservedWords: string[] = []) =>
  commonValidations.slug.refine(
    (val) => !reservedWords.includes(val),
    "This name is reserved"
  );
