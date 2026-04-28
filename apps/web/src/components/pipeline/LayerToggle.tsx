// Purpose: Enable/disable toggle component for individual pipeline layers.
// Disabling greys out the section visually and sets `enabled: false` in config.

"use client";

import { clsx } from "clsx";

interface LayerToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function LayerToggle({
  label,
  description,
  enabled,
  onChange,
}: LayerToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={clsx("text-sm font-semibold", enabled ? "text-gray-900" : "text-gray-400")}>
          {label}
        </p>
        {description && (
          <p className={clsx("text-xs mt-0.5", enabled ? "text-gray-500" : "text-gray-300")}>
            {description}
          </p>
        )}
      </div>
      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          enabled ? "bg-indigo-600" : "bg-gray-200",
        )}
      >
        <span
          className={clsx(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            enabled ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
