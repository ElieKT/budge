import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function ErrorText({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function TextField({
  label,
  name,
  errors,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; errors?: string[] }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm",
          errors?.length
            ? "border-expense focus:border-expense"
            : "border-slate-300 focus:border-brand-500",
        )}
        {...props}
      />
      <ErrorText errors={errors} />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  errors,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; errors?: string[] }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm",
          errors?.length
            ? "border-expense focus:border-expense"
            : "border-slate-300 focus:border-brand-500",
        )}
        rows={3}
        {...props}
      />
      <ErrorText errors={errors} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  errors,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className={clsx(
          "block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm",
          errors?.length
            ? "border-expense focus:border-expense"
            : "border-slate-300 focus:border-brand-500",
        )}
        {...props}
      >
        {children}
      </select>
      <ErrorText errors={errors} />
    </div>
  );
}

export function FormBanner({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  return (
    <div
      className={clsx(
        "rounded-lg px-3 py-2 text-sm",
        tone === "error" ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
