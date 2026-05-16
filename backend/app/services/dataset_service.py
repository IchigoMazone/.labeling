"""
Dataset service: logic chính để load, quản lý, và điều hướng dataset ảnh.
"""

import uuid
from pathlib import Path
from typing import Optional, Tuple

from ..core.config import app_state
from ..core.labels import VALID_LABELS
from ..models.schemas import (
    ImageRecord,
    ImageResponse,
    LoadDatasetResponse,
    DatasetStatus,
)
from .file_service import scan_images, create_output_structure
from .metadata_service import load_progress, save_progress


def _build_image_response(index: int) -> Optional[ImageResponse]:
    """Tạo ImageResponse từ ImageRecord tại index."""
    if index < 0 or index >= len(app_state.images):
        return None
    img = app_state.images[index]
    return ImageResponse(
        id=img.id,
        filename=img.filename,
        path=img.path,
        url=f"/api/images/file/{img.id}",
        label=img.label,
        index=index,
        total=app_state.total,
    )


def load_dataset(input_dir: str, output_dir: str) -> LoadDatasetResponse:
    """
    Load dataset từ input_dir.
    - Kiểm tra input_dir tồn tại.
    - Tạo output_dir và 6 folder nhãn.
    - Scan ảnh trong input_dir.
    - Load tiến độ từ progress.json nếu có.
    """
    input_path = Path(input_dir)
    if not input_path.exists():
        raise ValueError(f"Thư mục input không tồn tại: {input_dir}")
    if not input_path.is_dir():
        raise ValueError(f"Đường dẫn không phải thư mục: {input_dir}")

    # Tạo cấu trúc output
    create_output_structure(output_dir, VALID_LABELS)

    # Thử load progress cũ
    existing_progress = load_progress(output_dir)

    if (
        existing_progress
        and existing_progress.input_dir == str(input_path.resolve())
    ):
        # Resume từ progress cũ
        app_state.input_dir = existing_progress.input_dir
        app_state.output_dir = str(Path(output_dir).resolve())
        app_state.images = existing_progress.images
        app_state.current_index = existing_progress.current_index
        app_state.is_loaded = True

        # Quét lại để thêm ảnh mới nếu có
        current_paths = {img.path for img in app_state.images}
        new_image_paths = scan_images(input_dir)
        for img_path in new_image_paths:
            resolved = str(Path(img_path).resolve())
            if resolved not in current_paths:
                image_id = str(uuid.uuid5(uuid.NAMESPACE_URL, resolved))
                app_state.images.append(
                    ImageRecord(
                        id=image_id,
                        filename=Path(img_path).name,
                        path=resolved,
                        label=None,
                        output_path=None,
                    )
                )
    else:
        # Load mới hoàn toàn
        image_paths = scan_images(input_dir)
        images = []
        for img_path in image_paths:
            resolved = str(Path(img_path).resolve())
            image_id = str(uuid.uuid5(uuid.NAMESPACE_URL, resolved))
            images.append(
                ImageRecord(
                    id=image_id,
                    filename=Path(img_path).name,
                    path=resolved,
                    label=None,
                    output_path=None,
                )
            )

        app_state.input_dir = str(input_path.resolve())
        app_state.output_dir = str(Path(output_dir).resolve())
        app_state.images = images
        app_state.current_index = 0
        app_state.is_loaded = True

    # Lưu progress
    save_progress(
        app_state.output_dir,
        app_state.input_dir,
        app_state.current_index,
        app_state.images,
    )

    counts = {}
    for img in app_state.images:
        if img.label:
            counts[img.label] = counts.get(img.label, 0) + 1

    return LoadDatasetResponse(
        success=True,
        message=f"Đã load {app_state.total} ảnh từ {input_dir}",
        total=app_state.total,
        labelled=app_state.labelled_count,
        remaining=app_state.remaining_count,
        current_index=app_state.current_index,
        label_counts=counts,
    )


def get_dataset_status() -> DatasetStatus:
    """Trả về trạng thái hiện tại của dataset."""
    counts = {}
    for img in app_state.images:
        if img.label:
            counts[img.label] = counts.get(img.label, 0) + 1

    return DatasetStatus(
        total=app_state.total,
        labelled=app_state.labelled_count,
        remaining=app_state.remaining_count,
        current_index=app_state.current_index,
        is_loaded=app_state.is_loaded,
        input_dir=app_state.input_dir,
        output_dir=app_state.output_dir,
        label_counts=counts,
    )


def get_current_image() -> Optional[ImageResponse]:
    """Trả về ảnh tại current_index."""
    if not app_state.is_loaded:
        return None
    return _build_image_response(app_state.current_index)


def get_image_by_id(image_id: str) -> Optional[ImageRecord]:
    """Tìm ImageRecord theo ID."""
    for img in app_state.images:
        if img.id == image_id:
            return img
    return None


def navigate_next() -> Optional[ImageResponse]:
    """Chuyển sang ảnh tiếp theo (tuần tự)."""
    if not app_state.is_loaded or app_state.total == 0:
        return None
    app_state.current_index = (app_state.current_index + 1) % app_state.total
    _save_progress_state()
    return _build_image_response(app_state.current_index)


def navigate_previous() -> Optional[ImageResponse]:
    """Chuyển về ảnh trước (tuần tự)."""
    if not app_state.is_loaded or app_state.total == 0:
        return None
    app_state.current_index = (app_state.current_index - 1) % app_state.total
    _save_progress_state()
    return _build_image_response(app_state.current_index)


def navigate_skip() -> Optional[ImageResponse]:
    """Bỏ qua ảnh hiện tại và chuyển sang ảnh tiếp theo chưa gán nhãn."""
    if not app_state.is_loaded or app_state.total == 0:
        return None
    next_idx = app_state.find_next_unlabelled()
    if next_idx is not None:
        app_state.current_index = next_idx
    else:
        # Không có ảnh chưa nhãn, chuyển tuần tự
        app_state.current_index = (app_state.current_index + 1) % app_state.total
    _save_progress_state()
    return _build_image_response(app_state.current_index)


def navigate_to_unlabelled() -> Optional[ImageResponse]:
    """Nhảy đến ảnh chưa gán nhãn đầu tiên."""
    if not app_state.is_loaded or app_state.total == 0:
        return None
    # Tìm từ đầu
    for i, img in enumerate(app_state.images):
        if img.label is None:
            app_state.current_index = i
            _save_progress_state()
            return _build_image_response(i)
    return _build_image_response(app_state.current_index)


def add_image_to_dataset(image_id: str, filename: str, path: str) -> ImageResponse:
    """Thêm ảnh mới (từ upload) vào dataset."""
    new_image = ImageRecord(
        id=image_id,
        filename=filename,
        path=path,
        label=None,
        output_path=None,
    )
    app_state.images.append(new_image)
    new_index = len(app_state.images) - 1
    app_state.current_index = new_index
    _save_progress_state()
    return _build_image_response(new_index)


def _save_progress_state():
    """Lưu trạng thái hiện tại vào progress.json."""
    if app_state.is_loaded and app_state.output_dir:
        save_progress(
            app_state.output_dir,
            app_state.input_dir,
            app_state.current_index,
            app_state.images,
        )

def get_labeled_images(label: str):
    """Trả về danh sách ảnh đã được gán nhãn cụ thể."""
    if not app_state.is_loaded:
        return []
    
    result = []
    for img in app_state.images:
        if img.label == label:
            result.append({
                "id": img.id,
                "filename": img.filename,
                "url": f"/api/images/file/{img.id}",
                "label": img.label
            })
    return result
