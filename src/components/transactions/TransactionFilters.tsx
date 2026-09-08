"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const CONTROL_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function TransactionFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function update(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="card mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <label className="label" htmlFor="search">Search</label>
        <input
          id="search"
          placeholder="Merchant, description, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && update({ search })}
          onBlur={() => update({ search })}
          className={CONTROL_CLASS}
        />
      </div>
      <div>
        <label className="label" htmlFor="type">Type</label>
        <select id="type" defaultValue={searchParams.get("type") ?? "ALL"} onChange={(e) => update({ type: e.target.value })} className={CONTROL_CLASS}>
          <option value="ALL">All</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="categoryId">Category</label>
        <select id="categoryId" defaultValue={searchParams.get("categoryId") ?? ""} onChange={(e) => update({ categoryId: e.target.value })} className={CONTROL_CLASS}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="sort">Sort</label>
        <select id="sort" defaultValue={searchParams.get("sort") ?? "date_desc"} onChange={(e) => update({ sort: e.target.value })} className={CONTROL_CLASS}>
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Amount: high to low</option>
          <option value="amount_asc">Amount: low to high</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="from">From</label>
        <input id="from" type="date" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => update({ from: e.target.value })} className={CONTROL_CLASS} />
      </div>
      <div>
        <label className="label" htmlFor="to">To</label>
        <input id="to" type="date" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => update({ to: e.target.value })} className={CONTROL_CLASS} />
      </div>
    </div>
  );
}
