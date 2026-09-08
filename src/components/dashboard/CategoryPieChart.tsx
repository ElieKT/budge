"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { assignChartColors } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/Misc";

export function CategoryPieChart({
  data,
}: {
  data: { categoryId: string; name: string; amount: number }[];
}) {
  if (data.length === 0) {
    return <EmptyState title="No spending yet" description="Add an expense to see your spending by category." />;
  }

  const colored = assignChartColors(data.map((d) => ({ id: d.categoryId, name: d.name, amount: d.amount })));

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="amount"
              nameKey="name"
              innerRadius="55%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="#fcfcfb"
              strokeWidth={2}
            >
              {colored.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {colored.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="truncate text-slate-600">{entry.name}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(entry.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
