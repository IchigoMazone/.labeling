"use client";

import { useCallback, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Upload, ClipboardPaste, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageInfo } from "@/types";

interface ImageViewerProps {
  image: ImageInfo | null;
  imageUrl: string | null;
  onPasteUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export default function ImageViewer({
  image,
  imageUrl,
  onPasteUpload,
  isLoading = false,
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      const pastedFile = new File([file], `paste_${Date.now()}.png`, {
        type: file.type,
      });
      await onPasteUpload(pastedFile);
    },
    [onPasteUpload]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        await onPasteUpload(imageFiles[0]);
      }
    },
    [onPasteUpload]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onPasteUpload(file);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onPasteUpload]
  );

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Thu nhỏ (Ctrl+Scroll)">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-zinc-400 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Phóng to">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomReset} title="Reset zoom">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-7 px-2"
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
          <div className="text-xs text-zinc-600 flex items-center gap-1">
            <ClipboardPaste className="w-3 h-3" />
            Paste/Drop ảnh vào đây
          </div>
        </div>
      </div>

      {/* Image Area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onWheel={handleWheel}
        onPaste={handlePaste}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative flex-1 flex items-center justify-center rounded-2xl overflow-hidden cursor-crosshair
          outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0
          transition-all duration-200
          ${isDragOver
            ? "bg-emerald-50 border-2 border-dashed border-emerald-500 ring-4 ring-emerald-500/20"
            : "bg-zinc-50 border border-zinc-200 shadow-inner"
          }
        `}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm text-zinc-600 font-medium">Đang tải ảnh...</span>
            </div>
          </div>
        )}

        {!image && !isLoading && (
          <div className="flex flex-col items-center gap-4 text-zinc-400 select-none">
            <ImageOff className="w-16 h-16 opacity-50" />
            <p className="text-sm font-medium">Chưa có ảnh nào được tải</p>
            <p className="text-xs text-zinc-500">
              Drag & drop hoặc paste ảnh vào đây để thêm
            </p>
          </div>
        )}

        {imageUrl && !isLoading && (
          <div
            className="transition-transform duration-200 ease-out select-none"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={imageUrl}
              src={imageUrl}
              alt={image?.filename ?? "Ảnh xoài"}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                maxHeight: "calc(100vh - 280px)",
                maxWidth: "100%",
              }}
              draggable={false}
            />
          </div>
        )}

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80 z-20 pointer-events-none backdrop-blur-sm">
            <div className="text-center">
              <Upload className="w-12 h-12 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <p className="text-emerald-700 font-semibold">Thả ảnh để thêm vào dataset</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
