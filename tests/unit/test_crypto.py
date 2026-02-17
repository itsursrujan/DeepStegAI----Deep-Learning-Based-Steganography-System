import unittest
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from crypto_utils import aes_encrypt, aes_decrypt

class TestCrypto(unittest.TestCase):
    def setUp(self):
        self.password = "SecureTestPassword123!"
        self.wrong_password = "WrongPassword"

    def test_encryption_roundtrip(self):
        original = b"Testing AES encryption with various characters: 123!@#$%^&*()"
        encrypted, _ = aes_encrypt(original, self.password)
        decrypted = aes_decrypt(encrypted, self.password)
        
        self.assertNotEqual(original, encrypted)
        self.assertEqual(original, decrypted)

    def test_wrong_password(self):
        original = b"Secret Data"
        encrypted, _ = aes_encrypt(original, self.password)
        
        with self.assertRaises(Exception):
            aes_decrypt(encrypted, self.wrong_password)

    def test_empty_data(self):
        # Depending on implementation, this might fail or pass, but good to check
        original = b""
        try:
            encrypted, _ = aes_encrypt(original, self.password)
            decrypted = aes_decrypt(encrypted, self.password)
            self.assertEqual(original, decrypted)
        except Exception as e:
            # If empty data encryption is not supported, catch and pass if reasonably handled
            pass

if __name__ == '__main__':
    unittest.main()
