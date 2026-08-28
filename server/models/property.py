from pathlib import Path
from random import Random

from db import IntegrityError, execute, executemany, fetch_all, fetch_one
from location import expand_location_query

_REMOTE = (
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
)

_AREAS = (
    ("Central Business District", "CBD, District 1"),
    ("West End Quarter", "West End Quarter"),
    ("Industrial Park", "Industrial Park, Sector 4"),
    ("Bandra Kurla Complex", "BKC, Mumbai"),
    ("Whitefield", "Whitefield, Bengaluru"),
    ("Cyber City", "Cyber City, Gurugram"),
    ("HITEC City", "HITEC, Hyderabad"),
    ("SG Highway", "SG Highway, Ahmedabad"),
    ("Salt Lake", "Sector V, Kolkata"),
    ("Anna Salai", "Anna Salai, Chennai"),
    ("Koregaon Park", "Koregaon Park, Pune"),
    ("Gomti Nagar", "Gomti Nagar, Lucknow"),
    ("Connaught Place", "CP, New Delhi"),
    ("Noida Expressway", "Sector 62, Noida"),
)

_STEMS = (
    "Apex", "Meridian", "Horizon", "Atlas", "Citrine", "Northgate", "Quay",
    "Pinnacle", "Zenith", "Summit", "Keystone", "Lumen", "Vantage", "Harbor",
    "Atrium", "Spire", "Crest", "Oakwood", "Ironclad", "Vertex", "Cascade",
    "Nimbus", "Solstice", "Aether", "Granite", "Copper", "Ember", "Silk",
)
_KINDS = ("Building", "Tower", "Plaza", "Hub", "Pavilion", "Park", "Centre", "Works")
_CONFIGS = ("Commercial Tower", "Warehouse", "Retail", "Office Park", "Mixed Use")


def _where(q, max_budget, configs, verified):
    clauses = []
    params = []
    if q:
        ident = q.strip().upper().removeprefix("P-")
        likes = []
        for term in expand_location_query(q):
            safe = term.replace("%", "").replace("_", "")
            if not safe:
                continue
            like = f"%{safe}%"
            likes.append("(title LIKE %s OR location LIKE %s OR area_name LIKE %s)")
            params.extend([like, like, like])
        if ident.isdigit():
            likes.append("id = %s")
            params.append(int(ident))
        if likes:
            clauses.append("(" + " OR ".join(likes) + ")")
    if max_budget is not None:
        clauses.append("price <= %s")
        params.append(max_budget)
    if configs:
        placeholders = ", ".join(["%s"] * len(configs))
        clauses.append(f"config IN ({placeholders})")
        params.extend(configs)
    if verified:
        clauses.append("verified = 1")
    sql = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    return sql, params


def search_properties(q, max_budget, configs, verified, offset, limit):
    where, params = _where(q, max_budget, configs, verified)
    sql = (
        "SELECT id, title, location, config, price, area_sqft, status, yield_pct, "
        "verified, verify_pending, featured, image_url FROM properties"
        f"{where} ORDER BY id ASC LIMIT %s OFFSET %s"
    )
    return fetch_all(sql, (*params, limit, offset))


def count_properties(q, max_budget, configs, verified):
    where, params = _where(q, max_budget, configs, verified)
    row = fetch_one(f"SELECT COUNT(*) AS n FROM properties{where}", params)
    return int(row["n"]) if row else 0


def fetch_property(pid):
    return fetch_one(
        "SELECT id, title, location, config, price, area_sqft, status, yield_pct, "
        "yoy_pct, verified, verify_pending, featured, image_url, owner_id, chain_token FROM properties WHERE id = %s",
        (pid,),
    )


