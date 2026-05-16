"use client";

import { ChevronLeft, ChevronRight, SkipForward, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageInfo } from "@/types";

interface NavigationBarProps {
  currentImage: ImageInfo | null;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onGotoUnlabelled: () => void;
  isNavigating: boolean;
  disabled?: boolean;
}

export default function NavigationBar({
  currentImage,
  onPrev,
  onNext,
  onSkip,
  onGotoUnlabelled,
  isNavigating,
  disabled = false,
}: NavigationBarProps) {
  const isDisabled = disabled || isNavigating;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Prev */}
      <Button
        id="nav-prev"
        variant="outline"
        size="lg"
        onClick={onPrev}
        disabled={isDisabled}
        className="flex-1 max-w-[160px] gap-2 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Trước</span>
        <kbd className="text-[10px] text-zinc-500 border border-zinc-200 bg-white rounded px-1 py-0.5 shadow-sm">←</kbd>
      </Button>

      {/* Center: Skip + Go to Unlabelled */}
      <div className="flex items-center gap-2">
        <Button
          id="nav-goto-unlabelled"
          variant="ghost"
          size="sm"
          onClick={onGotoUnlabelled}
          disabled={isDisabled}
          className="text-zinc-600 hover:text-zinc-900 gap-1.5 text-xs"
        >
          <Target className="w-3.5 h-3.5" />
          Đến ảnh chưa gán
        </Button>

        <Button
          id="nav-skip"
          variant="secondary"
          size="sm"
          onClick={onSkip}
          disabled={isDisabled}
          className="gap-1.5 text-xs bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Bỏ qua
          <kbd className="text-[10px] text-zinc-500 border border-zinc-200 bg-white rounded px-1 py-0.5 shadow-sm">
            Space
          </kbd>
        </Button>
      </div>

      {/* Right: Next */}
      <Button
        id="nav-next"
        variant="outline"
        size="lg"
        onClick={onNext}
        disabled={isDisabled}
        className="flex-1 max-w-[160px] gap-2 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
      >
        <span className="text-sm">Tiếp</span>
        <kbd className="text-[10px] text-zinc-500 border border-zinc-200 bg-white rounded px-1 py-0.5 shadow-sm">→</kbd>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
