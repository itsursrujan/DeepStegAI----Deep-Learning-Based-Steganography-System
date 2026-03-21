import requests
import io
from PIL import Image
import uuid

BASE_URL = "http://127.0.0.1:5000"

def run_batch_test():
    print("--- Starting E2E Batch Analyze Test ---")
    
    # 1. Signup
    email = f"batch_test_{uuid.uuid4().hex[:6]}@example.com"
    password = "Password123!"
    print(f"[1] Signing up user: {email}")
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": password})
    
    # 2. Login
    print("[2] Logging in...")
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}).json()
    token = login_resp["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create dummy images
    images = []
    for i in range(3):
        img = Image.new('RGB', (100, 100), color=(i*50, 0, 0))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        images.append((f'test_{i}.png', img_byte_arr, 'image/png'))

    # 4. Perform Batch Analyze
    print("[4] Uploading 3 images for Batch Analyze...")
    files_payload = [('images', img) for img in images]
    resp = requests.post(f"{BASE_URL}/api/batch_analyze", headers=headers, files=files_payload)
    
    print(f"Response Code: {resp.status_code}")
    assert resp.status_code == 200
    data = resp.json()["data"]
    
    print(f"Results count: {len(data['results'])}")
    assert len(data['results']) == 3
    
    # 5. Verify Credits (Initial 50 - 3*2 = 44)
    print(f"Final Credits: {data['credits']}")
    assert data['credits'] == 44
    
    print("--- E2E Batch Test Passed Successfully ---")

if __name__ == "__main__":
    run_batch_test()
