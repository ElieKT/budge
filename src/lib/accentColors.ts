/**
 * User-selectable brand accent — used for nav highlights, primary buttons,
 * and links. Deliberately separate from the fixed financial semantic
 * colors (income green / expense red / budget status), which never change
 * per user: mixing those up would undermine "is this good or bad news at a
 * glance," the whole point of standardizing them.
 */
export const ACCENT_COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: "Green", hex: "#159d63" },
  { name: "Blue", hex: "#2a78d6" },
  { name: "Violet", hex: "#4a3aa7" },
  { name: "Magenta", hex: "#c2338d" },
  { name: "Orange", hex: "#c2540a" },
  { name: "Teal", hex: "#0f8a82" },
  { name: "Slate", hex: "#334155" },
];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
