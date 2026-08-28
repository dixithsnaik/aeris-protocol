from location import expand_location_query, suggest_locations
from log import logger
from views.verify import (
    catalog,
    check_razorpay_signature,
    create_razorpay_order,
    issue_checkout,
    parse_checkout,
    quote,
    razorpay_keys,
)
from views.chain import inspect_token, mint_signoff
from views.notification import listing_path, notify
from models.notification import delete_for_property
from models.property import (
    add_interest,
    count_properties,
    count_watchers,
    delete_listing,
    fetch_property,
    insert_listing,
    insert_message,
    list_interested,
    list_messages,
    list_owned,
    list_thread_summaries,
    list_watchers,
    mark_verified,
    mark_verify_pending,
    remove_interest,
    search_properties,
    set_chain_token,
    stats_properties,
    update_listing,
)
from pathlib import Path
from rapidfuzz import fuzz, utils
from uuid import uuid4

CONFIGS = frozenset({"Commercial Tower", "Warehouse", "Retail", "Office Park", "Mixed Use"})
_LISTINGS = Path(__file__).resolve().parent.parent / "static" / "listings"
_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
_MAX_IMAGE = 50 * 1024 * 1024
_FALLBACK_IMAGE = "/static/properties/office.jpg"


def _relevance(terms, row):
    hay = f"{row['title']} {row['location']}"
    return max(fuzz.WRatio(term, hay, processor=utils.default_process) for term in terms)


def _item(row):
    out = {
        "id": row["id"],
        "title": row["title"],
        "location": row["location"],
        "config": row["config"],
        "price": int(row["price"]),
        "area_sqft": int(row["area_sqft"]),
        "status": row["status"],
        "yield_pct": float(row["yield_pct"]),
        "verified": bool(row["verified"]),
        "verify_pending": bool(row.get("verify_pending")),
        "featured": bool(row["featured"]),
        "image_url": row["image_url"],
        "chain_token": str(row["chain_token"] or "") if row.get("chain_token") else "",
    }
    if row.get("yoy_pct") is not None:
        out["yoy_pct"] = float(row["yoy_pct"])
    return out


def _num(raw, default=None):
    if raw in (None, ""):
        return default
    try:
        return int(str(raw).replace(",", "").replace("₹", "").strip())
    except (TypeError, ValueError):
        return None


def list_properties(q, max_budget, config, verified, offset, limit):
    q = (q or "").strip()
    start = _num(offset, 0)
    page = _num(limit, 12)
    if start is None or start < 0 or page is None or page < 1:
        return {"error": "invalid pagination"}, 400
    page = min(page, 24)
    budget = None
    if max_budget not in (None, ""):
        budget = _num(max_budget)
        if budget is None or budget < 0:
            return {"error": "invalid budget"}, 400
    cfg = []
    raw = config if isinstance(config, (list, tuple)) else [config]
    for item in raw:
        for part in str(item or "").split(","):
            name = part.strip()
            if not name:
                continue
            if name not in CONFIGS:
                return {"error": "unknown configuration"}, 400
            if name not in cfg:
                cfg.append(name)
    only_verified = str(verified or "").lower() in {"1", "true", "yes"}
    try:
        total = count_properties(q, budget, cfg, only_verified)
        if q:
            # ponytail: ranks at most 100 matches in Python; SQL ORDER BY score if the table grows
            matched = search_properties(q, budget, cfg, only_verified, 0, 100)
            terms = expand_location_query(q) or [q]
            matched.sort(key=lambda row: _relevance(terms, row), reverse=True)
            rows = matched[start : start + page]
            total = min(total, len(matched))
        else:
            rows = search_properties(q, budget, cfg, only_verified, start, page)
        raw_stats = stats_properties(q, budget, cfg, only_verified) or {}
    except Exception:
        logger.exception("property list failed")
        return {"error": "cannot connect to mysql"}, 503
    return {
        "items": [_item(row) for row in rows],
        "total": total,
        "has_more": start + len(rows) < total,
        "analytics": {
            "avg_cap_rate": round(float(raw_stats.get("avg_cap") or 0), 1),
            "vacancy_rate": round(float(raw_stats.get("vacancy") or 0), 1),
            "yoy_growth": round(float(raw_stats.get("yoy") or 0), 1),
        },
    }, 200


