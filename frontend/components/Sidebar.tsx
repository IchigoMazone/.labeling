"use client";

import { useState } from "react";
import { FolderInput, FolderOutput, Image, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CategoryGalleryModal from "@/components/CategoryGalleryModal";
import { LABEL_CONFIGS } from "@/types";
import type { DatasetStatus, ImageInfo } from "@/types";

interface SidebarProps {
  status: DatasetStatus | null;
  currentImage: ImageInfo | null;
  onReset: () => void;
}

export default function Sidebar({ status, currentImage, onReset }: SidebarProps) {
  const progressPct = status && status.total > 0
    ? Math.round((status.labelled / status.total) * 100)
    : 0;

  const currentLabel = currentImage?.label
    ? LABEL_CONFIGS.find((l) => l.key === currentImage.label)
    : null;

  const [selectedLabelForGallery, setSelectedLabelForGallery] = useState<typeof LABEL_CONFIGS[0] | null>(null);

  return (
    <aside className="w-full flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">🥭</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900">MangoLabel</h1>
            <p className="text-[10px] text-zinc-500">Annotation Tool</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
          title="Đổi dataset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress Card */}
      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-zinc-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Tiến độ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Đã gán nhãn</span>
              <span className="text-emerald-600 font-semibold">
                {status?.labelled ?? 0} / {status?.total ?? 0}
              </span>
            </div>
            <Progress value={progressPct} className="bg-zinc-100 [&>div]:bg-emerald-500" />
            <div className="text-center text-xs font-semibold text-emerald-600">
              {progressPct}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatBox
              label="Tổng"
              value={status?.total ?? 0}
              color="text-zinc-700"
            />
            <StatBox
              label="Xong"
              value={status?.labelled ?? 0}
              color="text-emerald-600"
            />
            <StatBox
              label="Còn lại"
              value={status?.remaining ?? 0}
              color="text-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Image Info */}
      {currentImage && (
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-zinc-800">
              <Image className="w-4 h-4 text-blue-500" />
              Ảnh hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-zinc-500">
              <span className="text-zinc-400">Index: </span>
              <span className="text-zinc-700 font-mono">
                {currentImage.index + 1} / {currentImage.total}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-zinc-400">File: </span>
              <span
                className="text-zinc-700 font-mono break-all leading-tight"
                title={currentImage.filename}
              >
                {currentImage.filename}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-zinc-400">Nhãn: </span>
              {currentLabel ? (
                <Badge
                  className={`text-[10px] px-2 py-0 truncate max-w-[160px] ${currentLabel.bgColor} ${currentLabel.color} ${currentLabel.borderColor}`}
                >
                  {currentLabel.name}
                </Badge>
              ) : (
                <span className="text-zinc-400 italic">Chưa gán nhãn</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paths & Label Counts */}
      {status?.input_dir && (
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-zinc-800">
              <FolderInput className="w-4 h-4 text-purple-500" />
              Thư mục
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] text-zinc-400 mb-1">INPUT</p>
              <p
                className="text-[11px] font-mono text-zinc-600 break-all leading-tight"
                title={status.input_dir}
              >
                {status.input_dir}
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-3">
              <div className="flex items-center gap-1 mb-1">
                <FolderOutput className="w-3 h-3 text-blue-500" />
                <p className="text-[10px] text-zinc-400">OUTPUT</p>
              </div>
              <p
                className="text-[11px] font-mono text-zinc-600 break-all leading-tight mb-3"
                title={status.output_dir ?? ""}
              >
                {status.output_dir}
              </p>
              
              {/* Thống kê nhãn trong output */}
              <div className="space-y-1.5 bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                <p className="text-[10px] font-semibold text-zinc-500 mb-1">CHI TIẾT PHÂN LOẠI:</p>
                {LABEL_CONFIGS.map(label => {
                  const count = status.label_counts?.[label.key] || 0;
                  return (
                    <div 
                      key={label.key} 
                      onClick={() => count > 0 && setSelectedLabelForGallery(label)}
                      className={`flex justify-between items-center text-[10px] p-1 rounded transition-colors ${count > 0 ? "cursor-pointer hover:bg-zinc-200" : "opacity-50 cursor-not-allowed"}`}
                      title={count > 0 ? "Bấm để xem danh sách ảnh" : ""}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 mr-2">
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${label.bgColor} border ${label.borderColor}`} />
                        <span className={`truncate ${label.color}`}>{label.name}</span>
                      </div>
                      <span className="font-bold text-zinc-700 bg-white px-1.5 rounded border border-zinc-200 shadow-sm min-w-[20px] text-center flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      <Card className="border-zinc-200 bg-white shadow-sm mt-auto">
        <CardContent className="pt-4">
          <p className="text-[10px] text-zinc-500 mb-2 font-semibold uppercase tracking-wider">Phím tắt</p>
          <div className="grid grid-cols-2 gap-1">
            {LABEL_CONFIGS.map((l) => (
              <div key={l.key} className="flex items-center gap-1.5 min-w-0">
                <kbd className={`flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded border ${l.borderColor} ${l.color} ${l.bgColor} min-w-[18px] text-center`}>
                  {l.shortcut}
                </kbd>
                <span className="text-[10px] text-zinc-600 truncate">{l.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-100 grid grid-cols-2 gap-1">
            {[
              { key: "←", desc: "Trước" },
              { key: "→", desc: "Tiếp" },
              { key: "Space", desc: "Bỏ qua" },
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-600 bg-zinc-50 shadow-sm">
                  {s.key}
                </kbd>
                <span className="text-[10px] text-zinc-600">{s.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Gallery Modal */}
      {selectedLabelForGallery && (
        <CategoryGalleryModal
          isOpen={!!selectedLabelForGallery}
          onClose={() => setSelectedLabelForGallery(null)}
          labelConfig={selectedLabelForGallery}
        />
      )}
    </aside>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-50 rounded-lg p-2 text-center border border-zinc-200 shadow-sm">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}
