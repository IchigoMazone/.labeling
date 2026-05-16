"""
Pydantic models cho request/response của API.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


# ─── Request Models ───────────────────────────────────────────────────────────

class LoadDatasetRequest(BaseModel):
    input_dir: str
    output_dir: str


class LabelRequest(BaseModel):
    label: str


# ─── Core Data Models ─────────────────────────────────────────────────────────

class ImageRecord(BaseModel):
    """Đại diện cho một ảnh trong dataset."""
    id: str
    filename: str
    path: str
    label: Optional[str] = None
    output_path: Optional[str] = None


class LabelInfo(BaseModel):
    """Thông tin về một nhãn."""
    key: str
    name: str
    shortcut: str


class LabelledImageRecord(BaseModel):
    """Record ghi lại thông tin ảnh đã gán nhãn."""
    image_id: str
    original_filename: str
    original_path: str
    label: str
    output_path: str
    labelled_at: datetime


# ─── Response Models ──────────────────────────────────────────────────────────

class ImageResponse(BaseModel):
    """Response trả về thông tin ảnh."""
    id: str
    filename: str
    path: str
    url: str
    label: Optional[str] = None
    index: int
    total: int


class DatasetStatus(BaseModel):
    """Trạng thái tổng quan của dataset."""
    total: int
    labelled: int
    remaining: int
    current_index: int
    is_loaded: bool
    input_dir: Optional[str] = None
    output_dir: Optional[str] = None
    label_counts: dict[str, int] = {}


class LoadDatasetResponse(BaseModel):
    """Response sau khi load dataset."""
    success: bool
    message: str
    total: int
    labelled: int
    remaining: int
    current_index: int
    label_counts: dict[str, int] = {}


class LabelImageResponse(BaseModel):
    """Response sau khi gán nhãn."""
    success: bool
    message: str
    labelled_image: LabelledImageRecord
    next_image: Optional[ImageResponse] = None


class UploadImageResponse(BaseModel):
    """Response sau khi upload ảnh."""
    success: bool
    message: str
    image: ImageResponse


# ─── Progress File Format ─────────────────────────────────────────────────────

class ProgressData(BaseModel):
    """Format của progress.json."""
    input_dir: str
    output_dir: str
    current_index: int
    images: List[ImageRecord]
