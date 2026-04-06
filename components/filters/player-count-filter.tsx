"use client";

import { Button } from "@/components/ui/button";

export interface PlayerCountFilterProps {
  label: string;
  selected: number | "any";
  onChange: (value: number | "any") => void;
}

const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function PlayerCountFilter({
  label,
  selected,
  onChange,
}: PlayerCountFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selected === "any" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("any")}
          aria-pressed={selected === "any"}
        >
          Any
        </Button>
        {PLAYER_COUNTS.map((n) => (
          <Button
            key={n}
            variant={selected === n ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(n)}
            aria-pressed={selected === n}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}
