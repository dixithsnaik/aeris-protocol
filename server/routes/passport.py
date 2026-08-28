from flask import Blueprint, request

from views.passport import parse_passport_bytes, verify_passport, verify_token

bp = Blueprint("passport", __name__)


@bp.post("/verify")
def verify_route():
    body = request.get_json(silent=True)
    if isinstance(body, dict) and str(body.get("token") or "").strip():
        return verify_token(body.get("token"))
    raw = b""
    upload = request.files.get("file") if request.files else None
    if upload:
        raw = upload.read()
    if not raw:
        raw = request.get_data(cache=False) or b""
    text = raw.strip()
    if text.startswith(b"aer1") and b"\n" not in text and b"{" not in text:
        return verify_token(text.decode("utf-8", errors="ignore"))
    return verify_passport(parse_passport_bytes(raw))
