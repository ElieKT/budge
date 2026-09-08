"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SIGNUP_COLOR = "#159d63"; // single series (magnitude) — brand green

export function SignupsChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="#e1e0d9" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#898781", fontSize: 11 }}
            tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
            interval={4}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#898781", fontSize: 12 }} width={28} />
          <Tooltip
            labelFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}
            formatter={(value: number) => [value, "Signups"]}
            cursor={{ fill: "#f9f9f7" }}
          />
          <Bar dataKey="count" name="Signups" fill={SIGNUP_COLOR} radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
