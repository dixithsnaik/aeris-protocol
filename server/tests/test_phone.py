import unittest

from phone import normalize_phone


class PhoneTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(normalize_phone("9876543210"), "9876543210")
        self.assertEqual(normalize_phone("+91 98765 43210"), "9876543210")
        self.assertEqual(normalize_phone("919876543210"), "9876543210")

    def test_invalid(self):
        self.assertIsNone(normalize_phone("1234567890"))
        self.assertIsNone(normalize_phone("98765"))
        self.assertIsNone(normalize_phone(""))


if __name__ == "__main__":
    unittest.main()
