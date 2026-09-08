"use client";

import { useActionState, useState } from "react";
import { FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ACCENT_COLOR_PRESETS } from "@/lib/accentColors";
import { updateAppearance } from "@/server/actions/appearance";
import type { ActionResult } from "@/server/action-result";

const THEME_OPTIONS = [
  { value: "SYSTEM", label: "Match device" },
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Dark" },
];

export function AppearanceForm({ theme, accentColor }: { theme: string; accentColor: string }) {
  const [state, formAction] = useActionState(updateAppearance, undefined as ActionResult | undefined);
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Appearance updated." />}
      <input type="hidden" name="accentColor" value={selectedColor} />
      <input type="hidden" name="theme" value={selectedTheme} />

      <div>
        <span className="label">Theme</span>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedTheme(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                selectedTheme === opt.value
                  ? "border-transparent text-white"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
              style={selectedTheme === opt.value ? { backgroundColor: "var(--accent)" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Accent color</span>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              onClick={() => setSelectedColor(preset.hex)}
              className={`h-8 w-8 rounded-full ring-offset-2 ${selectedColor === preset.hex ? "ring-2 ring-slate-900 dark:ring-white" : ""}`}
              style={{ backgroundColor: preset.hex }}
            />
          ))}
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-300 text-xs text-slate-400">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="h-0 w-0 opacity-0"
            />
            +
          </label>
        </div>
      </div>

      <SubmitButton pendingText="Saving…">Save appearance</SubmitButton>
    </form>
  );
}
