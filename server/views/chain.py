import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from flask import current_app

from log import logger


def _url():
    return str(current_app.config.get("CHAIN_URL") or "").rstrip("/")


def _secret():
    return str(current_app.config.get("CHAIN_SECRET") or "dev-chain-key")


def _get(path):
    base = _url()
    if not base:
        return None
    req = Request(f"{base}{path}", headers={"Accept": "application/json"}, method="GET")
    try:
        with urlopen(req, timeout=3) as res:
            return json.loads(res.read().decode())
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        logger.exception("chain get failed")
        return None


def _post(path, body):
    base = _url()
    if not base:
        return None
    raw = json.dumps(body).encode()
    req = Request(
        f"{base}{path}",
        data=raw,
        headers={
            "Content-Type": "application/json",
            "X-Chain-Key": _secret(),
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=3) as res:
            return json.loads(res.read().decode())
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        logger.exception("chain mint failed")
        return None


def mint_signoff(pid, title):
    # ponytail: HTTP hash-chain in chain/; swap CHAIN_URL for a public ledger later
    row = _post("/mint", {"property_id": int(pid), "title": title or ""})
    if not row or not row.get("token"):
        return None
    return row


def inspect_token(token):
    raw = str(token or "").strip()
    if not raw:
        return None
    return _get(f"/token/{quote(raw, safe='')}")
