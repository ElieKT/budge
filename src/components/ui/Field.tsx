import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Shared by every text input, textarea, and select below — keeps every
// form control in the app readable in dark mode from one place, instead
// of each one needing its own dark: classes.
const CONTROL_BASE =
  "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";
const CONTROL_BORDER = "border-slate-300 focus:border-brand-500 dark:border-slate-700";
const CONTROL_BORDER_ERROR = "border-expense focus:border-expense";

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
        className={clsx(CONTROL_BASE, errors?.length ? CONTROL_BORDER_ERROR : CONTROL_BORDER)}
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
        className={clsx(CONTROL_BASE, errors?.length ? CONTROL_BORDER_ERROR : CONTROL_BORDER)}
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
        className={clsx(CONTROL_BASE, errors?.length ? CONTROL_BORDER_ERROR : CONTROL_BORDER)}
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
        tone === "error"
          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
