"use client";

import { useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { NavLink } from "./NavLink";
import { PrivacyModeToggle } from "@/components/privacy/PrivacyModeToggle";

type NavItem = { href: string; label: string };

export function AppShell({
  userName,
  userImage,
  navItems,
  mobileNavItems,
  signOutLabel = "Sign out",
  children,
}: {
  userName: string;
  userImage?: string | null;
  navItems: NavItem[];
  mobileNavItems: NavItem[];
  signOutLabel?: string;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-muted dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="flex h-16 items-center justify-between gap-2 px-5">
          <span className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>💰 Budge</span>
          <PrivacyModeToggle />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="block rounded-lg px-3 py-2 text-sm font-medium"
              activeClassName="bg-slate-100 font-semibold dark:bg-slate-800"
              inactiveClassName="text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <AccountMenu userName={userName} userImage={userImage} signOutLabel={signOutLabel} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <span className="text-lg font-semibold" style={{ color: "var(--accent)" }}>💰 Budge</span>
        <div className="flex items-center gap-1">
          <PrivacyModeToggle />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ☰
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold" style={{ color: "var(--accent)" }}>Menu</span>
              <button
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onNavigate={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  activeClassName="bg-slate-100 font-semibold dark:bg-slate-800"
                  inactiveClassName="text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                />
              ))}
            </nav>
            <AccountMenu
              userName={userName}
              userImage={userImage}
              signOutLabel={signOutLabel}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="pb-20 pt-4 lg:ml-60 lg:pb-8 lg:pt-8">
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium"
            activeClassName=""
            inactiveClassName="text-slate-500 dark:text-slate-400"
          />
        ))}
      </nav>
    </div>
  );
}
