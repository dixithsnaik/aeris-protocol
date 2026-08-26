import os

from flask import Flask

from config import Config
from log import configure_logging, logger
from middleware.auth import jwt_guard
from middleware.cors import apply_cors, preflight
from middleware.request_log import log_request, log_response
from routes import register_routes


def create_app():
    configure_logging()
    app = Flask(__name__)
    app.config.from_object(Config)
    if app.config["JWT_SECRET"] == "dev-insecure-change-me-now-please":
        logger.warning("JWT_SECRET is the insecure default; set it in .env")
    app.before_request(preflight)
    app.before_request(log_request)
    app.before_request(jwt_guard)
    app.after_request(apply_cors)
    app.after_request(log_response)
    register_routes(app)
    try:
        from models.property import seed_if_empty

        seed_if_empty()
    except Exception:
        logger.exception("property seed skipped")
    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.environ.get("FLASK_HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG", "1") == "1",
    )
