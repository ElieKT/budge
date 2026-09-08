"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SelectField, TextAreaField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { resizeImagePreservingAspect } from "@/lib/image";
import type { ActionResult } from "@/server/action-result";

export type CategoryOption = { id: string; name: string; kind: "INCOME" | "EXPENSE" };

export type TransactionFormValues = {
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  merchant: string;
  notes: string;
  receiptUrl: string;
};

export function TransactionForm({
  action,
  categories,
  defaultValues,
  onSuccess,
  submitLabel = "Save transaction",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  categories: CategoryOption[];
  defaultValues?: Partial<TransactionFormValues>;
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined as ActionResult | undefined);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(defaultValues?.type ?? "EXPENSE");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false);
  const [resizing, setResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const filteredCategories = categories.filter((c) => c.kind === type);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const existingReceiptUrl = defaultValues?.receiptUrl;
  const displayedReceipt = receiptPreview ?? (!removeExistingReceipt ? existingReceiptUrl : null);

  async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResizing(true);
    try {
      const resized = await resizeImagePreservingAspect(file);
      setReceiptPreview(URL.createObjectURL(resized));
      setRemoveExistingReceipt(false);

      // Swap the input's file for the resized one so the native form
      // submission (via useActionState's action prop) uploads the small
      // version, not the original multi-MB photo.
      const dt = new DataTransfer();
      dt.items.add(new File([resized], "receipt.jpg", { type: "image/jpeg" }));
      if (fileInputRef.current) fileInputRef.current.files = dt.files;
    } catch {
      // If resizing fails (unsupported format, etc.), fall back to
      // uploading the original file as-is — the server still validates
      // type/size and will reject it with a clear message if it's unusable.
    } finally {
      setResizing(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "EXPENSE" ? "border-expense bg-red-50 text-expense" : "border-slate-300 text-slate-500"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "INCOME" ? "border-income bg-brand-50 text-income" : "border-slate-300 text-slate-500"
          }`}
        >
          Income
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Amount (USD)"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={defaultValues?.amount}
          required
          errors={errors?.amount}
        />
        <TextField label="Date" name="date" type="date" defaultValue={defaultValues?.date} required errors={errors?.date} />
      </div>

      <SelectField label="Category" name="categoryId" defaultValue={defaultValues?.categoryId ?? ""} errors={errors?.categoryId}>
        <option value="">Uncategorized</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label={type === "EXPENSE" ? "Merchant" : "Source"}
        name="merchant"
        defaultValue={defaultValues?.merchant}
        placeholder={type === "EXPENSE" ? "e.g. Trader Joe's" : "e.g. Acme Inc."}
        errors={errors?.merchant}
      />
      <TextField label="Description (optional)" name="description" defaultValue={defaultValues?.description} errors={errors?.description} />
      <TextAreaField label="Notes (optional)" name="notes" defaultValue={defaultValues?.notes} errors={errors?.notes} />

      <div>
        <span className="label">Receipt (optional)</span>
        <div className="flex items-center gap-3">
          {displayedReceipt ? (
            <Image src={displayedReceipt} alt="Receipt preview" width={64} height={64} className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700" unoptimized />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xl text-slate-300 dark:border-slate-700">
              🧾
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer text-sm font-medium text-brand-600 hover:underline">
              {resizing ? "Processing…" : displayedReceipt ? "Replace photo" : "Attach photo"}
              <input ref={fileInputRef} type="file" name="receipt" accept="image/*" className="hidden" onChange={handleReceiptChange} disabled={resizing} />
            </label>
            {existingReceiptUrl && !removeExistingReceipt && !receiptPreview && (
              <button
                type="button"
                onClick={() => setRemoveExistingReceipt(true)}
                className="text-left text-xs text-expense hover:underline"
              >
                Remove receipt
              </button>
            )}
          </div>
        </div>
        <input type="hidden" name="removeReceipt" value={removeExistingReceipt ? "true" : "false"} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
