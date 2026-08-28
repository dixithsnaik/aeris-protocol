import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

_lock = threading.Lock()
_GENESIS = "0" * 64


def _secret():
    return os.environ.get("CHAIN_SECRET", "dev-chain-key")


def _path():
    raw = os.environ.get("CHAIN_LEDGER", "").strip()
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent / "data" / "chain.jsonl"


def _load(path):
    if not path.exists():
        return []
    blocks = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            blocks.append(json.loads(line))
    return blocks


def _digest(prev, payload, ts):
    raw = json.dumps({"prev": prev, "payload": payload, "ts": ts}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(f"{raw}|{_secret()}".encode()).hexdigest()


def _token(digest):
    return f"aer1{digest[:32]}"


def trust_of(block, height):
    confirmations = max(0, height - 1 - int(block["index"]))
    score = 40
    if block.get("payload", {}).get("lawyer"):
        score += 35
    score += min(25, confirmations * 5)
    return min(100, score)


def trust_label(score):
    if score >= 80:
        return "confirmed"
    if score >= 50:
        return "sealed"
    if score > 0:
        return "anchored"
    return "none"


def snapshot(block, chain):
    height = len(chain)
    score = trust_of(block, height)
    return {
        "token": block["token"],
        "hash": f"0x{block['hash']}",
        "height": int(block["index"]) + 1,
        "confirmations": max(0, height - 1 - int(block["index"])),
        "property_id": int(block["payload"]["property_id"]),
        "trust": score,
        "label": trust_label(score),
    }


def mint(property_id, title):
    pid = int(property_id)
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        chain = _load(path)
        for block in chain:
            if int(block["payload"]["property_id"]) == pid:
                return snapshot(block, chain)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        prev = chain[-1]["hash"] if chain else _GENESIS
        payload = {"property_id": pid, "title": str(title or "")[:120], "lawyer": True}
        digest = _digest(prev, payload, ts)
        block = {
            "index": len(chain),
            "ts": ts,
            "prev": prev,
            "payload": payload,
            "hash": digest,
            "token": _token(digest),
        }
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(block) + "\n")
        chain.append(block)
        return snapshot(block, chain)


def lookup(token):
    raw = str(token or "").strip()
    if not raw:
        return None
    path = _path()
    with _lock:
        chain = _load(path)
        for block in chain:
            if block["token"] == raw:
                return snapshot(block, chain)
    return None
