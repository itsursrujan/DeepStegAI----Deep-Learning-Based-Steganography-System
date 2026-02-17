import unittest
import os
import sys
from PIL import Image
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from crypto_utils import aes_encrypt, aes_decrypt
from stego_engine import embed_payload_into_image, extract_payload_from_image, MAGIC

class TestPipelines(unittest.TestCase):
    def setUp(self):
        self.cover_path = "test_integ_cover.png"
        img = np.zeros((150, 150, 3), dtype=np.uint8)
        # Gradient pattern
        for i in range(150):
            img[:, i] = i
        Image.fromarray(img).save(self.cover_path)
        self.password = "IntegPass"

    def tearDown(self):
        if os.path.exists(self.cover_path):
            os.remove(self.cover_path)

    def test_full_pipeline_encrypted_text(self):
        # 1. Encrypt
        secret_text = "Integration Test Pipeline Full Flow"
        original_bytes = secret_text.encode()
        encrypted, _ = aes_encrypt(original_bytes, self.password)
        
        # 2. Package
        header = MAGIC + bytes([1]) + len(encrypted).to_bytes(4, 'big')
        full_payload = header + encrypted
        
        # 3. Embed
        cover_img = Image.open(self.cover_path).convert("RGB")
        stego_img = embed_payload_into_image(cover_img, full_payload)
        
        # 4. Extract
        mode, extracted_payload, _ = extract_payload_from_image(stego_img)
        
        # 5. Decrypt
        decrypted = aes_decrypt(extracted_payload, self.password)
        
        self.assertEqual(decrypted, original_bytes)

if __name__ == '__main__':
    unittest.main()
