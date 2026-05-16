"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLabeledImages, getImageUrl, unlabelImage, labelImage } from "@/lib/api";
import { LABEL_CONFIGS } from "@/types";
import type { LabeledGalleryImage, LabelConfig } from "@/types";

interface CategoryGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelConfig: LabelConfig;
}

export default function CategoryGalleryModal({
  isOpen,
  onClose,
  labelConfig,
}: CategoryGalleryModalProps) {
  const [images, setImages] = useState<LabeledGalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getLabeledImages(labelConfig.key);
        if (isMounted) setImages(res.images);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Lỗi không thể tải danh sách ảnh");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [isOpen, labelConfig.key]);

  const handleUnlabel = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    try {
      setActionLoadingId(imageId);
      await unlabelImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSelectedImageId(null);
    } catch (err) {
      alert("Lỗi khi xoá nhãn: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeLabel = async (e: React.MouseEvent, imageId: string, newLabelKey: string) => {
    e.stopPropagation();
    try {
      setActionLoadingId(imageId);
      await labelImage(imageId, newLabelKey, false); // advance=false
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSelectedImageId(null);
    } catch (err) {
      alert("Lỗi khi đổi nhãn: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full shadow-sm", labelConfig.bgColor, labelConfig.borderColor, "border")} />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 leading-none">
                Thư mục: {labelConfig.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {images.length} ảnh đã được gán nhãn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
              <p className="text-sm font-medium">Đang tải danh sách ảnh...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              <p>{error}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 space-y-3">
              <ImageIcon className="w-12 h-12 text-zinc-200" />
              <p className="text-sm font-medium">Chưa có ảnh nào được gán nhãn này</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {images.map((img) => {
                const isSelected = selectedImageId === img.id;
                const isActionLoading = actionLoadingId === img.id;

                return (
                  <div 
                    key={img.id} 
                    onClick={() => setSelectedImageId(isSelected ? null : img.id)}
                    className={cn(
                      "group relative aspect-square bg-white rounded-xl border transition-all duration-200 cursor-pointer",
                      isSelected 
                        ? "z-30 overflow-visible border-blue-500 shadow-md ring-2 ring-blue-500/20" 
                        : "overflow-hidden border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    )}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.id)}
                        alt={img.filename}
                        loading="lazy"
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-300",
                          isSelected ? "scale-105" : "group-hover:scale-105"
                        )}
                      />
                    </div>
                    
                    {/* Default Hover Overlay */}
                    {!isSelected && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate font-medium" title={img.filename}>
                          {img.filename}
                        </p>
                      </div>
                    )}

                    {/* Selected Action Overlay */}
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 rounded-xl bg-black/25 backdrop-blur-[1px]" />
                        <div
                          className={cn(
                            "absolute left-1/2 top-1/2 z-40 w-44 -translate-x-1/2 -translate-y-1/2",
                            "rounded-lg border border-zinc-200 bg-white p-2 shadow-2xl",
                            "animate-in fade-in zoom-in-95 duration-200"
                          )}
                        >
                        {isActionLoading ? (
                          <div className="flex h-28 items-center justify-center text-zinc-500">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              {LABEL_CONFIGS.filter(l => l.key !== labelConfig.key).map(l => (
                                <button
                                  key={l.key}
                                  onClick={(e) => handleChangeLabel(e, img.id, l.key)}
                                  className={cn(
                                    "w-full text-center px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all border shadow-sm",
                                    l.bgColor, l.color, l.borderColor,
                                    "hover:brightness-95 active:scale-[0.98]"
                                  )}
                                >
                                  {l.name}
                                </button>
                              ))}
                            </div>
                            
                            <button
                              onClick={(e) => handleUnlabel(e, img.id)}
                              className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xoá nhãn
                            </button>
                          </>
                        )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
