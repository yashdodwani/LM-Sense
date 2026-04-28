// Purpose: Layer name pill badge. Displays a layer identifier (e.g. "QLoRA", "RLDF")
// with a subtle indigo/slate colour scheme.

import { clsx } from "clsx";

interface LayerBadgeProps {
  layer: string;
  triggered?: boolean;
  className?: string;
}

const layerColours: Record<string, string> = {
  qlora: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  cda: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  rldf: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  postprocess: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  layer1: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  layer2: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  layer3: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
};

export function LayerBadge({ layer, triggered, className }: LayerBadgeProps) {
  const colour =
    layerColours[layer.toLowerCase()] ??
    "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colour,
        !triggered && "opacity-50 grayscale",
        className,
      )}
    >
      {layer}
    </span>
  );
}
