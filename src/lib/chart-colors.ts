/**
 * Chart color assignment, following the categorical-palette method: fixed
 * hue order (never cycled), capped at the slot count that stays
 * colorblind-safe, remaining series folded into "Other" rather than
 * generating additional hues. Values are the validated light-surface
 * palette (see the dataviz skill's references/palette.md).
 */
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
] as const;

export const OTHER_SLOT_COLOR = "#9c9a94"; // neutral gray, distinct from every categorical hue

export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export type NamedAmount = { id: string; name: string; amount: number };
export type ColoredAmount = NamedAmount & { color: string };

/**
 * Assigns fixed-order palette colors to the largest series and folds the
 * rest into a single "Other" bucket. `items` must already be sorted
 * descending by amount.
 */
export function assignChartColors(items: NamedAmount[], maxSlots = CATEGORICAL_PALETTE.length): ColoredAmount[] {
  const head = items
    .slice(0, maxSlots)
    .map((item, i) => ({ ...item, color: CATEGORICAL_PALETTE[i] ?? OTHER_SLOT_COLOR }));
  const tail = items.slice(maxSlots);
  if (tail.length === 0) return head;

  const otherTotal = tail.reduce((sum, item) => sum + item.amount, 0);
  return [
    ...head,
    { id: "other", name: "Other", amount: otherTotal, color: OTHER_SLOT_COLOR },
  ];
}
