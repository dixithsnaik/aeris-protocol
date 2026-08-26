import unittest
from datetime import datetime, timedelta, timezone

from flask import Flask
import jwt

from views.verify import catalog, issue_checkout, parse_checkout, quote


def _app():
    app = Flask(__name__)
    app.config["JWT_SECRET"] = "test-verify-secret"
    app.config["RAZORPAY_KEY_ID"] = ""
    app.config["RAZORPAY_KEY_SECRET"] = ""
    return app


class VerifyCheckoutTests(unittest.TestCase):
    def test_quote_comes_from_catalog_not_client_amount(self):
        pack = quote("escrow")
        self.assertEqual(pack["price"], 50_000)
        self.assertEqual(pack["amount_paise"], (50_000 + round(50_000 * 0.029)) * 100)
        self.assertIsNone(quote("cheap"))
        ids = [row["id"] for row in catalog()["packages"]]
        self.assertEqual(ids, ["basic", "verified", "escrow"])

    def test_ticket_rejects_package_swap_and_amount_tamper(self):
        app = _app()
        with app.app_context():
            escrow = quote("escrow")
            token = issue_checkout(7, 42, escrow)
            pack, err = parse_checkout(token, 7, 42, "escrow")
            self.assertIsNone(err)
            self.assertEqual(pack["amount_paise"], escrow["amount_paise"])
            swapped, err = parse_checkout(token, 7, 42, "basic")
            self.assertIsNone(swapped)
            self.assertEqual(err[1], 400)
            data = jwt.decode(token, app.config["JWT_SECRET"], algorithms=["HS256"])
            data["amt"] = 100
            data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=5)
            fake = jwt.encode(data, app.config["JWT_SECRET"], algorithm="HS256")
            pack, err = parse_checkout(fake, 7, 42, "escrow")
            self.assertIsNone(pack)
            self.assertEqual(err[0]["error"], "invalid checkout")
            pack, err = parse_checkout(token, 7, 42, "escrow")
            extra = {"package_id": "escrow", "checkout_id": token, "amount_paise": 1, "total": 1}
            pack, err = parse_checkout(extra["checkout_id"], 7, 42, extra["package_id"])
            self.assertEqual(pack["amount_paise"], escrow["amount_paise"])


if __name__ == "__main__":
    unittest.main()
