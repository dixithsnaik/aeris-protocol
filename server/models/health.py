from db import fetch_one


def ping_db():
    try:
        row = fetch_one("SELECT 1 AS ok")
        return bool(row and row.get("ok") == 1)
    except Exception:
        return False
