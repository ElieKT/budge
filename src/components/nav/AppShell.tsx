"use client";

import { useState } from "react";
import { logoutAction } from "@/server/actions/auth";
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./NavLink";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-muted">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="text-lg font-semibold text-brand-700">💰 Budge</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="block rounded-lg px-3 py-2 text-sm font-medium"
              activeClassName="bg-brand-50 text-brand-700"
              inactiveClassName="text-slate-600 hover:bg-slate-50"
            />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-3 text-sm text-slate-500">{userName}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <span className="text-base font-semibold text-brand-700">💰 Budge</span>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-brand-700">Menu</span>
              <button
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onNavigate={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  activeClassName="bg-brand-50 text-brand-700"
                  inactiveClassName="text-slate-600 hover:bg-slate-50"
                />
              ))}
            </nav>
            <p className="truncate px-1 py-2 text-sm text-slate-500">{userName}</p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="pb-20 pt-4 lg:ml-60 lg:pb-8 lg:pt-8">
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white lg:hidden">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium"
            activeClassName="text-brand-700"
            inactiveClassName="text-slate-500"
          />
        ))}
      </nav>
    </div>
  );
}
