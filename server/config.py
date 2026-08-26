import os
from pathlib import Path


def _load_env():
    path = Path(__file__).resolve().parent / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ[key.strip()] = value.strip().strip('"').strip("'")


_load_env()


class Config:
    MYSQL_HOST = os.environ.get("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
    MYSQL_USER = os.environ.get("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "aeris")
    JWT_SECRET = os.environ.get("JWT_SECRET", "dev-insecure-change-me-now-please")
    JWT_EXPIRES_SECONDS = int(os.environ.get("JWT_EXPIRES_SECONDS", "86400"))
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
    PUBLIC_PATHS = frozenset({"/health", "/auth/otp", "/auth/verify"})
    PUBLIC_PREFIXES = ("/static",)
