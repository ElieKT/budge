import { z } from "zod";
import { isValidHexColor } from "@/lib/accentColors";

export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_AVATAR_BYTES = 500 * 1024; // 500KB — stored as a data URL, so keep it small

export const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);
export const localeSchema = z.enum(["EN", "FR", "ES"]);

export const appearanceInputSchema = z.object({
  theme: themeSchema,
  accentColor: z.string().refine(isValidHexColor, "Pick a valid color"),
});

export const localeInputSchema = z.object({
  locale: localeSchema,
});
