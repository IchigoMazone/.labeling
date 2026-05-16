"""
Router cho các API liên quan đến nhãn.
"""

from fastapi import APIRouter
from typing import List

from ..models.schemas import LabelInfo
from ..core.labels import get_label_list

router = APIRouter(prefix="/api/labels", tags=["labels"])


@router.get("", response_model=List[LabelInfo])
async def get_labels():
    """Trả về danh sách tất cả 6 nhãn phân loại xoài."""
    return get_label_list()
