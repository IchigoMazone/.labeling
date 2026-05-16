"use client";

import { useState } from "react";
import { FolderOpen, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoadDatasetRequest } from "@/types";
import { browseDirectory } from "@/lib/api";

interface SetupPanelProps {
  onLoad: (data: LoadDatasetRequest) => Promise<void>;
  isLoading: boolean;
  defaultInputDir?: string;
  defaultOutputDir?: string;
}

export default function SetupPanel({
  onLoad,
  isLoading,
  defaultInputDir = "",
  defaultOutputDir = "",
}: SetupPanelProps) {
  const [inputDir, setInputDir] = useState(defaultInputDir);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OUTPUT_DIR =
    defaultOutputDir ||
    "/home/nhattrinh/Downloads/DeepLearning_Group9/labeling/output";

  const handleBrowse = async () => {
    setError(null);
    setIsBrowsing(true);
    try {
      const res = await browseDirectory();
      if (res.path) {
        setInputDir(res.path);
      } else {
        setError("Không chọn được thư mục. Bạn có thể dán đường dẫn thủ công.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được hộp thoại chọn thư mục.");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputDir.trim()) {
      setError("Vui lòng nhập đường dẫn thư mục ảnh đầu vào.");
      return;
    }

    try {
      await onLoad({ input_dir: inputDir.trim(), output_dir: OUTPUT_DIR });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-zinc-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-zinc-900">Tải Dataset</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Nhập đường dẫn thư mục ảnh cần gán nhãn</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Thư mục ảnh đầu vào
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="input-dir"
                value={inputDir}
                onChange={(e) => setInputDir(e.target.value)}
                placeholder="/home/nhattrinh/Downloads/DeepLearning_Group9/path/to/images"
                className="font-mono text-sm bg-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowse}
                disabled={isBrowsing || isLoading}
                className="flex-shrink-0 bg-white"
              >
                {isBrowsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderOpen className="w-4 h-4 mr-2 text-zinc-500" />
                )}
                {isBrowsing ? "Đang mở..." : "Tìm thư mục"}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Dán đường dẫn thư mục chứa ảnh .jpg, .jpeg, .png, .webp, .bmp
            </p>
          </div>

          {/* Ẩn thư mục output, sử dụng giá trị cố định */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Thư mục output đã được cố định:</span><br/>
              <span className="font-mono text-[10px] break-all">{OUTPUT_DIR}</span>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Bắt đầu gán nhãn
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
