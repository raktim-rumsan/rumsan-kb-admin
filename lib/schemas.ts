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

// Tenant Schemas
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  isPersonal: z.boolean(),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TenantDataSchema = z.object({
  personal: TeamSchema.nullable(),
  teams: z.array(TeamSchema),
});

export const TenantResponseSchema = z.object({
  data: TenantDataSchema,
});

// Organization Settings Schemas
export const OrgSettingsSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  systemPrompt: z.string(),
  temperature: z.number(),
  model: z.string(),
  maxTokens: z.number(),
  topP: z.number(),
  frequencyPenalty: z.number(),
  presencePenalty: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrgSettingsResponseSchema = z.object({
  data: OrgSettingsSchema,
});

// Documents Schemas
export const DocumentSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  fileName: z.string(),
  url: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const DocumentsResponseSchema = z.object({
  data: z.array(DocumentSchema),
});

// Chat Schemas
export const ChatSourceSchema = z.object({
  id: z.number(),
  score: z.number(),
  payload: z.object({
    documentId: z.string(),
    chunk: z.string(),
    fileName: z.string(),
  }),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date(),
  sources: z.array(ChatSourceSchema).optional(),
  confidence: z.number().optional(),
  processingTime: z.number().optional(),
});

// Invitation/Members Schemas
export const OrgMemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
  status: z.string(),
  invitedAt: z.string(),
  joinedAt: z.string().optional(),
});

export const OrgMembersResponseSchema = z.object({
  data: z.array(OrgMemberSchema),
});

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type TenantData = z.infer<typeof TenantDataSchema>;
export type TenantResponse = z.infer<typeof TenantResponseSchema>;
export type OrgSettings = z.infer<typeof OrgSettingsSchema>;
export type OrgSettingsResponse = z.infer<typeof OrgSettingsResponseSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentsResponse = z.infer<typeof DocumentsResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSource = z.infer<typeof ChatSourceSchema>;
export type OrgMember = z.infer<typeof OrgMemberSchema>;
export type OrgMembersResponse = z.infer<typeof OrgMembersResponseSchema>;
