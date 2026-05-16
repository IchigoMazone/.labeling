"""
FastAPI main application với CORS cho phép Next.js gọi API.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import dataset, images, labels

app = FastAPI(
    title="Mango Labeling Tool API",
    description="API để gán nhãn dataset ảnh xoài công nghiệp thủ công.",
    version="1.0.0",
)

def _get_allowed_origins() -> list[str]:
    extra_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *extra_origins,
    ]


# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_origin_regex=r"https://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(dataset.router)
app.include_router(images.router)
app.include_router(labels.router)


@app.get("/")
async def root():
    return {
        "message": "Mango Labeling Tool API đang chạy",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