def list_owned(owner_id):
    return fetch_all(
        "SELECT p.id, p.title, p.location, p.config, p.price, p.area_sqft, p.status, p.yield_pct, "
        "p.yoy_pct, p.verified, p.verify_pending, p.featured, p.image_url, "
        "(SELECT COUNT(*) FROM interests i WHERE i.property_id = p.id AND i.user_id <> p.owner_id) AS watchers, "
        "(SELECT COUNT(DISTINCT m.buyer_id) FROM messages m WHERE m.property_id = p.id AND m.buyer_id <> p.owner_id) AS chats "
        "FROM properties p WHERE p.owner_id = %s ORDER BY p.id DESC",
        (owner_id,),
    )


def count_watchers(pid, owner_id):
    row = fetch_one(
        "SELECT COUNT(*) AS n FROM interests WHERE property_id = %s AND user_id <> %s",
        (pid, owner_id),
    )
    return int(row["n"]) if row else 0


def insert_listing(owner_id, title, location, config, price, area_sqft, image_url):
    return execute(
        "INSERT INTO properties (title, location, area_name, config, price, area_sqft, "
        "status, yield_pct, yoy_pct, verified, featured, image_url, owner_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            title, location, location, config, price, area_sqft,
            "Pre-Lease", 5.0, 8.0, 0, 0, image_url, owner_id,
        ),
    )


def update_listing(pid, title, location, config, price, area_sqft):
    execute(
        "UPDATE properties SET title = %s, location = %s, area_name = %s, config = %s, "
        "price = %s, area_sqft = %s WHERE id = %s",
        (title, location, location, config, price, area_sqft, pid),
    )


def mark_verify_pending(pid):
    execute("UPDATE properties SET verify_pending = 1 WHERE id = %s AND verified = 0", (pid,))


def mark_verified(pid):
    execute("UPDATE properties SET verified = 1, verify_pending = 0 WHERE id = %s", (pid,))


def set_chain_token(pid, token):
    execute("UPDATE properties SET chain_token = %s WHERE id = %s", (token, pid))


def delete_listing(pid):
    execute("DELETE FROM messages WHERE property_id = %s", (pid,))
    execute("DELETE FROM interests WHERE property_id = %s", (pid,))
    execute("DELETE FROM properties WHERE id = %s", (pid,))


def list_interested(user_id):
    return fetch_all(
        "SELECT p.id, p.title, p.location, p.config, p.price, p.area_sqft, p.status, "
        "p.yield_pct, p.yoy_pct, p.verified, p.verify_pending, p.featured, p.image_url "
        "FROM properties p INNER JOIN interests i ON i.property_id = p.id "
        "WHERE i.user_id = %s ORDER BY i.id DESC",
        (user_id,),
    )


def add_interest(user_id, pid):
    try:
        execute("INSERT INTO interests (user_id, property_id) VALUES (%s, %s)", (user_id, pid))
        return True
    except IntegrityError:
        return False


def remove_interest(user_id, pid):
    execute("DELETE FROM interests WHERE user_id = %s AND property_id = %s", (user_id, pid))


def set_offer(user_id, pid, amount):
    execute(
        "UPDATE interests SET offer_inr = %s WHERE user_id = %s AND property_id = %s",
        (amount, user_id, pid),
    )


def list_watchers(pid, owner_id):
    return fetch_all(
        "SELECT u.id, u.name, u.phone, u.email, i.offer_inr, i.created_at "
        "FROM interests i INNER JOIN users u ON u.id = i.user_id "
        "WHERE i.property_id = %s AND i.user_id <> %s ORDER BY i.id DESC",
        (pid, owner_id),
    )


def list_thread_summaries(pid, owner_id):
    return fetch_all(
        "SELECT m.buyer_id AS id, u.name, u.phone, u.email, COUNT(*) AS n, MAX(m.created_at) AS last_at "
        "FROM messages m INNER JOIN users u ON u.id = m.buyer_id "
        "WHERE m.property_id = %s AND m.buyer_id <> %s "
        "GROUP BY m.buyer_id, u.name, u.phone, u.email ORDER BY last_at DESC",
        (pid, owner_id),
    )


