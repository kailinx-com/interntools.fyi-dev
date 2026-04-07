"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const options = [
  { value: "all", label: "All Activities" },
  { value: "acceptance", label: "Acceptances" },
  { value: "comparison", label: "Comparisons" },
];

type PostTypeProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PostType({ value, onChange }: PostTypeProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        Post Type
      </h3>
      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        {options.map(({ value: v, label }) => (
          <div key={v} className="flex items-center gap-2">
            <RadioGroupItem value={v} id={v} />
            <Label htmlFor={v}>{label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
