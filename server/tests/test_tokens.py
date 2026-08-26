from datetime import datetime, timedelta, timezone
import unittest

import jwt


class TokenTests(unittest.TestCase):
    def test_roundtrip(self):
        secret = "test-secret-must-be-32-bytes-ok"
        now = datetime.now(timezone.utc)
        token = jwt.encode(
            {"sub": "1", "iat": now, "exp": now + timedelta(minutes=5)},
            secret,
            algorithm="HS256",
        )
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        self.assertEqual(payload["sub"], "1")


if __name__ == "__main__":
    unittest.main()
