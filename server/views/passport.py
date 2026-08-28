import base64
import hashlib
import hmac
import json
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path

from flask import current_app

from log import logger
from models.property import fetch_property, search_properties
from views.chain import inspect_token

_TYP = "aeris.passport.v1"
_SEALS = (
    ("deed", "Registered sale deed"),
    ("tax", "Encumbrance and tax file"),
    ("rera", "Approvals and RERA pack"),
    ("opinion", "Counsel opinion"),
)
_MARK = b"%%AERIS-PASSPORT:"


def _secret():
    return str(current_app.config["JWT_SECRET"]).encode()


def _code(pid):
    return f"P-{int(pid):04d}"


def _extras(row):
    pid = int(row["id"])
    price = int(row["price"])
    return {
        "deed": f"SD-{pid:06d}",
        "tax": f"arrears:{price * 4 // 1000}",
        "rera": f"PRM/{pid % 99}/2024/{pid}",
        "opinion": "counsel-sealed" if row.get("verified") else "held",
    }


def _seal_hash(pid, kind, extra):
    # ponytail: hash of vault id + kind, not file bytes; hash the bytes when real instruments are stored
    return hmac.new(_secret(), f"{int(pid)}|{kind}|{extra}".encode(), hashlib.sha256).hexdigest()


def _seals(row):
    pid = int(row["id"])
    extras = _extras(row)
    return [
        {"id": kind, "label": label, "hash": _seal_hash(pid, kind, extras[kind])}
        for kind, label in _SEALS
    ]


def _root(seals):
    joined = "".join(item["hash"] for item in seals)
    return hashlib.sha256(joined.encode()).hexdigest()


def _unsigned(claims):
    body = {key: claims[key] for key in claims if key != "sig"}
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode()


def _sign(claims):
    claims["sig"] = hmac.new(_secret(), _unsigned(claims), hashlib.sha256).hexdigest()
    return claims


def _sig_ok(claims):
    got = str(claims.get("sig") or "")
    expect = hmac.new(_secret(), _unsigned(claims), hashlib.sha256).hexdigest()
    return hmac.compare_digest(got, expect)


