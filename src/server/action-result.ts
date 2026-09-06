import { z } from "zod";

/**
 * Uniform shape every server action returns to its client form, instead of
 * throwing across the server/client boundary (which loses field-level
 * detail and produces an unstyled Next.js error overlay for validation
 * failures a user should just be shown inline).
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function zodErrorResult(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Please fix the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

export function errorResult(message: string): ActionResult<never> {
  return { ok: false, error: message };
}

export function okResult<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