def list_messages(pid, buyer_id):
    return fetch_all(
        "SELECT id, sender_id, body, created_at FROM messages "
        "WHERE property_id = %s AND buyer_id = %s ORDER BY id ASC",
        (pid, buyer_id),
    )


def insert_message(pid, buyer_id, sender_id, body):
    return execute(
        "INSERT INTO messages (property_id, buyer_id, sender_id, body) VALUES (%s, %s, %s, %s)",
        (pid, buyer_id, sender_id, body),
    )


def stats_properties(q, max_budget, configs, verified):
    where, params = _where(q, max_budget, configs, verified)
    return fetch_one(
        "SELECT AVG(yield_pct) AS avg_cap, AVG(yoy_pct) AS yoy, "
        "100 * AVG(status = 'Vacant') AS vacancy FROM properties" + where,
        params,
    )


def _local_images():
    folder = Path(__file__).resolve().parent.parent / "static" / "properties"
    if not folder.exists():
        return []
    return [
        f"/static/properties/{path.name}"
        for path in sorted(folder.iterdir())
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    ]


def _image(index, local):
    named = {
        0: "/static/properties/apex.png",
        1: "/static/properties/warehouse.png",
        2: "/static/properties/retail.png",
    }
    if index in named and (Path(__file__).resolve().parent.parent / named[index].lstrip("/")).exists():
        return named[index]
    if index % 6 == 5:
        return _REMOTE[index % len(_REMOTE)]
    if local:
        return local[index % len(local)]
    return _REMOTE[index % len(_REMOTE)]


def _seed_rows():
    rng = Random(42)
    local = _local_images()
    titles = ["The Apex Building", "Logistics Hub B", "Retail Pavilion"]
    for stem in _STEMS:
        for kind in _KINDS:
            title = f"{stem} {kind}"
            if title not in titles:
                titles.append(title)
            if len(titles) >= 80:
                break
        if len(titles) >= 80:
            break
    rows = []
    for i, title in enumerate(titles[:80]):
        area_name, location = _AREAS[i % len(_AREAS)]
        if i == 0:
            config, price, area, status, yld, yoy, verified, featured = (
                "Commercial Tower", 12_450_000, 45_000, "Active Lease", 5.2, 12.4, 1, 1,
            )
            location, area_name = "CBD, District 1", "Central Business District"
        elif i == 1:
            config, price, area, status, yld, yoy, verified, featured = (
                "Warehouse", 3_200_000, 120_000, "Active Lease", 6.1, 8.2, 0, 0,
            )
            location, area_name = "Industrial Park, Sector 4", "Industrial Park"
        elif i == 2:
            config, price, area, status, yld, yoy, verified, featured = (
                "Retail", 8_950_000, 22_500, "Active Lease", 4.9, 11.0, 1, 0,
            )
            location, area_name = "West End Quarter", "West End Quarter"
        else:
            config = _CONFIGS[i % len(_CONFIGS)]
            price = rng.randint(28, 480) * 100_000
            area = rng.choice((8_500, 12_000, 18_000, 22_500, 36_000, 45_000, 72_000, 120_000))
            status = "Vacant" if rng.random() < 0.03 else rng.choice(("Active Lease", "Under Offer", "Pre-Lease"))
            yld = round(rng.uniform(3.6, 7.8), 1)
            yoy = round(rng.uniform(4.2, 14.2), 1)
            verified = 1 if rng.random() < 0.42 else 0
            featured = 1 if i % 17 == 0 else 0
        rows.append(
            (
                title, location, area_name, config, price, area, status, yld, yoy,
                verified, featured, _image(i, local),
            )
        )
    return rows


def seed_if_empty():
    row = fetch_one("SELECT COUNT(*) AS n FROM properties")
    if row and int(row["n"]) >= 60:
        return
    execute("TRUNCATE TABLE properties")
    executemany(
        "INSERT INTO properties (title, location, area_name, config, price, area_sqft, "
        "status, yield_pct, yoy_pct, verified, featured, image_url) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        _seed_rows(),
    )
