import unittest
import os
import sys
import numpy as np
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from adaptive_engine import embed_file_adaptive, extract_file_adaptive

class TestAdaptive(unittest.TestCase):
    def setUp(self):
        self.cover_path = "test_adaptive_cover.png"
        # Create image with high variance/edges for adaptive embedding
        np.random.seed(42)
        img = np.random.randint(0, 256, (200, 200, 3), dtype=np.uint8)
        Image.fromarray(img).save(self.cover_path)
        self.password = "AdaptivePass"

    def tearDown(self):
        if os.path.exists(self.cover_path):
            os.remove(self.cover_path)
        if os.path.exists("test_secret.txt"):
            os.remove("test_secret.txt")

    def test_adaptive_embed_extract(self):
        secret_content = b"Adaptive Edge Secret Data"
        secret_file = "test_secret.txt"
        with open(secret_file, "wb") as f:
            f.write(secret_content)
            
        cover_img = Image.open(self.cover_path).convert("RGB")
        stego_img = embed_file_adaptive(cover_img, secret_content, secret_file, self.password)
        
        filename, extracted_bytes, _ = extract_file_adaptive(stego_img, self.password)
        
        self.assertEqual(filename, secret_file)
        self.assertEqual(extracted_bytes, secret_content)

if __name__ == '__main__':
    unittest.main()
