from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app


def issue_token(user_id):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=current_app.config["JWT_EXPIRES_SECONDS"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
