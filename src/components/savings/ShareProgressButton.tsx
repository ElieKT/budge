"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { renderGoalShareImage } from "@/lib/shareImage";

type Goal = { name: string; targetAmount: number; currentAmount: number; percentage: number };

export function ShareProgressButton({ goal, currency = "USD" }: { goal: Goal; currency?: string }) {
  const [open, setOpen] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      renderGoalShareImage(canvasRef.current, goal, currency, hideAmounts);
    }
  }, [open, hideAmounts, goal, currency]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const safeName = goal.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/(^-|-$)/g, "") || "goal";
    link.download = `${safeName}-progress.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand-600 hover:underline">
        Share
      </button>
      {open && (
        <Modal title="Share your progress" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <canvas ref={canvasRef} className="w-full rounded-lg border border-slate-200 dark:border-slate-700" />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hideAmounts}
                onChange={(e) => setHideAmounts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
              />
              Hide exact dollar amounts (show percentage only)
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
              <Button onClick={download}>Download image</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
