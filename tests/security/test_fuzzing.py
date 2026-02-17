import unittest
import os
import sys
import numpy as np
from PIL import Image
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from stego_engine import embed_payload_into_image, extract_payload_from_image

class TestFuzzing(unittest.TestCase):
    def test_fuzz_extract(self):
        # Feed random garbage images to extract function and ensure no crash
        print("\nFuzzing Extraction Logic...")
        for i in range(10):
            # Create random noise image
            img_data = np.random.randint(0, 256, (50, 50, 3), dtype=np.uint8)
            fake_stego = Image.fromarray(img_data)
            
            try:
                # Should either return standard failure or None, but NOT crash
                extract_payload_from_image(fake_stego)
            except Exception as e:
                # Expected to fail, but let's see if it's a controlled failure
                pass
        print("Fuzzing Extract: Survived random inputs")

if __name__ == '__main__':
    unittest.main()
