import unittest

from views.notification import _ids, as_item, listing_path


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


if __name__ == "__main__":
    unittest.main()
