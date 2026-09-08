import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: {
    default: "Budge — Personal budgeting made simple",
    template: "%s · Budge",
  },
  description:
    "Track income and expenses, set monthly budgets, and reach your savings goals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#159d63",
};

// Inline, pre-hydration script: for a user with theme = SYSTEM (or no
// session yet), reflect the OS light/dark preference immediately so there's
// no flash of the wrong theme. Explicit LIGHT/DARK preferences are applied
// server-side below and this script is a no-op for those (the class is
// already correctly set by the time it runs).
const SYSTEM_THEME_SCRIPT = `
try {
  if (!document.documentElement.dataset.themeFixed) {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }
} catch (e) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let accentColor = "#159d63";
  let themeClass = "";
  let themeFixed = false;

  if (session?.user?.id) {
    const preference = await prisma.userPreference.findUnique({ where: { userId: session.user.id } });
    if (preference) {
      accentColor = preference.accentColor;
      if (preference.theme === "DARK") {
        themeClass = "dark";
        themeFixed = true;
      } else if (preference.theme === "LIGHT") {
        themeFixed = true;
      }
    }
  }

  return (
    <html lang="en" className={themeClass} data-theme-fixed={themeFixed ? "true" : undefined} style={{ "--accent": accentColor } as React.CSSProperties}>
      <head>
        {!themeFixed && <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME_SCRIPT }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
