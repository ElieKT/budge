"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CategoryForm, type CategoryFormValues } from "./CategoryForm";
import { createCategory, updateCategory } from "@/server/actions/categories";

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New category</Button>
      {open && (
        <Modal title="New category" onClose={() => setOpen(false)}>
          <CategoryForm action={createCategory} onSuccess={() => setOpen(false)} submitLabel="Create category" />
        </Modal>
      )}
    </>
  );
}

export function EditCategoryButton({ categoryId, defaultValues }: { categoryId: string; defaultValues: CategoryFormValues }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand-600 hover:underline">
        Edit
      </button>
      {open && (
        <Modal title="Edit category" onClose={() => setOpen(false)}>
          <CategoryForm action={updateCategory.bind(null, categoryId)} defaultValues={defaultValues} onSuccess={() => setOpen(false)} submitLabel="Save changes" />
        </Modal>
      )}
    </>
  );
}
