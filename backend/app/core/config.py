"""
Cấu hình ứng dụng và trạng thái in-memory.
Vì không dùng database, state được giữ trong memory.
"""

from typing import Optional, List
from ..models.schemas import ImageRecord


class AppState:
    """
    Trạng thái ứng dụng toàn cục (in-memory).
    Được khởi tạo khi load dataset.
    """

    def __init__(self):
        self.input_dir: Optional[str] = None
        self.output_dir: Optional[str] = None
        self.images: List[ImageRecord] = []
        self.current_index: int = 0
        self.is_loaded: bool = False

    def reset(self):
        """Xóa state hiện tại."""
        self.input_dir = None
        self.output_dir = None
        self.images = []
        self.current_index = 0
        self.is_loaded = False

    @property
    def total(self) -> int:
        return len(self.images)

    @property
    def labelled_count(self) -> int:
        return sum(1 for img in self.images if img.label is not None)

    @property
    def remaining_count(self) -> int:
        return self.total - self.labelled_count

    def get_current_image(self) -> Optional["ImageRecord"]:
        if not self.images or self.current_index >= len(self.images):
            return None
        return self.images[self.current_index]

    def find_next_unlabelled(self) -> Optional[int]:
        """Tìm index ảnh tiếp theo chưa gán nhãn (bắt đầu từ current_index + 1)."""
        start = self.current_index + 1
        for i in range(start, len(self.images)):
            if self.images[i].label is None:
                return i
        # Tìm từ đầu nếu không có ở cuối
        for i in range(0, self.current_index):
            if self.images[i].label is None:
                return i
        return None


# Singleton state instance
app_state = AppState()
