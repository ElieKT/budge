"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthNav({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(y: number, m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    params.set("month", String(m));
    router.push(`${pathname}?${params.toString()}`);
  }

  function prev() {
    if (month === 1) go(year - 1, 12);
    else go(year, month - 1);
  }
  function nextMonth() {
    if (month === 12) go(year + 1, 1);
    else go(year, month + 1);
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={prev} aria-label="Previous month">←</Button>
      <span className="w-36 text-center text-sm font-medium text-slate-700">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button variant="secondary" size="sm" onClick={nextMonth} aria-label="Next month">→</Button>
    </div>
  );
}
