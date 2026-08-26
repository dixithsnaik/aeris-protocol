from db import execute, fetch_all, fetch_one


def listing_for_user(user_id):
    row = fetch_one(
        "SELECT id, title FROM properties WHERE owner_id = %s ORDER BY id DESC LIMIT 1",
        (user_id,),
    )
    return row or fetch_one("SELECT id, title FROM properties ORDER BY id DESC LIMIT 1")


def insert_notification(user_id, kind, title, body, href, property_id=None):
    return execute(
        "INSERT INTO notifications (user_id, kind, title, body, href, property_id) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, kind, title, body, href, property_id),
    )


def list_notifications(user_id, limit=30):
    return fetch_all(
        "SELECT id, kind, title, body, href, read_at, created_at FROM notifications "
        "WHERE user_id = %s ORDER BY id DESC LIMIT %s",
        (user_id, int(limit)),
    )


def count_unread(user_id):
    row = fetch_one(
        "SELECT COUNT(*) AS n FROM notifications WHERE user_id = %s AND read_at IS NULL",
        (user_id,),
    )
    return int(row["n"]) if row else 0


def mark_read(user_id, ids=None):
    if ids:
        placeholders = ", ".join(["%s"] * len(ids))
        execute(
            f"UPDATE notifications SET read_at = CURRENT_TIMESTAMP "
            f"WHERE user_id = %s AND read_at IS NULL AND id IN ({placeholders})",
            (user_id, *ids),
        )
        return
    execute(
        "UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = %s AND read_at IS NULL",
        (user_id,),
    )


def delete_for_property(pid):
    execute("DELETE FROM notifications WHERE property_id = %s", (pid,))
