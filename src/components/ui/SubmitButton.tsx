"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./Button";

/**
 * Disables itself while the enclosing form action is pending — the primary
 * defense against duplicate submissions from a double-click or a slow
 * connection (the server actions are otherwise not idempotent by design,
 * since each legitimate submission should create one record).
 */
export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant,
  size,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
}
