"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/server/actions/auth";

export function AccountMenu({
  userName,
  userImage,
  signOutLabel = "Sign out",
  isAdmin = false,
  onNavigate,
}: {
  userName: string;
  userImage?: string | null;
  signOutLabel?: string;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const avatar = userImage ? (
    <Image src={userImage} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" unoptimized />
  ) : (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {userName.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <Link
            href="/settings"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Profile &amp; settings
          </Link>
          <Link
            href="/help"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Help &amp; support
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Admin panel
            </Link>
          )}
          <hr className="my-1 border-slate-100 dark:border-slate-700" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {avatar}
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{userName}</p>
      </button>
    </div>
  );
}
