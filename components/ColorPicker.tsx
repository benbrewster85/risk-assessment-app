"use client";

import { Check } from "lucide-react";

// A predefined palette of good-looking, accessible colors
const colorPalette = [
  "bg-stone-200 text-stone-800 border-stone-400",
  "bg-red-100 text-red-800 border-red-400",
  "bg-orange-100 text-orange-800 border-orange-400",
  "bg-amber-100 text-amber-slate-800 border-amber-400",
  "bg-yellow-100 text-yellow-800 border-yellow-400",
  "bg-lime-100 text-lime-800 border-lime-400",
  "bg-green-100 text-green-800 border-green-400",
  "bg-emerald-100 text-emerald-800 border-emerald-400",
  "bg-red-200 text-red-800 border-red-400",
  "bg-orange-200 text-orange-800 border-orange-400",
  "bg-amber-200 text-amber-800 border-amber-400",
  "bg-yellow-200 text-yellow-800 border-yellow-400",
  "bg-lime-200 text-lime-800 border-lime-400",
  "bg-green-200 text-green-800 border-green-400",
  "bg-emerald-200 text-emerald-800 border-emerald-400",
  "bg-teal-200 text-teal-800 border-teal-400",
  "bg-cyan-200 text-cyan-800 border-cyan-400",
  "bg-sky-200 text-sky-800 border-sky-400",
  "bg-blue-200 text-blue-800 border-blue-400",
  "bg-indigo-200 text-indigo-800 border-indigo-400",
  "bg-violet-200 text-violet-800 border-violet-400",
  "bg-purple-200 text-purple-800 border-purple-400",
  "bg-fuchsia-200 text-fuchsia-800 border-fuchsia-400",
  "bg-pink-200 text-pink-800 border-pink-400",
  "bg-rose-200 text-rose-800 border-rose-400",
];

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export default function ColorPicker({
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colorPalette.map((colorClass) => {
        const isSelected = value === colorClass;
        return (
          <button
            type="button"
            key={colorClass}
            onClick={() => onChange(colorClass)}
            disabled={disabled}
            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${colorClass.split(" ")[0]} ${isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
            aria-label={`Select color ${colorClass}`}
          >
            {isSelected && <Check className="w-5 h-5 mx-auto" />}
          </button>
        );
      })}
    </div>
  );
}
