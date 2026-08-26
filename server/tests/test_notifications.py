import unittest

from views.notification import _ids, as_item, demo_rows, listing_path


class NotificationViewTests(unittest.TestCase):
    def test_ids_drop_junk_and_cap(self):
        self.assertEqual(_ids(None), [])
        self.assertEqual(_ids(["1", 2, -3, "nope", 0]), [1, 2])
        self.assertEqual(len(_ids(list(range(1, 80)))), 50)

    def test_item_and_path(self):
        row = {
            "id": 9,
            "kind": "message",
            "title": "New message",
            "body": "Hello",
            "href": "/buy/3/message",
            "read_at": None,
            "created_at": "2026-08-26 12:00:00",
        }
        item = as_item(row)
        self.assertFalse(item["read"])
        self.assertEqual(item["id"], 9)
        self.assertEqual(listing_path(3, "message"), "/buy/3/message")
        row["read_at"] = "2026-08-26 12:01:00"
        self.assertTrue(as_item(row)["read"])

    def test_demo_rows_use_listing_not_a_phone(self):
        rows = demo_rows("Whitefield Commons", 81)
        self.assertEqual(len(rows), 4)
        kinds = {row[0] for row in rows}
        self.assertEqual(kinds, {"message", "interest", "verify"})
        for row in rows:
            self.assertIn("/buy/81/", row[3])


if __name__ == "__main__":
    unittest.main()
