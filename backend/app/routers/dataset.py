"""
Router cho các API liên quan đến dataset.
"""

from fastapi import APIRouter, HTTPException
import platform
import shutil
import subprocess

from ..models.schemas import LoadDatasetRequest, LoadDatasetResponse, DatasetStatus
from ..services import dataset_service

router = APIRouter(prefix="/api/dataset", tags=["dataset"])


@router.post("/load", response_model=LoadDatasetResponse)
async def load_dataset(request: LoadDatasetRequest):
    """
    Load dataset từ input_dir và khởi tạo output_dir.
    Nếu đã có progress.json, resume từ tiến độ cũ.
    """
    try:
        result = dataset_service.load_dataset(request.input_dir, request.output_dir)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi load dataset: {str(e)}")


@router.get("/status", response_model=DatasetStatus)
async def get_dataset_status():
    """Trả về trạng thái tổng quan của dataset (tổng số, đã nhãn, còn lại)."""
    return dataset_service.get_dataset_status()


@router.get("/browse")
async def browse_directory():
    """Mở hộp thoại chọn thư mục trên máy đang chạy backend và trả về đường dẫn."""
    try:
        system = platform.system()

        commands: list[list[str]] = []
        if system == "Darwin" and shutil.which("osascript"):
            script = '''
            tell application "Finder"
                activate
                set folderPath to POSIX path of (choose folder with prompt "Chọn thư mục ảnh")
            end tell
            return folderPath
            '''
            commands.append(["osascript", "-e", script])
        elif system == "Linux":
            if shutil.which("zenity"):
                commands.append(["zenity", "--file-selection", "--directory", "--title=Chọn thư mục ảnh"])
            if shutil.which("kdialog"):
                commands.append(["kdialog", "--getexistingdirectory", ".", "Chọn thư mục ảnh"])

        for command in commands:
            result = subprocess.run(command, capture_output=True, text=True, timeout=120)
            if result.returncode == 0 and result.stdout.strip():
                return {"path": result.stdout.strip()}

        try:
            import tkinter as tk
            from tkinter import filedialog

            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            path = filedialog.askdirectory(title="Chọn thư mục ảnh")
            root.destroy()
            return {"path": path or ""}
        except Exception:
            return {"path": ""}

        return {"path": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/labeled/{label_key}")
async def get_labeled_images_by_category(label_key: str):
    """Trả về danh sách ảnh đã gán cho một nhãn cụ thể."""
    images = dataset_service.get_labeled_images(label_key)
    return {"images": images}
