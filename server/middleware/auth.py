import jwt
from flask import current_app, g, request

from log import logger
from tokens import decode_token


def jwt_guard():
    if request.method == "OPTIONS":
        return None
    path = request.path.rstrip("/") or "/"
    if path in current_app.config["PUBLIC_PATHS"]:
        return None
    for prefix in current_app.config.get("PUBLIC_PREFIXES") or ():
        if path == prefix or path.startswith(prefix + "/"):
            return None
    if request.method == "GET" and _public_property_get(path):
        _optional_user()
        return None
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        logger.info("auth missing on %s", path)
        return {"error": "unauthorized"}, 401
    try:
        payload = decode_token(header.removeprefix("Bearer ").strip())
        g.user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        logger.info("auth invalid on %s", path)
        return {"error": "unauthorized"}, 401
    return None


def _optional_user():
    g.user_id = None
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return
    try:
        payload = decode_token(header.removeprefix("Bearer ").strip())
        g.user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        g.user_id = None


def _public_property_get(path):
    if path == "/properties":
        return True
    if path == "/properties/suggest":
        return True
    rest = path.removeprefix("/properties/")
    return rest.isdigit()
