"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { setMessageResolved } from "@/server/actions/contact";

export function MarkMessageResolvedButton({ id, isResolved }: { id: string; isResolved: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setMessageResolved(id, !isResolved);
          router.refresh();
        })
      }
    >
      {pending ? "Saving…" : isResolved ? "Mark as new" : "Mark resolved"}
    </Button>
  );
}
