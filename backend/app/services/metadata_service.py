"""
Service xử lý metadata: lưu/đọc labels.csv, labels.json, progress.json.
"""

import json
import csv
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from ..models.schemas import LabelledImageRecord, ProgressData, ImageRecord


def load_progress(output_dir: str) -> Optional[ProgressData]:
    """Đọc progress.json nếu tồn tại."""
    progress_path = Path(output_dir) / "progress.json"
    if not progress_path.exists():
        return None
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ProgressData(**data)
    except Exception:
        return None


def save_progress(output_dir: str, input_dir: str, current_index: int, images: List[ImageRecord]) -> None:
    """Lưu progress.json."""
    progress_path = Path(output_dir) / "progress.json"
    progress_data = ProgressData(
        input_dir=input_dir,
        output_dir=output_dir,
        current_index=current_index,
        images=images,
    )
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress_data.model_dump(), f, ensure_ascii=False, indent=2, default=str)


def load_labels_json(output_dir: str) -> List[LabelledImageRecord]:
    """Đọc labels.json nếu tồn tại."""
    labels_path = Path(output_dir) / "labels.json"
    if not labels_path.exists():
        return []
    try:
        with open(labels_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [LabelledImageRecord(**item) for item in data]
    except Exception:
        return []


def update_labels_json(output_dir: str, record: LabelledImageRecord) -> None:
    """
    Cập nhật labels.json.
    Nếu image_id đã tồn tại, cập nhật record cũ (relabelling).
    """
    records = load_labels_json(output_dir)
    
    # Tìm và cập nhật nếu đã tồn tại
    updated = False
    for i, r in enumerate(records):
        if r.image_id == record.image_id:
            records[i] = record
            updated = True
            break
    
    if not updated:
        records.append(record)

    labels_path = Path(output_dir) / "labels.json"
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(
            [r.model_dump() for r in records],
            f,
            ensure_ascii=False,
            indent=2,
            default=str,
        )


def update_labels_csv(output_dir: str, record: LabelledImageRecord) -> None:
    """
    Cập nhật labels.csv.
    Nếu image_id đã tồn tại, cập nhật dòng cũ (relabelling).
    """
    csv_path = Path(output_dir) / "labels.csv"
    fieldnames = [
        "image_id",
        "original_filename",
        "original_path",
        "label",
        "output_path",
        "labelled_at",
    ]

    rows = []
    file_exists = csv_path.exists()

    if file_exists:
        with open(csv_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

    # Tìm và cập nhật nếu đã tồn tại
    updated = False
    new_row = {
        "image_id": record.image_id,
        "original_filename": record.original_filename,
        "original_path": record.original_path,
        "label": record.label,
        "output_path": record.output_path,
        "labelled_at": record.labelled_at.isoformat(),
    }

    for i, row in enumerate(rows):
        if row.get("image_id") == record.image_id:
            rows[i] = new_row
            updated = True
            break

    if not updated:
        rows.append(new_row)

    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def remove_label_from_metadata(output_dir: str, image_id: str) -> None:
    """Xoá record khỏi labels.json và labels.csv."""
    # Update JSON
    records = load_labels_json(output_dir)
    new_records = [r for r in records if r.image_id != image_id]
    if len(new_records) != len(records):
        labels_path = Path(output_dir) / "labels.json"
        with open(labels_path, "w", encoding="utf-8") as f:
            json.dump(
                [r.model_dump() for r in new_records],
                f,
                ensure_ascii=False,
                indent=2,
                default=str,
            )

    # Update CSV
    csv_path = Path(output_dir) / "labels.csv"
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        new_rows = [row for row in rows if row.get("image_id") != image_id]
        if len(new_rows) != len(rows):
            fieldnames = [
                "image_id",
                "original_filename",
                "original_path",
                "label",
                "output_path",
                "labelled_at",
            ]
            with open(csv_path, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(new_rows)
