"""
Router cho các API liên quan đến ảnh.
"""

import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse

from ..models.schemas import (
    LabelRequest,
    ImageResponse,
    LabelImageResponse,
    LabelledImageRecord,
    UploadImageResponse,
)
from ..core.labels import is_valid_label
from ..core.config import app_state
from ..services import dataset_service
from ..services.file_service import (
    copy_image_to_label_folder,
    save_uploaded_image,
    get_image_mime_type,
)
from ..services.metadata_service import update_labels_json, update_labels_csv, save_progress, remove_label_from_metadata

router = APIRouter(prefix="/api/images", tags=["images"])


def _require_loaded():
    """Kiểm tra dataset đã được load chưa."""
    if not app_state.is_loaded:
        raise HTTPException(status_code=400, detail="Dataset chưa được load. Hãy gọi POST /api/dataset/load trước.")


@router.get("/current", response_model=ImageResponse)
async def get_current_image():
    """Trả về thông tin ảnh hiện tại."""
    _require_loaded()
    image = dataset_service.get_current_image()
    if image is None:
        raise HTTPException(status_code=404, detail="Không có ảnh nào trong dataset.")
    return image


@router.get("/file/{image_id}")
async def get_image_file(image_id: str):
    """Trả về binary của ảnh để hiển thị trên frontend."""
    _require_loaded()
    image_record = dataset_service.get_image_by_id(image_id)
    if image_record is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy ảnh với id: {image_id}")

    path = Path(image_record.path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File ảnh không tồn tại: {image_record.path}")

    mime_type = get_image_mime_type(image_record.filename)
    return FileResponse(
        path=str(path),
        media_type=mime_type,
        filename=image_record.filename,
    )


@router.post("/{image_id}/label", response_model=LabelImageResponse)
async def label_image(
    image_id: str, 
    request: LabelRequest,
    advance: bool = Query(True, description="Tự động chuyển sang ảnh tiếp theo")
):
    """
    Gán nhãn cho ảnh.
    - Validate nhãn.
    - Copy ảnh sang output_dir/label/.
    - Cập nhật metadata.
    - Trả về ảnh tiếp theo chưa gán nhãn (nếu advance=True).
    """
    _require_loaded()

    if not is_valid_label(request.label):
        raise HTTPException(
            status_code=400,
            detail=f"Nhãn không hợp lệ: '{request.label}'. Nhãn hợp lệ: {', '.join(['hong', 'co_thuoc_kich_thich', 'xanh_uong', 'xanh_cung_dam', 'chin_vang', 'chin_dom_sap_hong'])}",
        )

    image_record = dataset_service.get_image_by_id(image_id)
    if image_record is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy ảnh: {image_id}")

    # Xoá file cũ nếu đã từng được gán nhãn và đang đổi nhãn khác
    old_output_path = image_record.output_path
    if old_output_path and old_output_path.strip():
        if os.path.exists(old_output_path):
            try:
                os.remove(old_output_path)
            except Exception:
                pass

    # Copy ảnh sang folder nhãn
    try:
        output_path = copy_image_to_label_folder(
            src_path=image_record.path,
            output_dir=app_state.output_dir,
            label=request.label,
            original_filename=image_record.filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi copy ảnh: {str(e)}")

    # Cập nhật state
    for i, img in enumerate(app_state.images):
        if img.id == image_id:
            app_state.images[i].label = request.label
            app_state.images[i].output_path = output_path
            break

    # Tạo record metadata
    labelled_record = LabelledImageRecord(
        image_id=image_id,
        original_filename=image_record.filename,
        original_path=image_record.path,
        label=request.label,
        output_path=output_path,
        labelled_at=datetime.now(),
    )

    # Lưu metadata
    try:
        update_labels_json(app_state.output_dir, labelled_record)
        update_labels_csv(app_state.output_dir, labelled_record)
        save_progress(
            app_state.output_dir,
            app_state.input_dir,
            app_state.current_index,
            app_state.images,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu metadata: {str(e)}")

    # Chuyển sang ảnh tiếp theo chưa nhãn (nếu advance=True)
    if advance:
        next_idx = app_state.find_next_unlabelled()
        if next_idx is not None:
            app_state.current_index = next_idx

    next_image = dataset_service.get_current_image()

    return LabelImageResponse(
        success=True,
        message=f"Đã gán nhãn '{request.label}' cho ảnh '{image_record.filename}'",
        labelled_image=labelled_record,
        next_image=next_image,
    )

@router.post("/{image_id}/unlabel", response_model=ImageResponse)
async def unlabel_image(image_id: str):
    """
    Xoá nhãn của một ảnh.
    - Xoá file vật lý ở thư mục output.
    - Cập nhật metadata (xoá khỏi json/csv).
    - Cập nhật app_state.
    """
    _require_loaded()

    image_record = dataset_service.get_image_by_id(image_id)
    if image_record is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy ảnh: {image_id}")
    
    if not image_record.label:
        return _build_image_response_from_record(image_record)

    # Xoá file cũ
    if image_record.output_path and os.path.exists(image_record.output_path):
        try:
            os.remove(image_record.output_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Không thể xoá file cũ: {str(e)}")

    # Xoá metadata
    remove_label_from_metadata(app_state.output_dir, image_id)

    # Cập nhật app_state
    for i, img in enumerate(app_state.images):
        if img.id == image_id:
            app_state.images[i].label = None
            app_state.images[i].output_path = None
            break
    
    save_progress(
        app_state.output_dir,
        app_state.input_dir,
        app_state.current_index,
        app_state.images,
    )

    return _build_image_response_from_record(image_record)

def _build_image_response_from_record(img) -> ImageResponse:
    # helper for unlabel return
    # Find index
    idx = 0
    for i, r in enumerate(app_state.images):
        if r.id == img.id:
            idx = i
            break
    from ..models.schemas import ImageResponse
    return ImageResponse(
        id=img.id,
        filename=img.filename,
        path=img.path,
        url=f"/api/images/file/{img.id}",
        label=img.label,
        index=idx,
        total=app_state.total,
    )



@router.post("/next", response_model=ImageResponse)
async def navigate_next():
    """Chuyển sang ảnh tiếp theo."""
    _require_loaded()
    image = dataset_service.navigate_next()
    if image is None:
        raise HTTPException(status_code=404, detail="Không có ảnh tiếp theo.")
    return image


@router.post("/previous", response_model=ImageResponse)
async def navigate_previous():
    """Chuyển về ảnh trước."""
    _require_loaded()
    image = dataset_service.navigate_previous()
    if image is None:
        raise HTTPException(status_code=404, detail="Không có ảnh trước đó.")
    return image


@router.post("/skip", response_model=ImageResponse)
async def skip_image():
    """Bỏ qua ảnh hiện tại, chuyển sang ảnh tiếp theo chưa nhãn."""
    _require_loaded()
    image = dataset_service.navigate_skip()
    if image is None:
        raise HTTPException(status_code=404, detail="Không có ảnh nào để chuyển.")
    return image


@router.post("/goto-unlabelled", response_model=ImageResponse)
async def goto_unlabelled():
    """Nhảy đến ảnh chưa gán nhãn đầu tiên."""
    _require_loaded()
    image = dataset_service.navigate_to_unlabelled()
    if image is None:
        raise HTTPException(status_code=404, detail="Tất cả ảnh đã được gán nhãn.")
    return image


@router.post("/upload", response_model=UploadImageResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload ảnh từ frontend (hoặc paste clipboard).
    Lưu vào input_dir hiện tại và thêm vào dataset.
    """
    _require_loaded()

    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ.")

    allowed_ext = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng ảnh không hỗ trợ: {ext}. Hỗ trợ: {', '.join(allowed_ext)}",
        )

    try:
        content = await file.read()
        image_id, saved_path = save_uploaded_image(
            file_content=content,
            filename=file.filename,
            input_dir=app_state.input_dir,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu ảnh: {str(e)}")

    image_response = dataset_service.add_image_to_dataset(
        image_id=image_id,
        filename=Path(saved_path).name,
        path=saved_path,
    )

    return UploadImageResponse(
        success=True,
        message=f"Đã upload ảnh '{file.filename}' thành công.",
        image=image_response,
    )
