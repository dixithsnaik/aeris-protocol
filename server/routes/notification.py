from flask import Blueprint, g, request

from views.notification import list_mine, mark_mine

bp = Blueprint("notifications", __name__)


@bp.get("")
@bp.get("/")
def list_route():
    payload, status = list_mine(g.user_id)
    return payload, status


@bp.post("/read")
def read_route():
    body = request.get_json(silent=True) or {}
    payload, status = mark_mine(g.user_id, body)
    return payload, status
