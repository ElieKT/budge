"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "budge:privacy-mode";

/** Blurs every tabular-nums figure (money amounts, balances, counts) across
 * the app behind a click-to-toggle — handy for screen-sharing or a glance
 * over your shoulder in a coworking space. Purely a per-browser convenience:
 * stored in localStorage, never sent anywhere, and applied via a body class
 * + CSS (see .privacy-mode in globals.css) rather than touching every
 * number-rendering component individually. Hover/tap any blurred figure to
 * peek at it without turning privacy mode off. */
export function PrivacyModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Storage unavailable (private browsing, blocked site data) — default off.
    }
    setEnabled(stored);
    document.documentElement.classList.toggle("privacy-mode", stored);
  }, []);

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("privacy-mode", next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore — the toggle still works for this page load via React state.
      }
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? "Privacy mode on — click to show amounts" : "Privacy mode off — click to blur amounts"}
      className={`rounded-lg p-2 text-base leading-none transition-colors ${
        enabled
          ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      }`}
    >
      {enabled ? "🙈" : "👁️"}
      <span className="sr-only">Toggle privacy mode</span>
    </button>
  );
}
