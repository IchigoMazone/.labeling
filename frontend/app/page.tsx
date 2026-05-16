"use client";

import { useState, useEffect, useCallback } from "react";
import type { DatasetStatus, ImageInfo, LoadDatasetRequest } from "@/types";
import { LABEL_CONFIGS } from "@/types";
import {
  loadDataset,
  getDatasetStatus,
  getCurrentImage,
  getImageUrl,
  labelImage,
  navigateNext,
  navigatePrevious,
  skipImage,
  gotoUnlabelled,
  uploadImage,
} from "@/lib/api";

import SetupPanel from "@/components/SetupPanel";
import Sidebar from "@/components/Sidebar";
import ImageViewer from "@/components/ImageViewer";
import LabelPanel from "@/components/LabelPanel";
import NavigationBar from "@/components/NavigationBar";
import { ToastContainer, useToast } from "@/components/ToastNotification";

type AppState = "setup" | "labeling";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("setup");
  const [status, setStatus] = useState<DatasetStatus | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageInfo | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [isLabeling, setIsLabeling] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  // ─── Load image URL ───────────────────────────────────────────────────────

  const setCurrentImageAndUrl = useCallback((img: ImageInfo | null) => {
    setCurrentImage(img);
    if (img) {
      setIsImageLoading(true);
      const url = getImageUrl(img.id);
      const image = new Image();
      image.onload = () => {
        setImageUrl(url);
        setIsImageLoading(false);
      };
      image.onerror = () => {
        setImageUrl(url);
        setIsImageLoading(false);
      };
      image.src = url;
    } else {
      setImageUrl(null);
      setIsImageLoading(false);
    }
  }, []);

  // ─── Refresh status ───────────────────────────────────────────────────────

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getDatasetStatus();
      setStatus(s);
    } catch {
      // ignore
    }
  }, []);

  // ─── Setup / Load dataset ─────────────────────────────────────────────────

  const handleLoad = useCallback(
    async (data: LoadDatasetRequest) => {
      setIsSetupLoading(true);
      try {
        await loadDataset(data);
        const [statusData, imgData] = await Promise.all([
          getDatasetStatus(),
          getCurrentImage(),
        ]);
        setStatus(statusData);
        setCurrentImageAndUrl(imgData);
        setAppState("labeling");
        addToast(`Đã load ${statusData.total} ảnh thành công!`, "success");
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Không thể load dataset",
          "error"
        );
        throw err;
      } finally {
        setIsSetupLoading(false);
      }
    },
    [addToast, setCurrentImageAndUrl]
  );

  const handleReset = useCallback(() => {
    setAppState("setup");
    setStatus(null);
    setCurrentImage(null);
    setImageUrl(null);
  }, []);

  // ─── Label ────────────────────────────────────────────────────────────────

  const handleLabel = useCallback(
    async (label: string) => {
      if (!currentImage || isLabeling) return;
      setIsLabeling(true);
      try {
        const res = await labelImage(currentImage.id, label);

        if (res.next_image) {
          setCurrentImageAndUrl(res.next_image);
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  labelled: prev.labelled + (currentImage.label ? 0 : 1),
                  remaining: prev.remaining - (currentImage.label ? 0 : 1),
                  current_index: res.next_image!.index,
                }
              : prev
          );
        } else {
          setCurrentImage((prev) => (prev ? { ...prev, label } : prev));
        }
        await refreshStatus();
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Lỗi khi gán nhãn",
          "error"
        );
      } finally {
        setIsLabeling(false);
      }
    },
    [currentImage, isLabeling, addToast, setCurrentImageAndUrl, refreshStatus]
  );

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleNav = useCallback(
    async (action: () => Promise<ImageInfo>) => {
      if (isNavigating || isLabeling) return;
      setIsNavigating(true);
      try {
        const img = await action();
        setCurrentImageAndUrl(img);
        setStatus((prev) =>
          prev ? { ...prev, current_index: img.index } : prev
        );
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Lỗi điều hướng",
          "error"
        );
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, isLabeling, addToast, setCurrentImageAndUrl]
  );

  const handlePrev = useCallback(() => handleNav(navigatePrevious), [handleNav]);
  const handleNext = useCallback(() => handleNav(navigateNext), [handleNav]);
  const handleSkip = useCallback(() => handleNav(skipImage), [handleNav]);
  const handleGotoUnlabelled = useCallback(
    () => handleNav(gotoUnlabelled),
    [handleNav]
  );

  // ─── Upload / Paste ───────────────────────────────────────────────────────

  const handlePasteUpload = useCallback(
    async (file: File) => {
      try {
        const res = await uploadImage(file);
        setCurrentImageAndUrl(res.image);
        addToast(res.message, "success");
        await refreshStatus();
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Lỗi upload ảnh",
          "error"
        );
      }
    },
    [addToast, setCurrentImageAndUrl, refreshStatus]
  );

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    if (appState !== "labeling") return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case " ":
          e.preventDefault();
          handleSkip();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6": {
          const idx = parseInt(e.key) - 1;
          const label = LABEL_CONFIGS[idx];
          if (label) handleLabel(label.key);
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [appState, handleNext, handlePrev, handleSkip, handleLabel]);

  // ─── Render: Setup ────────────────────────────────────────────────────────

  if (appState === "setup") {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-900/40 text-3xl">
                🥭
              </div>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Mango Label Tool
            </h1>
            <p className="text-zinc-600 text-lg">
              Công cụ gán nhãn ảnh xoài công nghiệp thủ công
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                6 nhãn phân loại
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Phím tắt 1-6
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Lưu CSV &amp; JSON
              </span>
            </div>
          </div>

          <SetupPanel onLoad={handleLoad} isLoading={isSetupLoading} />
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // ─── Render: Labeling ─────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-zinc-50 text-zinc-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-zinc-200 overflow-y-auto p-4 bg-white">
        <Sidebar
          status={status}
          currentImage={currentImage}
          onReset={handleReset}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Image Viewer — fills available space */}
        <div className="flex-1 min-h-0 p-3 pb-0">
          <ImageViewer
            image={currentImage}
            imageUrl={imageUrl}
            onPasteUpload={handlePasteUpload}
            isLoading={isImageLoading}
          />
        </div>

        {/* Bottom panel — label buttons + navigation */}
        <div className="flex-shrink-0 border-t border-zinc-200 bg-white/80 backdrop-blur p-4 space-y-3">
          <LabelPanel
            currentLabel={currentImage?.label ?? null}
            onLabel={handleLabel}
            isLabeling={isLabeling}
            disabled={!currentImage}
          />
          <div className="border-t border-zinc-200 pt-3">
            <NavigationBar
              currentImage={currentImage}
              onPrev={handlePrev}
              onNext={handleNext}
              onSkip={handleSkip}
              onGotoUnlabelled={handleGotoUnlabelled}
              isNavigating={isNavigating}
              disabled={!currentImage}
            />
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
