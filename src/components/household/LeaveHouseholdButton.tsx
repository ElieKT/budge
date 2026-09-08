"use client";

import { useRouter } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { removeHouseholdMember } from "@/server/actions/household";

/** Lets the current user remove themselves from a household, then navigates
 * away since the detail page they're standing on requires membership. */
export function LeaveHouseholdButton({
  householdId,
  userId,
  isSoleMember,
}: {
  householdId: string;
  userId: string;
  isSoleMember: boolean;
}) {
  const router = useRouter();

  return (
    <ConfirmDeleteButton
      action={removeHouseholdMember.bind(null, householdId, userId)}
      label="Leave"
      pendingLabel="Leaving…"
      confirmMessage={
        isSoleMember
          ? "You're the only member — leaving will delete this household and all its shared expenses. This can't be undone. Continue?"
          : "Leave this household? You'll lose access to its shared expense ledger."
      }
      onSuccess={() => router.push("/household")}
    />
  );
}