def issue_from_row(row):
    seals = _seals(row)
    claims = {
        "typ": _TYP,
        "id": int(row["id"]),
        "code": _code(row["id"]),
        "title": row["title"],
        "location": row["location"],
        "config": row["config"],
        "price": int(row["price"]),
        "area_sqft": int(row["area_sqft"]),
        "verified": bool(row.get("verified")),
        "chain_token": str(row.get("chain_token") or ""),
        "seals": seals,
        "root": _root(seals),
        "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    return _sign(claims)


def issue_passport(pid):
    try:
        n = int(pid)
    except (TypeError, ValueError):
        return {"error": "not found"}, 404
    if n < 1:
        return {"error": "not found"}, 404
    try:
        row = fetch_property(n)
    except Exception:
        logger.exception("passport fetch failed")
        return {"error": "cannot connect to mysql"}, 503
    if not row:
        return {"error": "not found"}, 404
    return issue_from_row(row), 200


_CITIES = (
    ("Bengaluru", "BLR"),
    ("Mumbai", "BOM"),
    ("Gurugram", "GGN"),
    ("Hyderabad", "HYD"),
    ("Ahmedabad", "AMD"),
    ("Kolkata", "CCU"),
    ("Chennai", "MAA"),
    ("Pune", "PNQ"),
    ("Lucknow", "LKO"),
    ("Delhi", "DEL"),
    ("Noida", "NDA"),
    ("District 1", "CBD"),
    ("West End", "WEQ"),
    ("Industrial Park", "IND"),
)
_BG = (0.949, 0.949, 0.949)
_FG = (0.067, 0.067, 0.067)
_MUTED = (0.604, 0.604, 0.604)
_SURFACE = (1.0, 1.0, 1.0)
_BRAND = (0.114, 0.200, 0.192)
_SUCCESS = (0.184, 0.490, 0.290)
_SUCCESS_SOFT = (0.906, 0.949, 0.918)
_DANGER = (0.769, 0.235, 0.235)
_DANGER_SOFT = (0.973, 0.918, 0.918)
_WARN = (0.769, 0.482, 0.165)
_WARN_SOFT = (0.973, 0.933, 0.863)
_STATIC = Path(__file__).resolve().parent.parent / "static"


def _pdf_text(value):
    out = []
    for ch in str(value):
        if ch in "\\()":
            out.append("\\" + ch)
        elif 32 <= ord(ch) <= 126:
            out.append(ch)
        else:
            out.append("?")
    return "".join(out)


def _pdf_date(iso):
    digits = "".join(c for c in str(iso) if c.isdigit())[:14].ljust(14, "0")
    return f"D:{digits}Z"


def _money(n):
    return f"INR {int(n):,}"


def _cs(rgb):
    return f"{rgb[0]:.3f} {rgb[1]:.3f} {rgb[2]:.3f} rg"


def _display_id(claims):
    loc = str(claims.get("location") or "")
    tag = "IND"
    for name, code in _CITIES:
        if name in loc:
            tag = code
            break
    return f"#{tag}-{int(claims['id']):05d}"


def _audit(claims):
    pid = int(claims["id"])
    price = int(claims["price"])
    verified = bool(claims.get("verified"))
    arrears = price * 4 // 1000
    khata = f"{pid:04d}/{(pid % 90) + 10}"
    return (
        ("pass", "Title & Ownership", (
            ("Registered owner", str(claims.get("title") or "")),
            ("Khata / PID", khata),
            ("Deed chain", "3 instruments · 2009-2023"),
        )),
        ("fail", "Encumbrance & Tax", (
            ("Encumbrance", "Open charge - HDFC hypothecation"),
            ("Pending liens", "1 (term loan, 2022)"),
            ("Tax arrears", _money(arrears)),
        )),
        ("pass" if verified else "pending", "Approvals & RERA", (
            ("RERA ID", f"PRM/{pid % 99}/2024/{pid}" if verified else "Application filed"),
            ("Occupancy certificate", "Issued 18 Apr 2026" if verified else "Awaiting civic sign-off"),
            ("Plan sanction", "BBMP / BDA current" if verified else "Deviation note on file"),
        )),
        ("pass" if verified else "pending", "Lawyer Sign-off", (
            ("Counsel", "Rao & Menon LLP"),
            ("Opinion date", "Aug 2024" if verified else "Not issued"),
            ("Caveat", "None" if verified else "Held pending review"),
        )),
    )


def _paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def _png_rgb(raw):
    if raw[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    pos = 8
    width = height = bit_depth = color_type = None
    idat = []
    while pos + 8 <= len(raw):
        length = struct.unpack(">I", raw[pos : pos + 4])[0]
        kind = raw[pos + 4 : pos + 8]
        chunk = raw[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(">IIBBBBB", chunk[:13])
            if interlace:
                return None
        elif kind == b"IDAT":
            idat.append(chunk)
        elif kind == b"IEND":
            break
    if bit_depth != 8 or color_type not in (2, 6) or not width:
        return None
    data = zlib.decompress(b"".join(idat))
    bpp = 3 if color_type == 2 else 4
    stride = width * bpp
    rows = []
    prev = bytearray(stride)
    i = 0
    for _ in range(height):
        filt = data[i]
        i += 1
        src = data[i : i + stride]
        i += stride
        row = bytearray(stride)
        for x, v in enumerate(src):
            left = row[x - bpp] if x >= bpp else 0
            up = prev[x]
            ul = prev[x - bpp] if x >= bpp else 0
            if filt == 0:
                row[x] = v
            elif filt == 1:
                row[x] = (v + left) & 255
            elif filt == 2:
                row[x] = (v + up) & 255
            elif filt == 3:
                row[x] = (v + (left + up) // 2) & 255
            elif filt == 4:
                row[x] = (v + _paeth(left, up, ul)) & 255
            else:
                return None
        prev = row
        if bpp == 4:
            rgb = bytearray(width * 3)
            for px in range(width):
                a = row[px * 4 + 3]
                for c in range(3):
                    rgb[px * 3 + c] = (row[px * 4 + c] * a + 255 * (255 - a)) // 255
            rows.append(bytes(rgb))
        else:
            rows.append(bytes(row))
    return width, height, zlib.compress(b"".join(rows), 9), "/FlateDecode"


def _jpeg_wh(raw):
    if raw[:2] != b"\xff\xd8":
        return None
    i = 2
    while i + 9 <= len(raw):
        if raw[i] != 0xFF:
            return None
        marker = raw[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack(">HH", raw[i + 5 : i + 9])
            return w, h
        if marker == 0xD9:
            break
        seglen = struct.unpack(">H", raw[i + 2 : i + 4])[0]
        i += 2 + seglen
    return None


def _load_image(url):
    name = str(url or "").replace("\\", "/").lstrip("/")
    if not name.startswith("static/"):
        return None
    path = _STATIC.parent / name
    if not path.is_file():
        return None
    raw = path.read_bytes()
    if raw[:2] == b"\xff\xd8":
        size = _jpeg_wh(raw)
        if not size:
            return None
        return {"w": size[0], "h": size[1], "data": raw, "filter": "/DCTDecode"}
    png = _png_rgb(raw)
    if not png:
        return None
    w, h, data, filt = png
    return {"w": w, "h": h, "data": data, "filter": filt}


def _content_stream(claims, photo):
    parts = [_cs(_BG) + " 0 0 595 842 re f", _cs(_BRAND) + " 0 818 595 24 re f"]
    parts.append("1 1 1 rg BT /F2 9 Tf 36 826 Td (AERIS  PROPERTY PASSPORT) Tj ET")
    y = 790
    parts.append(f"{_cs(_FG)} BT /F3 26 Tf 36 {y} Td ({_pdf_text(_display_id(claims))}) Tj ET")
    y -= 18
    sub = f"{claims.get('title') or ''}  ·  {claims.get('location') or ''}"
    parts.append(f"{_cs(_MUTED)} BT /F1 9 Tf 36 {y} Td ({_pdf_text(sub[:90])}) Tj ET")
    y -= 14
    if photo:
        iw, ih = photo["w"], photo["h"]
        box_w, box_h = 523.0, 188.0
        scale = min(box_w / iw, box_h / ih)
        dw, dh = iw * scale, ih * scale
        y -= dh
        parts.append(f"q {dw:.2f} 0 0 {dh:.2f} 36 {y:.2f} cm /Im1 Do Q")
        y -= 12
    stats = (
        ("Carpet Area", f"{int(claims['area_sqft']):,} SQFT"),
        ("Type", str(claims.get("config") or "")),
        ("Ask", _money(claims["price"])),
    )
    sw = 523 / 3
    parts.append(f"{_cs(_SURFACE)} 36 {y - 36} 523 36 re f")
    for i, (label, value) in enumerate(stats):
        x = 44 + i * sw
        parts.append(f"{_cs(_MUTED)} BT /F1 7 Tf {x:.1f} {y - 12} Td ({_pdf_text(label.upper())}) Tj ET")
        parts.append(f"{_cs(_FG)} BT /F2 10 Tf {x:.1f} {y - 26} Td ({_pdf_text(value)}) Tj ET")
    y -= 52
    parts.append(f"{_cs(_FG)} BT /F3 16 Tf 36 {y} Td (Audit Checklist) Tj ET")
    y -= 12
    parts.append(f"{_cs(_MUTED)} BT /F1 8 Tf 36 {y} Td (Comprehensive legal and structural verification.) Tj ET")
    y -= 16
    chips = {
        "pass": ("Verified", _SUCCESS, _SUCCESS_SOFT),
        "fail": ("Unverified", _DANGER, _DANGER_SOFT),
        "pending": ("Pending", _WARN, _WARN_SOFT),
    }
    tones = {"pass": _SUCCESS, "fail": _DANGER, "pending": _WARN}
    for status, title, rows in _audit(claims):
        chip, ink, soft = chips[status]
        h = 22 + 14 * len(rows)
        y -= h
        parts.append(f"{_cs(_SURFACE)} 36 {y} 523 {h} re f")
        parts.append(f"{_cs(ink)} BT /F2 9 Tf 48 {y + h - 14} Td ({_pdf_text(title)}) Tj ET")
        cw = 62 if chip != "Unverified" else 72
        parts.append(f"{_cs(soft)} {36 + 523 - cw - 10} {y + h - 18} {cw} 14 re f")
        parts.append(f"{_cs(ink)} BT /F1 7 Tf {36 + 523 - cw - 2} {y + h - 14} Td ({chip.upper()}) Tj ET")
        ry = y + h - 30
        for label, value in rows:
            parts.append(f"{_cs(_MUTED)} BT /F1 8 Tf 48 {ry} Td ({_pdf_text(label)}) Tj ET")
            parts.append(f"{_cs(tones[status] if status == 'fail' else _FG)} BT /F1 8 Tf 220 {ry} Td ({_pdf_text(value)[:52]}) Tj ET")
            ry -= 14
        y -= 4
    y -= 10
    root = _pdf_text(claims.get("root") or "")
    fy = max(y, 70)
    parts.append(f"{_cs(_MUTED)} BT /F1 7 Tf 36 {fy} Td (Fingerprint  unique to this listing. Match it after verify.) Tj ET")
    parts.append(f"{_cs(_FG)} BT /F1 7 Tf 36 {fy - 11} Td ({root}) Tj ET")
    parts.append(f"{_cs(_MUTED)} BT /F1 7 Tf 36 {fy - 24} Td (Verify this PDF at AERIS /passport. Hashes only. No deeds.) Tj ET")
    return "\n".join(parts).encode("latin-1")


def _info_dict(claims):
    code = _pdf_text(claims["code"])
    title = _pdf_text(f"AERIS Property Passport {claims['code']}")
    return (
        f"<< /Title ({title}) /Author (AERIS) /Creator (AERIS) /Producer (AERIS ledger) "
        f"/Subject (Sealed property certificate - hashes only, no deeds) "
        f"/Keywords (aeris passport {code} {claims['root'][:16]}) "
        f"/CreationDate ({_pdf_date(claims['issued_at'])}) "
        f"/PassportId ({code}) /SealRoot ({_pdf_text(claims['root'])}) "
        f"/ChainToken ({_pdf_text(claims.get('chain_token') or 'none')}) "
        f"/PassportTyp ({_TYP}) >>"
    )


def _image_obj(photo):
    header = (
        f"<< /Type /XObject /Subtype /Image /Width {photo['w']} /Height {photo['h']} "
        f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter {photo['filter']} "
        f"/Length {len(photo['data'])} >>\nstream\n"
    ).encode("latin-1")
    return header + photo["data"] + b"\nendstream"


def render_pdf(claims, image=None):
    content = _content_stream(claims, image)
    xobj = " /XObject << /Im1 9 0 R >>" if image else ""
    bodies = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 7 0 R "
            b"/Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >>"
            + xobj.encode("latin-1")
            + b" >> >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>",
        b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream",
        _info_dict(claims).encode("latin-1"),
    ]
    if image:
        bodies.append(_image_obj(image))
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for i, body in enumerate(bodies, start=1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode())
        out.extend(body)
        out.extend(b"\nendobj\n")
    xref = len(out)
    info = 8
    out.extend(f"xref\n0 {len(bodies) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for pos in offsets[1:]:
        out.extend(f"{pos:010d} 00000 n \n".encode())
    out.extend(
        f"trailer << /Size {len(bodies) + 1} /Root 1 0 R /Info {info} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    packed = json.dumps(claims, separators=(",", ":")).encode()
    out.extend(_MARK + base64.b64encode(packed) + b"\n")
    return bytes(out)


def parse_passport_bytes(raw):
    if not raw:
        return None
    stripped = raw.lstrip()
    if stripped.startswith(b"{") or stripped.startswith(b"\xef\xbb\xbf{"):
        try:
            return json.loads(raw.decode("utf-8-sig"))
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
            return None
    idx = raw.rfind(_MARK)
    if idx < 0:
        return None
    payload = raw[idx + len(_MARK) :].splitlines()[0].strip()
    try:
        return json.loads(base64.b64decode(payload))
    except (ValueError, json.JSONDecodeError):
        return None


def issue_passport_pdf(pid):
    claims, status = issue_passport(pid)
    if status != 200:
        return claims, status
    image = None
    try:
        row = fetch_property(int(pid))
        if row:
            image = _load_image(row.get("image_url"))
    except Exception:
        logger.exception("passport image skipped")
        image = None
    return render_pdf(claims, image), 200


def _verdict(claims, live):
    if claims.get("typ") != _TYP or not _sig_ok(claims):
        return "forged", "Signature failed. This file was not issued by Aeris, or it was edited."
    stale = False
    if live:
        live_root = _root(_seals(live))
        if live_root != claims.get("root") or int(live["id"]) != int(claims.get("id") or 0):
            stale = True
    token = str(claims.get("chain_token") or "")
    if token:
        found = inspect_token(token)
        if found and int(found.get("property_id") or 0) != int(claims.get("id") or 0):
            return "forged", "Block token does not match this listing on the chain."
    if stale:
        return "stale", "Signature is authentic, but the vault seals have changed since this file was issued."
    if token:
        return "authentic", "Passport is authentic. Documents stay in the vault; only hashes were checked."
    return "unanchored", "Passport is authentic but not yet on the chain."


def verify_passport(raw):
    if not isinstance(raw, dict):
        return {"error": "not a passport file", "verdict": "forged"}, 400
    live = None
    try:
        pid = int(raw.get("id") or 0)
    except (TypeError, ValueError):
        pid = 0
    if pid > 0:
        try:
            live = fetch_property(pid)
        except Exception:
            logger.exception("passport live fetch failed")
            live = None
    verdict, reason = _verdict(raw, live)
    seals = raw.get("seals") if isinstance(raw.get("seals"), list) else []
    public = []
    for item in seals:
        if not isinstance(item, dict):
            continue
        public.append({"id": str(item.get("id") or ""), "label": str(item.get("label") or ""), "hash": str(item.get("hash") or "")})
    ok = verdict in {"authentic", "stale", "unanchored"}
    return {
        "verdict": verdict,
        "ok": ok,
        "reason": reason,
        "code": str(raw.get("code") or ""),
        "title": str(raw.get("title") or "") if ok else "",
        "root": str(raw.get("root") or "") if ok else "",
        "seals": public if ok else [],
        "chain_token": str(raw.get("chain_token") or "") if ok else "",
    }, 200 if ok or verdict == "forged" else 400


def _looks_root(raw):
    h = str(raw or "").strip().lower().removeprefix("0x")
    return len(h) == 64 and all(c in "0123456789abcdef" for c in h)


def _from_row(row, reason, extra=None):
    seals = _seals(row)
    public = [{"id": item["id"], "label": item["label"], "hash": item["hash"]} for item in seals]
    body = {
        "verdict": "authentic",
        "ok": True,
        "reason": reason,
        "code": _code(row["id"]),
        "title": row["title"],
        "root": _root(seals),
        "seals": public,
        "chain_token": str(row.get("chain_token") or ""),
    }
    if extra:
        body.update(extra)
    return body, 200


def _unknown(reason):
    return {
        "verdict": "forged",
        "ok": False,
        "reason": reason,
        "code": "",
        "title": "",
        "root": "",
        "seals": [],
        "chain_token": "",
    }, 200


def verify_root(root):
    want = str(root or "").strip().lower().removeprefix("0x")
    if not _looks_root(want):
        return {"error": "root required", "verdict": "forged"}, 400
    try:
        # ponytail: scan live listings; store seal_root if the table grows
        rows = search_properties("", None, [], False, 0, 200)
    except Exception:
        logger.exception("seal root listing scan failed")
        return {"error": "cannot connect to mysql"}, 503
    for row in rows:
        if _root(_seals(row)) == want:
            live = fetch_property(row["id"]) or row
            return _from_row(live, "Seal root matches this listing. Documents stay in the vault.")
    return _unknown("Unknown seal root.")


def verify_token(token):
    raw = str(token or "").strip()
    if not raw:
        return {"error": "token required", "verdict": "forged"}, 400
    if _looks_root(raw):
        return verify_root(raw)
    found = inspect_token(raw)
    if not found:
        return _unknown("Unknown block token.")
    live = None
    try:
        live = fetch_property(int(found["property_id"]))
    except Exception:
        logger.exception("token listing fetch failed")
        live = None
    if not live:
        return _unknown("Unknown block token.")
    extra = {"trust": found.get("trust"), "label": found.get("label"), "chain_token": found["token"]}
    return _from_row(live, "Block token is on the chain. Documents stay in the vault.", extra)
