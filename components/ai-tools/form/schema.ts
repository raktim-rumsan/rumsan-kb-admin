import { z } from "zod";

const authEntrySchema = z.object({
  key: z.string().trim().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  show: z.boolean().optional(),
  isEncrypted: z.boolean().optional(),
});

export const mcpServerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),

  url: z.string().trim().url("Enter a valid URL"),
  type: z.string().trim().min(1, "Type is required"),

  sectorName: z.string().optional(),

  authentication: z.array(authEntrySchema),
});
