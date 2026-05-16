// ─── Core Types ───────────────────────────────────────────────────────────────

export interface ImageInfo {
  id: string;
  filename: string;
  path: string;
  url: string;
  label: string | null;
  index: number;
  total: number;
}

export interface DatasetStatus {
  total: number;
  labelled: number;
  remaining: number;
  current_index: number;
  is_loaded: boolean;
  input_dir: string | null;
  output_dir: string | null;
  label_counts: Record<string, number>;
}

export interface LabelInfo {
  key: string;
  name: string;
  shortcut: string;
}

export interface LabelledImageRecord {
  image_id: string;
  original_filename: string;
  original_path: string;
  label: string;
  output_path: string;
  labelled_at: string;
}

// ─── Request Types ────────────────────────────────────────────────────────────

export interface LoadDatasetRequest {
  input_dir: string;
  output_dir: string;
}

export interface LabelRequest {
  label: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface LoadDatasetResponse {
  success: boolean;
  message: string;
  total: number;
  labelled: number;
  remaining: number;
  current_index: number;
  label_counts: Record<string, number>;
}

export interface LabelImageResponse {
  success: boolean;
  message: string;
  labelled_image: LabelledImageRecord;
  next_image: ImageInfo | null;
}

export interface UploadImageResponse {
  success: boolean;
  message: string;
  image: ImageInfo;
}

export interface LabeledGalleryImage {
  id: string;
  filename: string;
  url: string;
  label: string;
}

export interface LabeledImagesResponse {
  images: LabeledGalleryImage[];
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Label display config
export interface LabelConfig {
  key: string;
  name: string;
  shortcut: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBgColor: string;
}

export const LABEL_CONFIGS: LabelConfig[] = [
  {
    key: "hong",
    name: "Hỏng",
    shortcut: "1",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    hoverBgColor: "hover:bg-red-100",
  },
  {
    key: "co_thuoc_kich_thich",
    name: "Có thuốc kích thích",
    shortcut: "2",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBgColor: "hover:bg-orange-100",
  },
  {
    key: "xanh_uong",
    name: "Xanh ương",
    shortcut: "3",
    color: "text-lime-700",
    bgColor: "bg-lime-50",
    borderColor: "border-lime-200",
    hoverBgColor: "hover:bg-lime-100",
  },
  {
    key: "xanh_cung_dam",
    name: "Xanh cứng đậm",
    shortcut: "4",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverBgColor: "hover:bg-green-100",
  },
  {
    key: "chin_vang",
    name: "Chín vàng",
    shortcut: "5",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    hoverBgColor: "hover:bg-yellow-100",
  },
  {
    key: "chin_dom_sap_hong",
    name: "Chín đốm sắp hỏng",
    shortcut: "6",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBgColor: "hover:bg-purple-100",
  },
];
