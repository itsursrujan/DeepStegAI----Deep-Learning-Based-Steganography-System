import unittest
import os
import sys
import numpy as np
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from stego_engine import embed_payload_into_image, extract_payload_from_image, MAGIC

class TestStegoCore(unittest.TestCase):
    def setUp(self):
        self.cover_path = "test_unit_cover.png"
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        # Add some noise/data
        for i in range(100):
            img[i, :, 0] = i * 2
        Image.fromarray(img).save(self.cover_path)

    def tearDown(self):
        if os.path.exists(self.cover_path):
            os.remove(self.cover_path)

    def test_embed_extract_lsb(self):
        # Raw payload bypassing encryption for unit test of stego engine only
        # Structure: MAGIC + MODE + LENGTH + DATA
        payload_data = b"Unit Test Raw Payload"
        header = MAGIC + bytes([1]) + len(payload_data).to_bytes(4, 'big')
        full_payload = header + payload_data
        
        cover_img = Image.open(self.cover_path).convert("RGB")
        stego_img = embed_payload_into_image(cover_img, full_payload)
        
        mode, extracted_data, _ = extract_payload_from_image(stego_img)
        
        self.assertEqual(extracted_data, payload_data)
        self.assertEqual(mode, 1)

    def test_capacity_check(self):
        # Try to embed too much data
        # Max capacity for 100x100 RGB is 100*100*3 bits = 30,000 bits ~ 3750 bytes
        # Let's try 5000 bytes
        huge_data = b"A" * 5000
        header = MAGIC + bytes([1]) + len(huge_data).to_bytes(4, 'big')
        full_payload = header + huge_data
        
        cover_img = Image.open(self.cover_path).convert("RGB")
        
        with self.assertRaises(ValueError):
             embed_payload_into_image(cover_img, full_payload)

if __name__ == '__main__':
    unittest.main()
