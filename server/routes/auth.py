from flask import Blueprint, g, request

from views.auth import me, request_otp, update_me, verify_otp

bp = Blueprint("auth", __name__)


@bp.post("/otp")
def otp_route():
    body = request.get_json(silent=True) or {}
    payload, status = request_otp(body.get("phone"))
    return payload, status


@bp.post("/verify")
def verify_route():
    body = request.get_json(silent=True) or {}
    payload, status = verify_otp(body.get("phone"), body.get("otp"))
    return payload, status


@bp.get("/me")
def me_route():
    payload, status = me(g.user_id)
    return payload, status


@bp.patch("/me")
def me_update_route():
    body = request.get_json(silent=True) or {}
    payload, status = update_me(g.user_id, body.get("name"), body.get("email"))
    return payload, status
