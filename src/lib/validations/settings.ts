import { z } from "zod";

export const workspaceSettingsSchema = z.object({
  name: z.string().min(1, "Informe o nome da empresa."),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
});

export const appearanceSchema = z.object({
  name: z.string().min(1, "Informe o nome da empresa."),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().optional().nullable(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  showDeveloperCredit: z.boolean().optional(),
});

export const stageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  color: z.string().min(4),
  kind: z.enum(["OPEN", "WON", "LOST"]),
  isHidden: z.boolean().optional(),
  position: z.number().int(),
});

export const sourceSchema = z.object({
  name: z.string().min(1),
});

export const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(4),
});

export const lostReasonSchema = z.object({
  name: z.string().min(1),
});

export const onboardingSchema = z.object({
  companyName: z.string().min(1, "Informe o nome da empresa."),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().min(4).optional().nullable(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});
