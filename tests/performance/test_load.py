import unittest
import time
import os
import sys
import numpy as np
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from stego_engine import embed_payload_into_image, MAGIC

class TestLoad(unittest.TestCase):
    def test_large_image_embedding(self):
        print("\nStarting Load Test (2000x2000 image)...")
        
        # Create large image (2k x 2k)
        # Using a fixed seed for reproducibility might be better but random is fine for load
        img_data = np.random.randint(0, 256, (2000, 2000, 3), dtype=np.uint8)
        cover_img = Image.fromarray(img_data)
        
        # Payload: 1 MB
        payload = b"X" * 1024 * 1024 
        header = MAGIC + bytes([1]) + len(payload).to_bytes(4, 'big')
        full_payload = header + payload
        
        start_time = time.time()
        stego_img = embed_payload_into_image(cover_img, full_payload)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"Embedded 1MB into 2000x2000 image in {duration:.4f} seconds.")
        
        # Soft assertion for performance
        if duration > 10.0:
            print("WARNING: Slow performance detected.")
        
        self.assertLess(duration, 30.0, "Embedding took unreasonably long (>30s)")

if __name__ == "__main__":
    unittest.main()
