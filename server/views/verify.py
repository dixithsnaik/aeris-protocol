from datetime import datetime, timedelta, timezone
from hmac import compare_digest
import hashlib
import hmac
import json
from urllib.request import Request, urlopen
from base64 import b64encode

import jwt
from flask import current_app

FEE_RATE = 0.029
PACKAGES = (
    {"id": "basic", "price": 20_000, "recommended": False},
    {"id": "verified", "price": 36_000, "recommended": True},
    {"id": "escrow", "price": 50_000, "recommended": False},
)


def quote(package_id):
    pack = next((row for row in PACKAGES if row["id"] == package_id), None)
    if not pack:
        return None
    fee = round(pack["price"] * FEE_RATE)
    total = pack["price"] + fee
    return {**pack, "fee": fee, "total": total, "amount_paise": total * 100}


def catalog():
    return {
        "fee_rate": FEE_RATE,
        "default": "verified",
        "packages": [quote(row["id"]) for row in PACKAGES],
    }


def issue_checkout(user_id, pid, pack, rzp_order=None):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "pid": int(pid),
        "pkg": pack["id"],
        "amt": pack["amount_paise"],
        "typ": "verify",
        "iat": now,
        "exp": now + timedelta(minutes=20),
    }
    if rzp_order:
        payload["rzp"] = rzp_order
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def parse_checkout(token, user_id, pid, package_id):
    pack = quote(str(package_id or ""))
    if not pack:
        return None, ({"error": "unknown package"}, 400)
    try:
        data = jwt.decode(str(token or ""), current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None, ({"error": "checkout expired"}, 400)
    except Exception:
        return None, ({"error": "invalid checkout"}, 400)
    if data.get("typ") != "verify":
        return None, ({"error": "invalid checkout"}, 400)
    if str(data.get("sub")) != str(user_id) or int(data.get("pid") or 0) != int(pid):
        return None, ({"error": "invalid checkout"}, 400)
    if data.get("pkg") != pack["id"] or int(data.get("amt") or 0) != pack["amount_paise"]:
        return None, ({"error": "invalid checkout"}, 400)
    return {**pack, "rzp": data.get("rzp")}, None


def razorpay_keys():
    key = str(current_app.config.get("RAZORPAY_KEY_ID") or "").strip()
    secret = str(current_app.config.get("RAZORPAY_KEY_SECRET") or "").strip()
    return (key, secret) if key and secret else ("", "")


def create_razorpay_order(amount_paise, receipt):
    key, secret = razorpay_keys()
    if not key:
        return None
    body = json.dumps({"amount": int(amount_paise), "currency": "INR", "receipt": receipt[:40]}).encode()
    auth = b64encode(f"{key}:{secret}".encode()).decode()
    req = Request(
        "https://api.razorpay.com/v1/orders",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Basic {auth}"},
        method="POST",
    )
    with urlopen(req, timeout=15) as res:
        data = json.loads(res.read().decode())
    order_id = data.get("id")
    if not order_id:
        raise RuntimeError("razorpay order missing id")
    return order_id


def check_razorpay_signature(order_id, payment_id, signature, secret):
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    return compare_digest(expected, str(signature or ""))
