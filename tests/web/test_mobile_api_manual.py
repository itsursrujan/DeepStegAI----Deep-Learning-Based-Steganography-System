import requests
import base64
import os
import io

def test_mobile_api():
    base_url = "http://127.0.0.1:5000"
    
    # Create dummy image
    from PIL import Image
    dummy_img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    dummy_img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Create dummy secret
    secret_bytes = b"Hello from Mobile!"
    
    print("Testing /api/embed (Mobile Style)...")
    files = {
        'cover': ('cover.png', img_byte_arr, 'image/png'),
        'secret': ('secret.txt', io.BytesIO(secret_bytes), 'text/plain')
    }
    data = {
        'method': 'LSB',
        'password': 'testpassword'
    }
    
    try:
        r = requests.post(f"{base_url}/api/embed", files=files, data=data)
        r.raise_for_status()
        resp = r.json()
        print("Success! JSON Keys:", resp.keys())
        assert resp['success'] is True
        assert 'image_data' in resp
        assert 'recovery_token' in resp
        print("Embed Verification PASSED.")
    except Exception as e:
        print(f"Embed Verification FAILED: {e}")
        return

    # Extract test
    print("\nTesting /api/extract (Mobile Style)...")
    stego_bytes = base64.b64decode(resp['image_data'])
    files = {
        'stego': ('stego.png', io.BytesIO(stego_bytes), 'image/png')
    }
    data = {
        'password': 'testpassword'
    }
    
    try:
        r = requests.post(f"{base_url}/api/extract", files=files, data=data)
        r.raise_for_status()
        if r.content == secret_bytes:
            print("Extract Verification PASSED.")
        else:
            print(f"Extract Verification FAILED: Content mismatch. Got: {r.content}")
    except Exception as e:
        print(f"Extract Verification FAILED: {e}")

if __name__ == "__main__":
    test_mobile_api()
