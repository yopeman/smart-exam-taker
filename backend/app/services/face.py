import base64
import mimetypes

_MAX_FACE_BYTES = 10 * 1024 * 1024

_EXTENSION_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
    "bmp": "image/bmp",
}


def encode_image_data_url(filename: str | None, content: bytes) -> str:
    if len(content) > _MAX_FACE_BYTES:
        raise ValueError("Face image exceeds the 10 MB size limit")

    ext = ""
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()

    mime = _EXTENSION_MIME.get(ext)
    if mime is None:
        mime = (
            mimetypes.guess_type(filename or "")[0]
            if filename
            else "application/octet-stream"
        )
        if not mime or not mime.startswith("image/"):
            mime = "image/jpeg"

    encoded = base64.b64encode(content).decode("ascii")
    return f"data:{mime};base64,{encoded}"
