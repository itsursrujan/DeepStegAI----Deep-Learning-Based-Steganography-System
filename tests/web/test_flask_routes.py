import unittest
import os
import sys
import tempfile

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../web_app')))
# Assuming app.py is in web_app/
try:
    from app import app as flask_app
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

class TestFlaskRoutes(unittest.TestCase):
    def setUp(self):
        if FLASK_AVAILABLE:
            self.app = flask_app.test_client()
            self.app.testing = True

    def test_home_page(self):
        if not FLASK_AVAILABLE:
            print("Flask app not found or import failed, skipping web test.")
            return
            
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        # Check for some expected content
        self.assertIn(b"DeepStegAI", response.data)

if __name__ == '__main__':
    unittest.main()
