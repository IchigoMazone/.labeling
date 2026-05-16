"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CONFIGS } from "@/types";

interface LabelPanelProps {
  currentLabel: string | null;
  onLabel: (label: string) => Promise<void>;
  isLabeling: boolean;
  disabled?: boolean;
}

export default function LabelPanel({
  currentLabel,
  onLabel,
  isLabeling,
  disabled = false,
}: LabelPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Chọn nhãn
        </h2>
        {currentLabel && (
          <span className="text-xs text-zinc-500">
            (Đang gán lại nhãn sẽ ghi đè nhãn cũ)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {LABEL_CONFIGS.map((label) => {
          const isActive = currentLabel === label.key;
          const isLoadingThis = isLabeling;

          return (
            <button
              key={label.key}
              id={`label-btn-${label.key}`}
              onClick={() => !disabled && !isLabeling && onLabel(label.key)}
              disabled={disabled || isLabeling}
              className={cn(
                "relative group flex flex-col items-center justify-center gap-2",
                "rounded-xl border p-4 transition-all duration-200 shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed bg-white",
                isActive
                  ? `${label.bgColor} ${label.borderColor} ring-2 ring-offset-0 shadow-md`
                  : `border-zinc-200 ${label.hoverBgColor}`,
                `focus:ring-${label.borderColor}`
              )}
            >
              {/* Shortcut badge */}
              <div
                className={cn(
                  "absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center",
                  "text-[10px] font-bold border bg-white shadow-sm",
                  label.color,
                  label.borderColor
                )}
              >
                {label.shortcut}
              </div>

              {/* Loading state */}
              {isLoadingThis && isActive && (
                <Loader2 className={cn("w-6 h-6 animate-spin", label.color)} />
              )}



              {/* Label name */}
              <span
                className={cn(
                  "text-center font-semibold leading-tight text-sm",
                  label.color
                )}
              >
                {label.name}
              </span>

              {/* Hover effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                  "bg-gradient-to-b from-black/5 to-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
