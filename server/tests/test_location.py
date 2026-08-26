import unittest

from location import expand_location_query


class LocationQueryTests(unittest.TestCase):
    def test_bangalore(self):
        terms = {t.lower() for t in expand_location_query("bangalore")}
        self.assertIn("bangalore", terms)
        self.assertIn("bengaluru", terms)

    def test_bombay_in_phrase(self):
        terms = {t.lower() for t in expand_location_query("BKC Bombay")}
        self.assertIn("bkc bombay", terms)
        self.assertIn("bkc mumbai", terms)

    def test_plain_area_unchanged(self):
        terms = {t.lower() for t in expand_location_query("Whitefield")}
        self.assertEqual(terms, {"whitefield"})

    def test_typo_bangalor(self):
        terms = {t.lower() for t in expand_location_query("bangalor")}
        self.assertIn("bangalore", terms)
        self.assertIn("bengaluru", terms)

    def test_typo_mumbay(self):
        terms = {t.lower() for t in expand_location_query("mumbay")}
        self.assertTrue("mumbai" in terms or any("mumbai" in t for t in terms))
        self.assertTrue(any("bombay" in t for t in terms))

    def test_id_not_corrected(self):
        self.assertEqual(expand_location_query("P-12"), ["P-12"])

    def test_suggest_typo(self):
        from location import suggest_locations

        data = suggest_locations("bangalor")
        self.assertTrue(data["corrected"])
        texts = [row["text"].lower() for row in data["suggestions"]]
        self.assertTrue(any("bangalore" in t or "bengaluru" in t for t in texts))


if __name__ == "__main__":
    unittest.main()
