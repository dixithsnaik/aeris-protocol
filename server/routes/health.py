from flask import Blueprint

from views.health import get_health

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    body, status = get_health()
    return body, status
