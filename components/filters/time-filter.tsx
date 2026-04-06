"use client";

import { Slider } from "@/components/ui/slider";
import { formatTimeRange } from "@/lib/filter-games";

export interface TimeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export function TimeFilter({ min, max, value, onChange }: TimeFilterProps) {
  function handleValueChange(newValue: number | readonly number[]) {
    const arr = Array.isArray(newValue) ? newValue : [newValue];
    onChange([arr[0] as number, arr[1] as number]);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm text-muted-foreground">
        {formatTimeRange(value[0], value[1])}
      </span>
      <Slider
        min={min}
        max={max}
        value={value}
        onValueChange={handleValueChange}
        aria-label="Playing time range"
      />
    </div>
  );
}
