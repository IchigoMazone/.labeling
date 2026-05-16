/**
 * API client cho Mango Labeling Tool.
 * Tất cả giao tiếp với FastAPI backend đi qua file này.
 */

import type {
  LoadDatasetRequest,
  LoadDatasetResponse,
  DatasetStatus,
  ImageInfo,
  LabelInfo,
  LabelImageResponse,
  UploadImageResponse,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL === undefined
    ? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.detail || JSON.stringify(json);
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// ─── Dataset APIs ─────────────────────────────────────────────────────────────

export async function loadDataset(
  data: LoadDatasetRequest
): Promise<LoadDatasetResponse> {
  return apiRequest<LoadDatasetResponse>("/api/dataset/load", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getDatasetStatus(): Promise<DatasetStatus> {
  return apiRequest<DatasetStatus>("/api/dataset/status");
}

export async function browseDirectory(): Promise<{ path: string }> {
  return apiRequest<{ path: string }>("/api/dataset/browse");
}

export async function getLabeledImages(labelKey: string) {
  return apiRequest<{ images: import("@/types").LabeledGalleryImage[] }>(
    `/api/dataset/labeled/${encodeURIComponent(labelKey)}`
  );
}

// ─── Image APIs ───────────────────────────────────────────────────────────────

export async function getCurrentImage(): Promise<ImageInfo> {
  return apiRequest<ImageInfo>("/api/images/current");
}

export function getImageUrl(imageId: string): string {
  return `${API_BASE}/api/images/file/${imageId}`;
}

export async function labelImage(
  imageId: string,
  label: string,
  advance: boolean = true
): Promise<LabelImageResponse> {
  return apiRequest<LabelImageResponse>(`/api/images/${imageId}/label?advance=${advance}`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function unlabelImage(imageId: string): Promise<ImageInfo> {
  return apiRequest<ImageInfo>(`/api/images/${imageId}/unlabel`, {
    method: "POST",
  });
}

export async function navigateNext(): Promise<ImageInfo> {
  return apiRequest<ImageInfo>("/api/images/next", { method: "POST" });
}

export async function navigatePrevious(): Promise<ImageInfo> {
  return apiRequest<ImageInfo>("/api/images/previous", { method: "POST" });
}

export async function skipImage(): Promise<ImageInfo> {
  return apiRequest<ImageInfo>("/api/images/skip", { method: "POST" });
}

export async function gotoUnlabelled(): Promise<ImageInfo> {
  return apiRequest<ImageInfo>("/api/images/goto-unlabelled", { method: "POST" });
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/images/upload`, {
    method: "POST",
    body: formData,
    // KHÔNG set Content-Type — để browser tự set với boundary
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.detail || JSON.stringify(json);
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<UploadImageResponse>;
}

// ─── Labels API ───────────────────────────────────────────────────────────────

export async function getLabels(): Promise<LabelInfo[]> {
  return apiRequest<LabelInfo[]>("/api/labels");
}
