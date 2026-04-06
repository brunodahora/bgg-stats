"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { WeightCategory } from "@/lib/types";

const WEIGHT_CATEGORIES: WeightCategory[] = [
  "Light",
  "Medium Light",
  "Medium",
  "Medium Heavy",
  "Heavy",
];

export interface WeightFilterProps {
  selected: WeightCategory[];
  onChange: (categories: WeightCategory[]) => void;
}

export function WeightFilter({ selected, onChange }: WeightFilterProps) {
  function handleToggle(category: WeightCategory, checked: boolean) {
    if (checked) {
      onChange([...selected, category]);
    } else {
      onChange(selected.filter((c) => c !== category));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {WEIGHT_CATEGORIES.map((category) => (
        <label
          key={category}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox
            checked={selected.includes(category)}
            onCheckedChange={(checked) => handleToggle(category, !!checked)}
          />
          <span className="text-sm">{category}</span>
        </label>
      ))}
    </div>
  );
}
