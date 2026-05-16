# 🥭 Mango Label Tool

Công cụ gán nhãn ảnh xoài công nghiệp thủ công (Manual Image Annotation Tool).

**Không sử dụng AI, ML, hay bất kỳ nhận diện tự động nào.**

## Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: FastAPI, Python 3.10+
- **Giao tiếp**: REST API
- **Lưu trữ**: Filesystem local + JSON/CSV metadata

---

## Cài đặt & Chạy

### 1. Backend (FastAPI)

```bash
cd backend

# Tạo virtual environment
python -m venv .venv

# Kích hoạt (macOS/Linux)
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

# Cài dependencies
pip install -r requirements.txt

# Chạy server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: http://localhost:8000  
API docs: http://localhost:8000/docs

### 2. Frontend (Next.js)

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

---

## Cách sử dụng

1. Mở trình duyệt tại `http://localhost:3000`
2. Nhập **đường dẫn thư mục ảnh đầu vào** (chứa ảnh xoài cần gán nhãn)
3. Nhập **đường dẫn thư mục output** (nơi lưu dataset sau khi gán nhãn)
4. Nhấn **"Bắt đầu gán nhãn"**
5. Ứng dụng hiển thị từng ảnh — chọn nhãn bằng cách:
   - **Click** vào nút nhãn
   - **Bấm phím tắt 1-6**
6. Ảnh tự động chuyển sang ảnh tiếp theo chưa gán nhãn

---

## Phím tắt

| Phím | Chức năng |
|------|-----------|
| `1` | Hỏng |
| `2` | Có thuốc kích thích |
| `3` | Xanh ương |
| `4` | Xanh cứng đậm |
| `5` | Chín vàng |
| `6` | Chín đốm sắp hỏng |
| `←` | Ảnh trước |
| `→` | Ảnh tiếp theo |
| `Space` | Bỏ qua |

---

## Cấu trúc Dataset Output

```
output_dataset/
  hong/
    image_001.jpg
  co_thuoc_kich_thich/
    image_002.jpg
  xanh_uong/
    image_003.jpg
  xanh_cung_dam/
    image_004.jpg
  chin_vang/
    image_005.jpg
  chin_dom_sap_hong/
    image_006.jpg
  labels.csv           # Metadata dạng CSV
  labels.json          # Metadata dạng JSON
  progress.json        # Tiến độ gán nhãn
```

## Format Metadata

### labels.csv
```csv
image_id,original_filename,original_path,label,output_path,labelled_at
```

### labels.json
```json
[
  {
    "image_id": "...",
    "original_filename": "...",
    "original_path": "...",
    "label": "chin_vang",
    "output_path": "...",
    "labelled_at": "2026-05-15T10:30:00"
  }
]
```

---

## Định dạng ảnh hỗ trợ

`.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`

---

## Chính sách gán lại nhãn

Nếu gán nhãn lại một ảnh đã có nhãn:
- Metadata (CSV, JSON) được **cập nhật** với nhãn mới
- Ảnh được **copy lại** vào folder nhãn mới
- Ảnh cũ trong folder nhãn cũ **được giữ nguyên** (không xóa)
- Ảnh gốc trong `input_dir` **không bao giờ bị xóa hay chỉnh sửa**

---

## API Endpoints

| Method | Path | Chức năng |
|--------|------|-----------|
| `POST` | `/api/dataset/load` | Load dataset |
| `GET` | `/api/dataset/status` | Trạng thái dataset |
| `GET` | `/api/images/current` | Ảnh hiện tại |
| `GET` | `/api/images/file/{id}` | Binary của ảnh |
| `POST` | `/api/images/{id}/label` | Gán nhãn |
| `POST` | `/api/images/next` | Ảnh tiếp theo |
| `POST` | `/api/images/previous` | Ảnh trước |
| `POST` | `/api/images/skip` | Bỏ qua |
| `POST` | `/api/images/goto-unlabelled` | Đến ảnh chưa nhãn |
| `POST` | `/api/images/upload` | Upload ảnh |
| `GET` | `/api/labels` | Danh sách nhãn |

---

## Cấu trúc Project

```
mango-labeling-tool/
  frontend/
    app/
      page.tsx              # Trang chính
      layout.tsx
      globals.css
    components/
      ui/                   # shadcn/ui components
      SetupPanel.tsx        # Form nhập đường dẫn
      Sidebar.tsx           # Thông tin & tiến độ
      ImageViewer.tsx       # Hiển thị ảnh + paste/drop
      LabelPanel.tsx        # 6 nút nhãn
      NavigationBar.tsx     # Prev/Next/Skip
      ToastNotification.tsx # Thông báo
    lib/
      api.ts                # API client
      utils.ts
    types/
      index.ts              # TypeScript types

  backend/
    app/
      main.py               # FastAPI app
      routers/
        dataset.py          # /api/dataset/*
        images.py           # /api/images/*
        labels.py           # /api/labels
      services/
        dataset_service.py  # Logic chính
        file_service.py     # Xử lý file
        metadata_service.py # CSV/JSON
      models/
        schemas.py          # Pydantic models
      core/
        config.py           # App state
        labels.py           # 6 nhãn constants
    requirements.txt
```
# .labeling
