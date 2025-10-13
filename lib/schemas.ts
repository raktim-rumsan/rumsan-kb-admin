import { z } from "zod";

// User Schemas
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  user_metadata: z.record(z.any()).optional(),
});

// Documents Schemas
export const DocumentSchema = z.object({
  id: z.string(),
  orgId: z.string().nullable(),
  industry: z.string(),
  fileName: z.string(),
  url: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const DocumentsResponseSchema = z.object({
  data: z.array(DocumentSchema),
});

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;

export type Document = z.infer<typeof DocumentSchema>;
export type DocumentsResponse = z.infer<typeof DocumentsResponseSchema>;

