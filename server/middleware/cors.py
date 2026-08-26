from flask import request


def preflight():
    if request.method == "OPTIONS":
        return ("", 204)
    return None


def apply_cors(response):
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        response.headers["Vary"] = "Origin"
    return response
