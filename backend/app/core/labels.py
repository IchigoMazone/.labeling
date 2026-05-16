"""
Định nghĩa 6 nhãn phân loại xoài công nghiệp.
"""

from typing import List
from ..models.schemas import LabelInfo

VALID_LABELS = [
    "hong",
    "co_thuoc_kich_thich",
    "xanh_uong",
    "xanh_cung_dam",
    "chin_vang",
    "chin_dom_sap_hong",
]

LABEL_DISPLAY_NAMES = {
    "hong": "Hỏng",
    "co_thuoc_kich_thich": "Có thuốc kích thích",
    "xanh_uong": "Xanh ương",
    "xanh_cung_dam": "Xanh cứng đậm",
    "chin_vang": "Chín vàng",
    "chin_dom_sap_hong": "Chín đốm sắp hỏng",
}

LABEL_SHORTCUTS = {
    "hong": "1",
    "co_thuoc_kich_thich": "2",
    "xanh_uong": "3",
    "xanh_cung_dam": "4",
    "chin_vang": "5",
    "chin_dom_sap_hong": "6",
}


def get_label_list() -> List[LabelInfo]:
    """Trả về danh sách tất cả nhãn dưới dạng LabelInfo."""
    return [
        LabelInfo(key=key, name=LABEL_DISPLAY_NAMES[key], shortcut=LABEL_SHORTCUTS[key])
        for key in VALID_LABELS
    ]


def is_valid_label(label: str) -> bool:
    """Kiểm tra nhãn có hợp lệ không."""
    return label in VALID_LABELS
