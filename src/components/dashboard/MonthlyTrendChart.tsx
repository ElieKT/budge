"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/money";

const INCOME_COLOR = "#0ca30c";
const EXPENSE_COLOR = "#d03b3b";

export function MonthlyTrendChart({
  data,
  currency = "USD",
}: {
  data: { label: string; income: number; expenses: number }[];
  currency?: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="#e1e0d9" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#c3c2b7" }} tick={{ fill: "#898781", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#898781", fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrency(v, currency).replace(/\.00$/, "")}
            width={70}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} cursor={{ fill: "#f9f9f7" }} />
          <Legend
            formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
