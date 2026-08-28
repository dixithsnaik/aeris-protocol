import os
import tempfile
import unittest

os.environ["CHAIN_SECRET"] = "test-chain-secret"
os.environ["CHAIN_LEDGER"] = tempfile.mktemp(suffix=".jsonl")

from ledger import lookup, mint, trust_label


class LedgerTests(unittest.TestCase):
    def test_mint_is_idempotent_and_lookup_matches(self):
        first = mint(81, "Home 4BHK")
        self.assertEqual(trust_label(first["trust"]), "sealed")
        again = mint(81, "Home 4BHK")
        other = mint(82, "Other")
        self.assertEqual(first["token"], again["token"])
        self.assertNotEqual(first["token"], other["token"])
        found = lookup(first["token"])
        self.assertEqual(found["property_id"], 81)
        self.assertGreaterEqual(found["trust"], 70)
        self.assertIn(found["label"], ("sealed", "confirmed"))
        self.assertIsNone(lookup("aer1deadbeef"))


if __name__ == "__main__":
    unittest.main()
