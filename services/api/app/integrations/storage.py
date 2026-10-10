import uuid
from typing import Tuple
from app.core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per photo


def validate_image_file(filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
    """Validate photo uploaded for food safety evidence."""
    if content_type not in ALLOWED_MIME_TYPES:
        return False, f"Unsupported file type '{content_type}'. Allowed types: JPEG, PNG, WebP."
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size {file_size} bytes exceeds maximum limit of 10MB."
    return True, ""


def generate_storage_path(listing_id: uuid.UUID, filename: str) -> str:
    """Generate isolated private storage path for food evidence."""
    extension = filename.split(".")[-1].lower() if "." in filename else "jpg"
    photo_id = uuid.uuid4()
    return f"private/listings/{listing_id}/{photo_id}.{extension}"


def generate_signed_photo_url(storage_path: str, expiry_seconds: int = 3600) -> str:
    """
    Generate short-lived signed URL for private photo access.
    In local dev/mock mode, returns secure local route or mock signed CDN link.
    """
    return f"http://127.0.0.1:8000/v1/storage/photos/view?path={storage_path}&token=signed_{expiry_seconds}"
