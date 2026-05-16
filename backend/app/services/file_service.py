"""
Service xử lý file: copy ảnh, tránh trùng tên, lưu ảnh upload.
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def is_image_file(path: str) -> bool:
    """Kiểm tra file có phải ảnh không."""
    return Path(path).suffix.lower() in SUPPORTED_EXTENSIONS


def scan_images(directory: str) -> list:
    """
    Quét tất cả ảnh trong directory (không đệ quy).
    Trả về danh sách đường dẫn ảnh.
    """
    directory_path = Path(directory)
    images = []
    for file in sorted(directory_path.iterdir()):
        if file.is_file() and is_image_file(str(file)):
            images.append(str(file))
    return images


def copy_image_to_label_folder(
    src_path: str,
    output_dir: str,
    label: str,
    original_filename: str
) -> str:
    """
    Copy ảnh từ src_path sang output_dir/label/filename.
    Nếu trùng tên, thêm suffix _1, _2, ... để tránh ghi đè.
    Trả về đường dẫn đầy đủ của file đã copy.
    """
    label_dir = Path(output_dir) / label
    label_dir.mkdir(parents=True, exist_ok=True)

    stem = Path(original_filename).stem
    suffix = Path(original_filename).suffix
    dest_path = label_dir / original_filename

    # Tránh ghi đè: thêm suffix nếu trùng tên
    counter = 1
    while dest_path.exists():
        dest_path = label_dir / f"{stem}_{counter}{suffix}"
        counter += 1

    shutil.copy2(src_path, dest_path)
    return str(dest_path)


def create_output_structure(output_dir: str, labels: list) -> None:
    """Tạo cấu trúc thư mục output với các folder nhãn."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    for label in labels:
        (output_path / label).mkdir(exist_ok=True)


def save_uploaded_image(
    file_content: bytes,
    filename: str,
    input_dir: str
) -> tuple[str, str]:
    """
    Lưu ảnh upload/paste vào input_dir.
    Nếu trùng tên, thêm UUID prefix.
    Trả về (image_id, full_path).
    """
    input_path = Path(input_dir)
    input_path.mkdir(parents=True, exist_ok=True)

    # Đảm bảo filename hợp lệ
    safe_filename = Path(filename).name
    dest_path = input_path / safe_filename

    # Tránh ghi đè
    if dest_path.exists():
        uid = str(uuid.uuid4())[:8]
        stem = Path(safe_filename).stem
        suffix = Path(safe_filename).suffix
        safe_filename = f"{stem}_{uid}{suffix}"
        dest_path = input_path / safe_filename

    with open(dest_path, "wb") as f:
        f.write(file_content)

    image_id = str(uuid.uuid5(uuid.NAMESPACE_URL, str(dest_path)))
    return image_id, str(dest_path)


def get_image_mime_type(filename: str) -> str:
    """Trả về MIME type dựa trên extension."""
    ext = Path(filename).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
    }
    return mime_map.get(ext, "image/jpeg")
