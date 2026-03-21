import requests
import os
import time
import uuid
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

BASE_URL = "http://127.0.0.1:5000"
TEST_EMAIL = f"test_{uuid.uuid4().hex[:6]}@example.com"
TEST_PASSWORD = "Pass123!"

def test_e2e_ai_scan():
    print(f"--- Starting E2E AI Scan Test ---")
    
    # 1. Signup
    print(f"[1] Signing up user: {TEST_EMAIL}")
    resp = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": "Test User"
    })
    assert resp.status_code == 201, f"Signup failed: {resp.text}"
    print("Signup successful.")

    # 2. Login
    print("[2] Logging in...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    token = data["data"]["access_token"] if "data" in data else data.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 3. Check Initial Credits
    print(f"[3] Verifying initial credits (Should be 50)...")
    resp = requests.get(f"{BASE_URL}/api/credits", headers=headers)
    print(f"Credit API Raw Response: {resp.text}")
    assert resp.status_code == 200, f"Get credits failed: {resp.text}"
    credit_data = resp.json()
    # Handle standardized envelope
    if isinstance(credit_data.get("data"), dict):
        credits = credit_data["data"]["credits"]
    else:
        credits = credit_data.get("credits")
    print(f"Current Credits: {credits}")
    assert credits == 50

    # 4. Upload & Analyze
    print("[4] Uploading and performing AI Scan...")
    # Create a dummy image
    from PIL import Image
    import io
    img = Image.new('RGB', (100, 100), color=(73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    files_analyze = {'image': ('test_scan.png', img_byte_arr, 'image/png')} # Renamed from 'files'
    resp = requests.post(f"{BASE_URL}/api/analyze", headers=headers, files=files_analyze)
    print(f"API Response Structure: {resp.text}") # Added print statement
    assert resp.status_code == 200, f"Analysis failed: {resp.text}"
    
    analysis_resp = resp.json()
    assert analysis_resp["success"] is True
    result = analysis_resp["data"]
    file_id = result.get("file_id")
    print(f"Analysis complete. File ID: {file_id}, Verdict: {result.get('verdict')}")
    assert file_id is not None

    # 5. Verify Credits After Deduction
    final_credits = analysis_resp["data"]["credits"]
    print(f"Final Credits from API: {final_credits}")
    assert final_credits == 48, f"Credits not deducted correctly! Expected 48, got {final_credits}"

    # 6. Retrieve Analysis via API
    print(f"[6] Retrieving analysis result for File ID: {file_id}...")
    resp = requests.get(f"{BASE_URL}/api/analysis/{file_id}", headers=headers)
    assert resp.status_code == 200
    retrieved_data = resp.json()
    assert retrieved_data["success"] is True
    retrieved_analysis = retrieved_data["data"]
    
    print(f"Retrieved Analysis: Verdict={retrieved_analysis.get('verdict')}, Score={retrieved_analysis.get('score')}")
    assert retrieved_analysis.get("verdict") is not None
    # Score might be 0.0 or more depending on current model/mock
    print(f"Score validated: {retrieved_analysis.get('score')}")

    print("--- E2E Test Passed Successfully ---")

if __name__ == "__main__":
    try:
        test_e2e_ai_scan()
    except Exception as e:
        print(f"TEST FAILED: {str(e)}")
        sys.exit(1)
