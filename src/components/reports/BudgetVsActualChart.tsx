"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/Misc";

const PLANNED_COLOR = "#2a78d6"; // categorical slot 1 (blue) — this is a magnitude comparison, not identity
const ACTUAL_COLOR = "#eb6834"; // categorical slot 2 (orange)

export function BudgetVsActualChart({ data }: { data: { name: string; limit: number; spent: number }[] }) {
  if (data.length === 0) {
    return <EmptyState title="No budget set for this month" description="Create a monthly budget to compare planned vs. actual spending." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid horizontal={false} stroke="#e1e0d9" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#898781", fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(v).replace(/\.00$/, "")} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fill: "#52514e", fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: "#f9f9f7" }} />
          <Legend formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} iconType="circle" iconSize={8} />
          <Bar dataKey="limit" name="Planned" fill={PLANNED_COLOR} radius={[0, 4, 4, 0]} maxBarSize={16} />
          <Bar dataKey="spent" name="Actual" fill={ACTUAL_COLOR} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
