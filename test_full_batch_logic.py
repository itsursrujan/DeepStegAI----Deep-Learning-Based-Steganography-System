import os
import sys
import io
import datetime
from PIL import Image
import numpy as np
import zipfile

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from stego_engine import embed_payload_into_image, extract_payload_from_image, MAGIC
from adaptive_engine import embed_file_adaptive, extract_file_adaptive
from detection_engine import scan_image_for_signature
from crypto_utils import aes_encrypt, aes_decrypt

def run_full_test():
    print("🚀 Starting End-to-End Batch Logic Test...")
    
    password = "test_password"
    
    # --- 1. GENERATE STEGO IMAGES ---
    # Image A: LSB Encrypted
    img_a = Image.new('RGB', (200, 200), color=(10, 20, 30))
    payload_a = b"SECRET DATA A"
    enc_a, _ = aes_encrypt(payload_a, password)
    header_a = MAGIC + bytes([1]) + len(enc_a).to_bytes(4, "big")
    stego_a = embed_payload_into_image(img_a, header_a + enc_a)
    
    # Image B: Adaptive Encrypted
    img_b = Image.new('RGB', (200, 200), color=(30, 20, 10))
    payload_b = b"SECRET DATA B"
    stego_b, token_b = embed_file_adaptive(img_b, payload_b, "file_b.txt", password)
    
    stego_images = [
        ("stego_lsb.png", stego_a),
        ("stego_adaptive.png", stego_b)
    ]
    
    # --- 2. RUN BATCH EXTRACTION LOGIC (AS IN APP.PY) ---
    candidate_keys = [password, "wrong_pass", token_b]
    processed_success = 0
    
    print("\n--- Processing Batch ---")
    for i, (filename, img) in enumerate(stego_images):
        print(f"\nProcessing {filename}...")
        success_for_this_file = False
        
        # Fresh start (simulate PIL load)
        img_io = io.BytesIO()
        img.save(img_io, format="PNG")
        img_io.seek(0)
        s_img = Image.open(img_io).convert("RGB")
        
        scan_res = scan_image_for_signature(s_img)
        print(f"  Scan Result: {scan_res['message']}")
        
        if not scan_res["detected"]:
            print("  ❌ ERROR: No signature detected")
            continue
            
        for key in candidate_keys:
            try:
                content = b""
                if "Adaptive" in scan_res["message"]:
                    try:
                        _, content, _ = extract_file_adaptive(s_img, password=key)
                    except:
                        _, content, _ = extract_file_adaptive(s_img, recovery_token=key)
                else:
                    mode_id, payload, _ = extract_payload_from_image(s_img)
                    is_encrypted = (mode_id & 1) == 1
                    if is_encrypted:
                        try:
                            content = aes_decrypt(payload, key, is_token=False)
                        except:
                            content = aes_decrypt(payload, key, is_token=True)
                    else:
                        content = payload
                
                if content:
                    print(f"  ✅ SUCCESS with key '{key[:10]}...': {content}")
                    processed_success += 1
                    success_for_this_file = True
                    break
            except Exception as e:
                # print(f"  (Key '{key}' failed: {e})")
                continue
        
        if not success_for_this_file:
            print(f"  ❌ FAILED to extract {filename} with any provided key")

    print(f"\nTotal Success: {processed_success}/{len(stego_images)}")

if __name__ == "__main__":
    run_full_test()
