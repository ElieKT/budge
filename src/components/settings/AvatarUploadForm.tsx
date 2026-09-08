"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { removeAvatar, uploadAvatar } from "@/server/actions/appearance";
import type { ActionResult } from "@/server/action-result";

export function AvatarUploadForm({ name, image }: { name: string; image: string | null }) {
  const [state, formAction] = useActionState(uploadAvatar, undefined as ActionResult | undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const displayImage = preview ?? image;

  return (
    <div className="flex items-center gap-4">
      {displayImage ? (
        <Image src={displayImage} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" unoptimized />
      ) : (
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div>
        <form action={formAction} className="flex items-center gap-2" noValidate>
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Choose photo
            <input
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
                e.target.form?.requestSubmit();
              }}
            />
          </label>
          <SubmitButton size="sm" pendingText="Uploading…">Upload</SubmitButton>
        </form>
        {image && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await removeAvatar();
              router.refresh();
            })}
          >
            Remove photo
          </Button>
        )}
        {state && !state.ok && <div className="mt-2"><FormBanner message={state.error} /></div>}
        <p className="mt-1 text-xs text-slate-400">PNG, JPEG, or WebP. Max 500KB.</p>
      </div>
    </div>
  );
}
