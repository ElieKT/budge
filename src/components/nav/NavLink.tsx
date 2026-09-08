"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function NavLink({
  href,
  label,
  onNavigate,
  className,
  activeClassName,
  inactiveClassName,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
  className?: string;
  activeClassName: string;
  inactiveClassName: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={clsx(className, active ? activeClassName : inactiveClassName)}
      style={active ? { color: "var(--accent)" } : undefined}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
