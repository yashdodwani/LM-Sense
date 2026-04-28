// Purpose: Colour-coded score badge component. Shows a numerical fairness score
// with green/amber/red background depending on value. Supports sm, md, lg sizes.

import { clsx } from "clsx";
import { getScoreLevel } from "@/lib/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

const colourClasses = {
  green: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200",
  amber: "text-amber-600 bg-amber-50 ring-1 ring-amber-200",
  red: "text-red-600 bg-red-50 ring-1 ring-red-200",
};

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: ScoreBadgeProps) {
  const level = getScoreLevel(score);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold tabular-nums",
        sizeClasses[size],
        colourClasses[level],
      )}
    >
      {score.toFixed(0)}
      {showLabel && (
        <span className="font-normal opacity-70">Fairness</span>
      )}
    </span>
  );
}
