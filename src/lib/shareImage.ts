import { formatCurrency } from "@/lib/money";

/**
 * Draws a shareable 1200x630 (social-card-sized) progress image for a
 * savings goal onto a canvas — pure canvas drawing, no external image
 * library. Kept separate from the component so the drawing logic itself is
 * a plain function.
 */

type GoalForShare = { name: string; targetAmount: number; currentAmount: number; percentage: number };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  const shown = lines.slice(0, maxLines);
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + (shown.length - 1) * lineHeight;
}

export function renderGoalShareImage(
  canvas: HTMLCanvasElement,
  goal: GoalForShare,
  currency: string,
  hideAmounts: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#0b3d2b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#48db98";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText("💰 Budge", 64, 88);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px system-ui, sans-serif";
  const nameBottom = wrapText(ctx, goal.name, 64, 200, 1072, 64);

  const clampedPct = Math.max(0, Math.min(100, Math.round(goal.percentage)));
  const pctY = nameBottom + 130;
  ctx.fillStyle = "#48db98";
  ctx.font = "800 120px system-ui, sans-serif";
  ctx.fillText(`${clampedPct}%`, 64, pctY);
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("of the way there", 64, pctY + 40);

  const barY = pctY + 80;
  const barX = 64;
  const barW = 1072;
  const barH = 28;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(ctx, barX, barY, barW, barH, 14);
  ctx.fill();
  ctx.fillStyle = "#48db98";
  roundRect(ctx, barX, barY, barW * (clampedPct / 100), barH, 14);
  ctx.fill();

  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  if (hideAmounts) {
    ctx.fillText("Amount kept private", barX, barY + 70);
  } else {
    ctx.fillText(`${formatCurrency(goal.currentAmount, currency)} of ${formatCurrency(goal.targetAmount, currency)}`, barX, barY + 70);
  }

  ctx.font = "400 20px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Track your goals at budge-nine.vercel.app", barX, H - 40);
}
