import os
from pathlib import Path

from flask import Flask, request

from ledger import lookup, mint

app = Flask(__name__)


def _load_env():
    for candidate in (
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / "server" / ".env",
    ):
        if not candidate.exists():
            continue
        for line in candidate.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()


def _key_ok():
    expected = os.environ.get("CHAIN_SECRET", "dev-chain-key")
    return request.headers.get("X-Chain-Key", "") == expected


@app.get("/health")
def health():
    return {"service": "aeris-chain"}, 200


@app.post("/mint")
def mint_route():
    if not _key_ok():
        return {"error": "unauthorized"}, 401
    body = request.get_json(silent=True) or {}
    try:
        pid = int(body.get("property_id"))
    except (TypeError, ValueError):
        return {"error": "property_id required"}, 400
    if pid < 1:
        return {"error": "property_id required"}, 400
    return mint(pid, body.get("title")), 200


@app.get("/token/<token>")
def token_route(token):
    row = lookup(token)
    if not row:
        return {"error": "unknown token"}, 404
    return row, 200


if __name__ == "__main__":
    app.run(
        host=os.environ.get("CHAIN_HOST", "127.0.0.1"),
        port=int(os.environ.get("CHAIN_PORT", "5001")),
        debug=os.environ.get("FLASK_DEBUG", "1") == "1",
    )
