"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PERIOD_OPTIONS } from "@/lib/period";

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "this_month";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function onCustomDateChange(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Period</span>
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {current === "custom" && (
        <>
          <input
            type="date"
            aria-label="From date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => onCustomDateChange("from", e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            aria-label="To date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => onCustomDateChange("to", e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </>
      )}
    </div>
  );
}
