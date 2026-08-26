from log import logger
from models.user import get_or_create_user, fetch_user_by_id, update_user
from phone import normalize_phone
from tokens import issue_token
import re

DEV_OTP = "000000"
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def send_otp(phone):
    # SMS provider goes here later. Must stay in sync with DEV_OTP until codes are stored.
    return DEV_OTP


def request_otp(raw_phone):
    phone = normalize_phone(raw_phone)
    if not phone:
        return {"error": "enter a valid 10-digit mobile number"}, 400
    send_otp(phone)
    return {"ok": True}, 200


def verify_otp(raw_phone, otp):
    phone = normalize_phone(raw_phone)
    if not phone:
        return {"error": "enter a valid 10-digit mobile number"}, 400
    if (otp or "").strip() != DEV_OTP:
        return {"error": "invalid otp"}, 401
    try:
        user_id = get_or_create_user(phone)
    except Exception:
        logger.exception("mysql failed during verify")
        return {"error": "cannot connect to mysql"}, 503
    if not user_id:
        return {"error": "database unavailable"}, 503
    return {"token": issue_token(user_id)}, 200


def me(user_id):
    user = fetch_user_by_id(user_id)
    if not user:
        return {"error": "not found"}, 404
    return {
        "id": user["id"],
        "phone": user["phone"],
        "name": user.get("name") or "",
        "email": user.get("email") or "",
    }, 200


def update_me(user_id, name, email):
    name = (name or "").strip()
    email = (email or "").strip()
    if not name or len(name) > 80:
        return {"error": "enter your name"}, 400
    if not email or len(email) > 120 or not _EMAIL.match(email):
        return {"error": "enter a valid email"}, 400
    try:
        update_user(user_id, name, email)
    except Exception:
        logger.exception("mysql failed during profile update")
        return {"error": "cannot connect to mysql"}, 503
    return me(user_id)
