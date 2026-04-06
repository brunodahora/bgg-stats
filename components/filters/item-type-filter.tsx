"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ItemType } from "@/lib/types";

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "standalone", label: "Standalone" },
  { value: "expansion", label: "Expansion" },
];

export interface ItemTypeFilterProps {
  selected: ItemType[];
  onChange: (types: ItemType[]) => void;
}

export function ItemTypeFilter({ selected, onChange }: ItemTypeFilterProps) {
  function handleToggle(type: ItemType, checked: boolean) {
    if (checked) {
      onChange([...selected, type]);
    } else {
      onChange(selected.filter((t) => t !== type));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {ITEM_TYPES.map(({ value, label }) => (
        <label key={value} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selected.includes(value)}
            onCheckedChange={(checked) => handleToggle(value, !!checked)}
          />
          <span className="text-sm">{label}</span>
        </label>
      ))}
    </div>
  );
}
