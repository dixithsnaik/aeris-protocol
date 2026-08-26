import unittest

from views.property import _relevance, get_property


class PropertyRankTests(unittest.TestCase):
    def test_closer_location_ranks_higher(self):
        terms = ["whitefield"]
        close = {"title": "Whitefield Commons", "location": "Whitefield, Bengaluru"}
        far = {"title": "BKC Tower", "location": "BKC, Mumbai"}
        self.assertGreater(_relevance(terms, close), _relevance(terms, far))

    def test_invalid_id_is_not_found(self):
        body, status = get_property("nope")
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "not found")
        body, status = get_property(0)
        self.assertEqual(status, 404)

    def test_owner_routes_reject_bad_id(self):
        from views.property import complete_verify, delete_owned, start_verify, update_owned

        body, status = update_owned(
            1,
            0,
            {
                "title": "Home",
                "location": "Bengaluru",
                "config": "Retail",
                "price": 100,
                "area_sqft": 1000,
            },
        )
        self.assertEqual(status, 404)
        body, status = start_verify(1, "nope", "verified")
        self.assertEqual(status, 404)
        body, status = complete_verify(1, "nope", {})
        self.assertEqual(status, 404)
        body, status = delete_owned(1, "nope")
        self.assertEqual(status, 404)
        from views.property import listing_desk, send_message

        body, status = listing_desk(1, "nope")
        self.assertEqual(status, 404)
        body, status = send_message(1, "nope", "hello")
        self.assertEqual(status, 404)
        from views.property import approve_verify, watch_add, watch_remove

        body, status = approve_verify(1, "nope")
        self.assertEqual(status, 404)

        body, status = watch_add(1, "nope")
        self.assertEqual(status, 404)
        body, status = watch_add(1, 0)
        self.assertEqual(status, 404)
        body, status = watch_remove(1, None)
        self.assertEqual(status, 404)

    def test_listing_status(self):
        from views.property import listing_status

        self.assertEqual(listing_status({"verified": 1, "status": "Pre-Lease"}), "verified")
        self.assertEqual(listing_status({"verified": 0, "status": "Under Offer"}), "negotiation")
        self.assertEqual(listing_status({"verified": 0, "status": "Pre-Lease"}), "unverified")
        self.assertEqual(listing_status({"verified": 0, "verify_pending": 1, "status": "Pre-Lease"}), "pending")

    def test_profile_rejects_bad_email(self):
        from views.auth import update_me

        body, status = update_me(1, "Ada", "not-an-email")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "enter a valid email")
