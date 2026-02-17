import unittest
import os
import sys
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

class TestSmoke(unittest.TestCase):
    def test_imports(self):
        # Smoke test to ensure all modules are importable without error
        try:
            import stego_engine
            import adaptive_engine
            import crypto_utils
            import detection_engine
            import app_streamlit
        except ImportError as e:
            self.fail(f"Smoke test failed: Could not import core modules. {e}")

    def test_files_exist(self):
        # Check if critical files exist
        required_files = ["requirements.txt", "stego_engine.py", "adaptive_engine.py"]
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
        for f in required_files:
            self.assertTrue(os.path.exists(os.path.join(root, f)), f"Critical file missing: {f}")

if __name__ == '__main__':
    unittest.main()
