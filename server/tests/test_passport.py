import unittest

from flask import Flask

from views.passport import issue_from_row, verify_passport


def _app():
    app = Flask(__name__)
    app.config["JWT_SECRET"] = "test-passport-hmac-secret-key!!"
    return app


def _row():
    return {
        "id": 999991,
        "title": "Home 4BHK",
        "location": "Bengaluru",
        "config": "Retail",
        "price": 1_200_000,
        "area_sqft": 2400,
        "verified": 1,
        "chain_token": "",
    }


class PassportTests(unittest.TestCase):
    def test_tamper_is_forged_and_file_has_no_documents(self):
        app = _app()
        with app.app_context():
            pack = issue_from_row(_row())
            blob = str(pack)
            self.assertNotIn("Holdings", blob)
            for seal in pack["seals"]:
                self.assertEqual(set(seal), {"id", "label", "hash"})
            body, status = verify_passport(pack)
            self.assertEqual(status, 200)
            self.assertEqual(body["verdict"], "unanchored")
            pack["price"] = 9
            body, status = verify_passport(pack)
            self.assertEqual(body["verdict"], "forged")
            self.assertEqual(body["seals"], [])

    def test_pdf_certificate_roundtrip(self):
        from views.passport import parse_passport_bytes, render_pdf

        app = _app()
        with app.app_context():
            pack = issue_from_row(_row())
            pdf = render_pdf(pack)
            self.assertTrue(pdf.startswith(b"%PDF-1.4"))
            self.assertIn(b"/Title", pdf)
            self.assertIn(b"PROPERTY PASSPORT", pdf)
            self.assertIn(b"Audit Checklist", pdf)
            self.assertIn(b"Home 4BHK", pdf)
            self.assertNotIn(b"Holdings", pdf)
            extracted = parse_passport_bytes(pdf)
            body, status = verify_passport(extracted)
            self.assertEqual(status, 200)
            self.assertEqual(body["verdict"], "unanchored")
            self.assertEqual(body["code"], "P-999991")

    def test_token_unknown_is_forged(self):
        from unittest.mock import patch

        from views.passport import verify_token

        with patch("views.passport.inspect_token", return_value=None):
            body, status = verify_token("aer1dead")
        self.assertEqual(status, 200)
        self.assertEqual(body["verdict"], "forged")

    def test_token_on_chain_is_authentic(self):
        from unittest.mock import patch

        from views.passport import verify_token

        found = {
            "token": "aer1abc",
            "property_id": 999991,
            "hash": "0xdead",
            "trust": 75,
            "label": "sealed",
        }
        app = _app()
        with app.app_context():
            pack = issue_from_row(_row())
            with (
                patch("views.passport.inspect_token", return_value=found),
                patch("views.passport.fetch_property", return_value=_row()),
            ):
                body, status = verify_token("aer1abc")
        self.assertEqual(status, 200)
        self.assertEqual(body["verdict"], "authentic")
        self.assertEqual(body["code"], "P-999991")
        self.assertEqual(body["chain_token"], "aer1abc")
        self.assertEqual(body["root"], pack["root"])

    def test_seal_root_verifies_listing(self):
        from unittest.mock import patch

        from views.passport import verify_token

        app = _app()
        with app.app_context():
            pack = issue_from_row(_row())
            with (
                patch("views.passport.search_properties", return_value=[_row()]),
                patch("views.passport.fetch_property", return_value=_row()),
            ):
                body, status = verify_token(pack["root"])
        self.assertEqual(status, 200)
        self.assertEqual(body["verdict"], "authentic")
        self.assertEqual(body["code"], "P-999991")
        self.assertEqual(body["root"], pack["root"])


if __name__ == "__main__":
    unittest.main()
