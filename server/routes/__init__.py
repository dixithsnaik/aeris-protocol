from routes.auth import bp as auth_bp
from routes.health import bp as health_bp
from routes.notification import bp as notification_bp
from routes.property import bp as property_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(notification_bp, url_prefix="/notifications")
    app.register_blueprint(property_bp, url_prefix="/properties")