def get_property(pid, user_id=None):
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("property fetch failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    return _public_item(row, user_id), 200


def _public_item(row, user_id=None):
    from views.passport import _root, _seals

    item = _item(row)
    item["seal_root"] = _root(_seals(row))
    owned = bool(user_id and row.get("owner_id") is not None and int(row["owner_id"]) == int(user_id))
    item["owned"] = owned
    if owned:
        try:
            item["watchers"] = count_watchers(row["id"], user_id)
        except Exception:
            item["watchers"] = 0
    return item


def _owned_row(user_id, pid):
    n = _num(pid)
    if n is None or n < 1:
        return None, ({"error": "not found"}, 404)
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("property owner fetch failed")
        return None, ({"error": "cannot connect to mysql"}, 503)
    if not row:
        return None, ({"error": "not found"}, 404)
    owner = row.get("owner_id")
    if owner is None or int(owner) != int(user_id):
        return None, ({"error": "forbidden"}, 403)
    return row, None


def _listing_fields(form):
    title = (form.get("title") or "").strip()
    location = (form.get("location") or "").strip()
    config = (form.get("config") or "").strip()
    price = _num(form.get("price"))
    area = _num(form.get("area_sqft"))
    if not title or len(title) > 120:
        return None, ({"error": "enter a property title"}, 400)
    if not location or len(location) > 160:
        return None, ({"error": "enter a location"}, 400)
    if config not in CONFIGS:
        return None, ({"error": "unknown configuration"}, 400)
    if price is None or price < 1:
        return None, ({"error": "enter a list price"}, 400)
    if area is None or area < 1:
        return None, ({"error": "enter carpet area"}, 400)
    return {"title": title, "location": location, "config": config, "price": price, "area": area}, None


def update_owned(user_id, pid, form):
    fields, err = _listing_fields(form)
    if err:
        return err
    row, err = _owned_row(user_id, pid)
    if err:
        return err
    try:
        update_listing(row["id"], fields["title"], fields["location"], fields["config"], fields["price"], fields["area"])
        row = fetch_property(row["id"])
    except Exception:
        logger.exception("listing update failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    return _public_item(row, user_id), 200


def _open_verify(user_id, pid):
    row, err = _owned_row(user_id, pid)
    if err:
        return None, err
    if row["verified"] or row.get("verify_pending"):
        return None, ({"error": "already verifying"}, 409)
    return row, None


def get_verify_catalog(user_id, pid):
    row, err = _open_verify(user_id, pid)
    if err:
        return err
    return catalog(), 200


def start_verify(user_id, pid, package_id):
    row, err = _open_verify(user_id, pid)
    if err:
        return err
    pack = quote(str(package_id or ""))
    if not pack:
        return {"error": "unknown package"}, 400
    key, _secret = razorpay_keys()
    rzp = None
    if key:
        try:
            rzp = create_razorpay_order(pack["amount_paise"], f"v{row['id']}-{pack['id']}")
        except Exception:
            logger.exception("razorpay order failed")
            return {"error": "checkout unavailable"}, 503
    token = issue_checkout(user_id, row["id"], pack, rzp)
    return {
        "package_id": pack["id"],
        "price": pack["price"],
        "fee": pack["fee"],
        "total": pack["total"],
        "amount_paise": pack["amount_paise"],
        "checkout_id": token,
        "order_id": rzp or "",
        "key_id": key,
    }, 200


def complete_verify(user_id, pid, body):
    row, err = _open_verify(user_id, pid)
    if err:
        return err
    body = body or {}
    pack, ticket_err = parse_checkout(body.get("checkout_id"), user_id, row["id"], body.get("package_id"))
    if ticket_err:
        return ticket_err
    _key, secret = razorpay_keys()
    if pack.get("rzp"):
        order_id = str(body.get("razorpay_order_id") or "")
        payment_id = str(body.get("razorpay_payment_id") or "")
        if order_id != pack["rzp"] or not check_razorpay_signature(
            order_id, payment_id, body.get("razorpay_signature"), secret
        ):
            return {"error": "payment rejected"}, 400
    try:
        mark_verify_pending(row["id"])
        row = fetch_property(row["id"])
    except Exception:
        logger.exception("verify subscribe failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    notify(
        user_id,
        "verify",
        "Verification pending",
        f"{row['title']} is with legal review.",
        listing_path(row["id"]),
        row["id"],
    )
    return _public_item(row, user_id), 200


def approve_verify(user_id, pid):
    row, err = _owned_row(user_id, pid)
    if err:
        return err
    issued = None
    token = ""
    fresh = not row["verified"]
    try:
        # ponytail: lawyer portal stamps this; owner overview uses the same route until a portal exists
        if fresh:
            if not row.get("verify_pending"):
                return {"error": "pay for verification first"}, 400
            mark_verified(row["id"])
            row = fetch_property(row["id"])
        else:
            row = fetch_property(row["id"])
        issued = mint_signoff(row["id"], row["title"])
        token = (issued or {}).get("token") or ""
        if token:
            set_chain_token(row["id"], token)
            row = fetch_property(row["id"])
        if fresh:
            extra = f" Block token: {token}" if token else ""
            notify(
                row.get("owner_id") or user_id,
                "verify",
                "Listing verified",
                f"{row['title']} is now verified on the ledger.{extra}",
                listing_path(row["id"]),
                row["id"],
            )
    except Exception:
        logger.exception("verify approve failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    item = _public_item(row, user_id)
    if token:
        item["issued_token"] = token
    return item, 200


def _chain_payload(pid, found):
    if not found or int(found.get("property_id") or 0) != int(pid):
        return {"error": "token does not match this listing"}, 400
    return {
        "token": found["token"],
        "hash": found["hash"],
        "height": found["height"],
        "confirmations": found["confirmations"],
        "trust": found["trust"],
        "label": found["label"],
    }, 200


def listing_chain(pid):
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("chain listing failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    token = str(row.get("chain_token") or "")
    if not token:
        return {"token": "", "trust": 0, "label": "none"}, 200
    found = inspect_token(token)
    if not found:
        return {"token": token, "trust": 0, "label": "none", "error": "chain unreachable"}, 200
    body, status = _chain_payload(n, found)
    if status != 200:
        return {"token": token, "trust": 0, "label": "none"}, 200
    return body, 200


def check_chain(pid, token):
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("chain check failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    found = inspect_token(token)
    if not found:
        return {"error": "unknown token"}, 404
    return _chain_payload(n, found)


def attach_chain(user_id, pid, token):
    row, err = _owned_row(user_id, pid)
    if err:
        return err
    found = inspect_token(token)
    if not found:
        return {"error": "unknown token"}, 404
    body, status = _chain_payload(row["id"], found)
    if status != 200:
        return body, status
    try:
        set_chain_token(row["id"], found["token"])
        row = fetch_property(row["id"])
    except Exception:
        logger.exception("chain attach failed")
        return {"error": "cannot connect to mysql"}, 503
    item = _public_item(row, user_id)
    item.update(body)
    return item, 200


def delete_owned(user_id, pid):
    row, err = _owned_row(user_id, pid)
    if err:
        return err
    try:
        delete_for_property(row["id"])
        delete_listing(row["id"])
    except Exception:
        logger.exception("listing delete failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"ok": True}, 200


def _contact(row, tracking=False, messages=0, last_at=None):
    offer = row.get("offer_inr")
    return {
        "id": int(row["id"]),
        "name": (row.get("name") or "").strip(),
        "phone": row.get("phone") or "",
        "email": (row.get("email") or "").strip(),
        "tracking": tracking,
        "messages": int(messages or 0),
        "offer": int(offer) if offer else 0,
        "last_at": str(last_at) if last_at else "",
    }


def listing_desk(user_id, pid):
    row, err = _owned_row(user_id, pid)
    if err:
        return err
    try:
        watchers = list_watchers(row["id"], user_id)
        threads = list_thread_summaries(row["id"], user_id)
    except Exception:
        logger.exception("listing desk failed")
        return {"error": "cannot connect to mysql"}, 503
    people = {}
    for item in watchers:
        people[int(item["id"])] = _contact(item, tracking=True)
    for item in threads:
        key = int(item["id"])
        prev = people.get(key) or _contact(item)
        prev["messages"] = int(item["n"] or 0)
        prev["last_at"] = str(item["last_at"]) if item.get("last_at") else ""
        people[key] = prev
    items = sorted(people.values(), key=lambda p: p["last_at"] or p["name"], reverse=True)
    return {"items": items}, 200


def listing_thread(user_id, pid, buyer_id):
    n = _num(pid)
    bid = _num(buyer_id)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    if bid is None or bid < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("thread fetch failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    owner = row.get("owner_id")
    is_owner = owner is not None and int(owner) == int(user_id)
    if not is_owner and int(bid) != int(user_id):
        return {"error": "forbidden"}, 403
    if is_owner and int(bid) == int(user_id):
        return {"error": "forbidden"}, 403
    try:
        rows = list_messages(n, bid)
    except Exception:
        logger.exception("thread list failed")
        return {"error": "cannot connect to mysql"}, 503
    return {
        "items": [
            {
                "id": int(item["id"]),
                "mine": int(item["sender_id"]) == int(user_id),
                "body": item["body"],
                "at": str(item["created_at"]),
            }
            for item in rows
        ]
    }, 200


def send_message(user_id, pid, body, buyer_id=None):
    text = (body or "").strip()
    if not text or len(text) > 2000:
        return {"error": "enter a message"}, 400
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("message send failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    owner = row.get("owner_id")
    is_owner = owner is not None and int(owner) == int(user_id)
    if is_owner:
        bid = _num(buyer_id)
        if bid is None or bid < 1 or bid == int(user_id):
            return {"error": "pick a buyer"}, 400
    else:
        if owner is not None and int(owner) == int(user_id):
            return {"error": "forbidden"}, 403
        bid = int(user_id)
    try:
        insert_message(n, bid, user_id, text)
        other = bid if is_owner else (int(owner) if owner is not None else None)
        if other and int(other) != int(user_id):
            preview = text if len(text) <= 80 else text[:79] + "…"
            heading = "Seller replied" if is_owner else "Buyer messaged you"
            notify(
                other,
                "message",
                heading,
                f"{preview} · {row['title']}",
                listing_path(n, "message"),
                n,
            )
        rows = list_messages(n, bid)
    except Exception:
        logger.exception("message insert failed")
        return {"error": "cannot connect to mysql"}, 503
    return {
        "items": [
            {
                "id": int(item["id"]),
                "mine": int(item["sender_id"]) == int(user_id),
                "body": item["body"],
                "at": str(item["created_at"]),
            }
            for item in rows
        ]
    }, 200


def listing_status(row):
    if row["verified"]:
        return "verified"
    if row.get("verify_pending"):
        return "pending"
    if row["status"] == "Under Offer":
        return "negotiation"
    return "unverified"


def _seller_item(row):
    item = _item(row)
    item["listing_status"] = listing_status(row)
    item["watchers"] = int(row.get("watchers") or 0)
    item["chats"] = int(row.get("chats") or 0)
    return item


def list_mine(user_id):
    try:
        rows = list_owned(user_id)
    except Exception:
        logger.exception("seller list failed")
        return {"error": "cannot connect to mysql"}, 503
    items = [_seller_item(row) for row in rows]
    watchers = sum(row["watchers"] for row in items)
    chats = sum(row["chats"] for row in items)
    # ponytail: view counts are display-only until a real analytics table exists
    return {
        "items": items,
        "metrics": {
            "views": 1200 * len(items) + 208,
            "views_delta": 12.4,
            "offers": watchers,
            "chats": chats,
            "insight": (
                "A buyer tracked or messaged a listing. Open Interest & chats to reply."
                if watchers or chats
                else "When a buyer tracks or messages, the bell lights up and they appear on that listing."
            ),
        },
    }, 200


def list_watch(user_id):
    try:
        rows = list_interested(user_id)
    except Exception:
        logger.exception("interest list failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"items": [_seller_item(row) for row in rows]}, 200


def watch_add(user_id, pid):
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
        if not row:
            return {"error": "not found"}, 404
        added = add_interest(user_id, n)
        owner = row.get("owner_id")
        if added and owner is not None and int(owner) != int(user_id):
            notify(
                owner,
                "interest",
                "Buyer tracking your listing",
                f"{row['title']} — open Interest & chats to reply.",
                listing_path(n, "message"),
                n,
            )
    except Exception:
        logger.exception("interest add failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"ok": True}, 200


def watch_remove(user_id, pid):
    n = _num(pid)
    if n is None or n < 1:
        return {"error": "not found"}, 404
    try:
        remove_interest(user_id, n)
    except Exception:
        logger.exception("interest remove failed")
        return {"error": "cannot connect to mysql"}, 503
    return {"ok": True}, 200


def _save_images(files):
    saved = []
    _LISTINGS.mkdir(parents=True, exist_ok=True)
    for file in files[:6]:
        name = (getattr(file, "filename", None) or "").lower()
        ext = Path(name).suffix
        if ext not in _EXTS:
            continue
        raw = file.read()
        if not raw or len(raw) > _MAX_IMAGE:
            continue
        dest = f"{uuid4().hex}{ext}"
        (_LISTINGS / dest).write_bytes(raw)
        saved.append(f"/static/listings/{dest}")
    return saved


def create_listing(user_id, form, files):
    fields, err = _listing_fields(form)
    if err:
        return err
    try:
        images = _save_images(files or [])
        image = images[0] if images else _FALLBACK_IMAGE
        pid = insert_listing(
            user_id, fields["title"], fields["location"], fields["config"], fields["price"], fields["area"], image,
        )
        row = fetch_property(pid)
    except Exception:
        logger.exception("listing create failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    return _seller_item(row), 201


def suggest_places(q):
    return suggest_locations((q or "").strip()), 200
