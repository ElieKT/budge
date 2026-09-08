"use client";

import { useEffect, useState } from "react";

const CITIES: { name: string; timeZone: string }[] = [
  { name: "New York", timeZone: "America/New_York" },
  { name: "Los Angeles", timeZone: "America/Los_Angeles" },
  { name: "London", timeZone: "Europe/London" },
  { name: "Paris", timeZone: "Europe/Paris" },
  { name: "Madrid", timeZone: "Europe/Madrid" },
  { name: "Dubai", timeZone: "Asia/Dubai" },
  { name: "Mumbai", timeZone: "Asia/Kolkata" },
  { name: "Tokyo", timeZone: "Asia/Tokyo" },
  { name: "Sydney", timeZone: "Australia/Sydney" },
];

export function WorldClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null; // avoid a server/client render mismatch on the current second

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CITIES.map((city) => {
        const time = new Intl.DateTimeFormat("en-US", {
          timeZone: city.timeZone,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now);
        const date = new Intl.DateTimeFormat("en-US", {
          timeZone: city.timeZone,
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now);
        return (
          <li key={city.timeZone} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{city.name}</p>
              <p className="text-xs text-slate-400">{date}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{time}</p>
          </li>
        );
      })}
    </ul>
  );
}
