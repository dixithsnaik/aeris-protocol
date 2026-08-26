import re

from rapidfuzz import fuzz, process, utils

# Official / common Indian city renames, plus listing area tokens we search.
_GROUPS = (
    ("bengaluru", "bangalore"),
    ("mumbai", "bombay"),
    ("chennai", "madras"),
    ("kolkata", "calcutta"),
    ("gurugram", "gurgaon"),
    ("pune", "poona"),
    ("vadodara", "baroda"),
    ("kochi", "cochin"),
    ("mysuru", "mysore"),
    ("prayagraj", "allahabad"),
    ("thiruvananthapuram", "trivandrum"),
    ("puducherry", "pondicherry"),
    ("varanasi", "banaras", "benares"),
    ("shimla", "simla"),
    ("guwahati", "gauhati"),
)

_AREAS = (
    "whitefield", "bandra", "kurla", "hyderabad", "ahmedabad", "lucknow",
    "noida", "delhi", "koregaon", "gomti", "connaught", "hitec",
)

_CANDIDATES = tuple(sorted({name for group in _GROUPS for name in group} | set(_AREAS)))
_CUTOFF = 80


def correct_location_query(q):
    q = (q or "").strip()
    if not q:
        return q
    ident = q.upper().removeprefix("P-")
    if ident.isdigit():
        return q
    parts = re.split(r"(\s+)", q)
    return "".join(_fix_token(part) if part.strip() else part for part in parts)


def _fix_token(token):
    core = token.strip(".,;:")
    if len(core) < 4 or core.isdigit():
        return token
    hit = process.extractOne(
        core,
        _CANDIDATES,
        scorer=fuzz.WRatio,
        processor=utils.default_process,
        score_cutoff=_CUTOFF,
    )
    if not hit:
        return token
    return token.replace(core, hit[0], 1)


def _pretty(name):
    return " ".join(part.capitalize() for part in name.split())


def suggest_locations(q, limit=6):
    q = (q or "").strip()
    if len(q) < 2:
        return {"corrected": "", "suggestions": []}
    ident = q.upper().removeprefix("P-")
    if ident.isdigit():
        return {"corrected": "", "suggestions": []}
    corrected = _pretty(correct_location_query(q))
    hits = process.extract(
        q,
        _CANDIDATES,
        scorer=fuzz.WRatio,
        processor=utils.default_process,
        limit=limit,
        score_cutoff=70,
    )
    seen = set()
    suggestions = []
    same = corrected.lower() == q.lower()
    if not same:
        seen.add(corrected.lower())
        suggestions.append({"text": corrected, "kind": "correct"})
    for name, _score, _idx in hits:
        label = _pretty(name)
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        suggestions.append({"text": label, "kind": "suggest"})
    return {"corrected": "" if same else corrected, "suggestions": suggestions[:limit]}


def expand_location_query(q):
    q = correct_location_query(q)
    if not q:
        return []
    terms = {q}
    for group in _GROUPS:
        if not any(re.search(rf"\b{re.escape(name)}\b", q, flags=re.I) for name in group):
            continue
        for old in group:
            pattern = rf"\b{re.escape(old)}\b"
            if not re.search(pattern, q, flags=re.I):
                continue
            for new in group:
                if new == old:
                    continue
                terms.add(re.sub(pattern, new, q, flags=re.I))
    return list(terms)
