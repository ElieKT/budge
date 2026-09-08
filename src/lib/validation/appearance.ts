import { z } from "zod";
import { isValidHexColor } from "@/lib/accentColors";

export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
// The client (src/lib/image.ts) resizes/re-encodes to a small JPEG before
// upload, so this only needs to be generous enough to cover that resized
// output plus the rare fallback of an unresizeable original.
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

export const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);
export const localeSchema = z.enum(["EN", "FR", "ES"]);

export const appearanceInputSchema = z.object({
  theme: themeSchema,
  accentColor: z.string().refine(isValidHexColor, "Pick a valid color"),
});

export const localeInputSchema = z.object({
  locale: localeSchema,
});
