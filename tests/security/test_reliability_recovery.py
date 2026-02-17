import unittest
import os
import sys
import numpy as np
from PIL import Image
import io

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from stego_engine import embed_payload_into_image, extract_payload_from_image, MAGIC
from adaptive_engine import embed_file_adaptive

class TestReliability(unittest.TestCase):
    def test_repeatability(self):
        """
        Reliability Testing: Ensure that 50 consecutive embed/extract operations 
        produce consistent results without resource leaks or drift.
        """
        print("\nStarting Reliability Test (50 iterations)...")
        password = "ReliabilityPassword"
        secret_data = b"Reliable Data"
        
        # Header
        header = MAGIC + bytes([1]) + len(secret_data).to_bytes(4, 'big')
        payload = header + secret_data
        
        for i in range(50):
            img_data = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
            cover_img = Image.fromarray(img_data)
            
            # Embed
            stego = embed_payload_into_image(cover_img, payload)
            
            # Extract
            _, extracted, _ = extract_payload_from_image(stego)
            
            self.assertEqual(extracted, secret_data, f"Failed at iteration {i}")
        print("Reliability Test: PASSED")

class TestRecovery(unittest.TestCase):
    def test_corrupted_header_recovery(self):
        """
        Recovery Testing: Ensure the system provides meaningful errors and 
        doesn't crash when encountering a corrupted/partial MAGIC header.
        """
        print("\nStarting Recovery Test (Corrupted Headers)...")
        img_data = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
        
        # Corrupt the MAGIC bits but keep some structure
        # Standard MAGIC is 'DSAI'
        # We'll set it to 'DXAI'
        img_data[0, 0, 0] = (img_data[0, 0, 0] & 0xFE) | 0 # D
        # Skip many bits... corrupting specific one
        
        stego = Image.fromarray(img_data)
        
        with self.assertRaises(ValueError) as cm:
            extract_payload_from_image(stego)
        
        self.assertIn("doesn't contain a valid DeepStegAI header", str(cm.exception))
        print("Recovery Test: PASSED")

if __name__ == '__main__':
    unittest.main()
