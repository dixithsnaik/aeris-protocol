from log import logger
from models.notification import count_unread, insert_notification, list_notifications, mark_read as stamp_read


def notify(user_id, kind, title, body, href, property_id=None):
    if not user_id:
        return
    try:
        insert_notification(
            int(user_id),
            str(kind)[:24],
            str(title)[:160],
            str(body)[:400],
            str(href)[:200],
            int(property_id) if property_id else None,
        )
    except Exception:
        logger.exception("notify failed")


def listing_path(pid, tab="overview"):
    return f"/buy/{int(pid)}/{tab}"


def as_item(row):
    return {
        "id": int(row["id"]),
        "kind": row["kind"],
        "title": row["title"],
        "body": row["body"],
        "href": row["href"],
        "read": bool(row.get("read_at")),
        "at": str(row["created_at"]),
    }


def _ids(raw):
    if not isinstance(raw, list):
        return []
    out = []
    for item in raw[:50]:
        try:
            n = int(item)
        except (TypeError, ValueError):
            continue
        if n > 0:
            out.append(n)
    return out


def list_mine(user_id):
    try:
        rows = list_notifications(user_id)
        unread = count_unread(user_id)
    except Exception:
        logger.exception("notifications list failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"items": [as_item(row) for row in rows], "unread": unread}, 200


def mark_mine(user_id, body):
    ids = _ids((body or {}).get("ids"))
    try:
        stamp_read(user_id, ids or None)
        unread = count_unread(user_id)
    except Exception:
        logger.exception("notifications read failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"ok": True, "unread": unread}, 200
