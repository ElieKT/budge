"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormBanner } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { resizeImageToSquareJpeg } from "@/lib/image";
import { removeAvatar, uploadAvatar } from "@/server/actions/appearance";

export function AvatarUploadForm({ name, image }: { name: string; image: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [removing, startRemove] = useTransition();
  const router = useRouter();
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const displayImage = preview ?? image;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    startUpload(async () => {
      let resized: Blob;
      try {
        // Resize in the browser first — this is what makes uploads work
        // reliably regardless of the original photo's size (see
        // src/lib/image.ts). Falls back to the original file if the
        // browser can't decode it (e.g. an unusual format).
        resized = await resizeImageToSquareJpeg(file);
      } catch {
        resized = file;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(resized);
      objectUrlRef.current = url;
      setPreview(url);

      const fd = new FormData();
      fd.set("avatar", resized, "avatar.jpg");
      const result = await uploadAvatar(undefined, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

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
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {uploading ? "Uploading…" : "Choose photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
          {image && (
            <Button
              variant="ghost"
              size="sm"
              disabled={removing || uploading}
              onClick={() =>
                startRemove(async () => {
                  await removeAvatar();
                  router.refresh();
                })
              }
            >
              Remove photo
            </Button>
          )}
        </div>
        {error && <div className="mt-2"><FormBanner message={error} /></div>}
        <p className="mt-1 text-xs text-slate-400">Any photo works — it&apos;s automatically resized before uploading.</p>
      </div>
    </div>
  );
}
