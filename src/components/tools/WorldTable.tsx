"use client";

import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import type { CityWeather } from "@/lib/weather";

export function WorldTable({ weather }: { weather: CityWeather[] }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const weatherByCurrency = new Map(weather.map((w) => [w.currency, w]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <th className="py-2 pr-3 font-medium">Country</th>
            <th className="py-2 pr-3 font-medium">Currency</th>
            <th className="py-2 pr-3 font-medium">Local time</th>
            <th className="py-2 pr-3 font-medium">Weather</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {COUNTRIES.map((c) => {
            const w = weatherByCurrency.get(c.currency);
            const time = now
              ? new Intl.DateTimeFormat("en-US", { timeZone: c.timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(now)
              : "…";
            return (
              <tr key={c.currency}>
                <td className="py-2 pr-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{c.country}</p>
                  <p className="text-xs text-slate-400">{c.city}</p>
                </td>
                <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{c.currency}</td>
                <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-300">{time}</td>
                <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                  {w ? (
                    <span>
                      {w.icon} {w.temperatureC != null ? `${Math.round(w.temperatureC)}°C` : "—"}{" "}
                      <span className="text-xs text-slate-400">{w.label}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
