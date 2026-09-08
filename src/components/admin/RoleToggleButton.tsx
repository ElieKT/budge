"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { setUserRole } from "@/server/actions/admin";

export function RoleToggleButton({ userId, role }: { userId: string; role: "USER" | "ADMIN" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const nextRole = role === "ADMIN" ? "USER" : "ADMIN";
  const label = role === "ADMIN" ? "Revoke admin" : "Make admin";

  return (
    <Button
      size="sm"
      variant={role === "ADMIN" ? "danger" : "secondary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setUserRole(userId, nextRole);
          if (result.ok) router.refresh();
          else window.alert(result.error);
        })
      }
    >
      {pending ? "Saving…" : label}
    </Button>
  );
}
