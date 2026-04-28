// Purpose: Simple aggressiveness slider with Low/Balanced/Strict presets.
// Maps preset labels to underlying Layer 3 aggressiveness values (0.3, 0.6, 0.9).

"use client";

import { clsx } from "clsx";

type Preset = "low" | "balanced" | "strict";

const presets: { id: Preset; label: string; value: number; description: string }[] = [
  {
    id: "low",
    label: "Low",
    value: 0.3,
    description: "Flag only high-confidence bias; minimal rewrites. Best for creative content.",
  },
  {
    id: "balanced",
    label: "Balanced",
    value: 0.6,
    description: "Standard detection with moderate rewrites. Recommended for most use cases.",
  },
  {
    id: "strict",
    label: "Strict",
    value: 0.9,
    description: "Aggressive detection and full rewrites. Best for compliance-critical outputs.",
  },
];

interface SimpleSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function getActivePreset(value: number): Preset {
  if (value <= 0.45) return "low";
  if (value <= 0.75) return "balanced";
  return "strict";
}

export function SimpleSlider({ value, onChange }: SimpleSliderProps) {
  const activePreset = getActivePreset(value);
  const active = presets.find((p) => p.id === activePreset)!;

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-gray-700">Bias Aggressiveness</p>

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.value)}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-sm font-semibold transition-all",
              activePreset === preset.id
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <span className="text-lg">
              {preset.id === "low" ? "🟢" : preset.id === "balanced" ? "🟡" : "🔴"}
            </span>
            {preset.label}
          </button>
        ))}
      </div>

      {/* Fine-grained slider */}
      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>0.0</span>
          <span className="font-mono font-medium text-indigo-600">{value.toFixed(2)}</span>
          <span>1.0</span>
        </div>
      </div>

      {/* Active description */}
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
        <span className="font-semibold">{active.label}: </span>
        {active.description}
      </div>
    </div>
  );
}
