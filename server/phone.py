import re

_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if _MOBILE.fullmatch(digits):
        return digits
    return None
