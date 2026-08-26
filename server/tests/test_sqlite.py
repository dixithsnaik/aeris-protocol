import os
import tempfile
import unittest


class SqliteStoreTests(unittest.TestCase):
    def setUp(self):
        self.prev_engine = os.environ.get("AERIS_DB")
        self.prev_path = os.environ.get("SQLITE_PATH")
        handle = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
        handle.close()
        self.path = handle.name
        os.environ["AERIS_DB"] = "sqlite"
        os.environ["SQLITE_PATH"] = self.path
        import db

        db._reset_pool()

    def tearDown(self):
        import db

        db._reset_pool()
        if self.prev_engine is None:
            os.environ.pop("AERIS_DB", None)
        else:
            os.environ["AERIS_DB"] = self.prev_engine
        if self.prev_path is None:
            os.environ.pop("SQLITE_PATH", None)
        else:
            os.environ["SQLITE_PATH"] = self.prev_path
        for suffix in ("", "-wal", "-shm"):
            try:
                os.unlink(self.path + suffix)
            except OSError:
                pass

    def test_user_and_interest_roundtrip(self):
        from models.property import add_interest, list_watchers, set_offer
        from models.user import get_or_create_user, update_user

        uid = get_or_create_user("9876500999")
        self.assertEqual(get_or_create_user("9876500999"), uid)
        update_user(uid, "Test Buyer", "test@example.com")
        add_interest(uid, 1)
        set_offer(uid, 1, 1_100_000)
        people = list_watchers(1, 99)
        self.assertEqual(len(people), 1)
        self.assertEqual(people[0]["name"], "Test Buyer")
        self.assertEqual(int(people[0]["offer_inr"]), 1_100_000)


if __name__ == "__main__":
    unittest.main()
