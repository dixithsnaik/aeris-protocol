from models.health import ping_db


def get_health():
    return {"service": "aeris", "db": ping_db()}, 200
