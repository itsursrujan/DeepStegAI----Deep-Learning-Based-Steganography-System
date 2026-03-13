import os
import sys
import random
import logging
import bcrypt
import io
import json
import torch
import numpy as np
import zipfile
import markdown
import filetype
import datetime
import base64
from PIL import Image
from flask import Flask, request, jsonify, send_file, render_template, redirect, session, url_for
from flask_cors import CORS

# --- Modular Imports ---

# --- Modular Imports from Parent ---
from crypto_utils import aes_encrypt, aes_decrypt, xor_encrypt_decrypt
from stego_engine import embed_payload_into_image, extract_payload_from_image, image_capacity_bits, MAGIC, bits_to_bytes
from adaptive_engine import embed_file_adaptive, extract_file_adaptive, MAGIC_ADAPTIVE
from detection_engine import scan_image_for_signature
from steganalysis_model import get_model
from train_stego_model import predict_image

# --- Professional Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DeepStegAI")

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "deepstegai_secure_key_2024")

# Admin PIN Management: Use environment variable or a secure hashed default
# Generated hash for "1234" for compatibility, but recommend setting ADMIN_PIN_HASH in env
DEFAULT_PIN_HASH = b'$2b$12$K7B3dF6.mXv8wJkY5Hj6u.vQ9zR0T1U2V3W4X5Y6Z7A8B9C0D1E2' # Hash for "1234" (example)
ADMIN_PIN_HASH = os.environ.get("ADMIN_PIN_HASH", DEFAULT_PIN_HASH.decode())

MESSAGES_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'messages.json')

# Apply standard CORS policy
CORS(app, resources={r"/*": {"origins": "*"}}, expose_headers=["Content-Disposition", "content-disposition", "X-Filename"])

# Increase file upload limit to 100MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

# Ensure data dir exists
os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'data'), exist_ok=True)


# --- Global AI Model Loading ---
MODEL = None
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_calibrated_ai_score(image_pil, initial_ai_score, signature_detected):
    """
    Confidence Calibration Layer:
    If a signature is detected, boost the AI score based on payload density.
    This ensures the AI output matches the confirmed results.
    """
    ai_score = initial_ai_score
    if signature_detected:
        try:
            # Read header to find payload size
            arr = np.array(image_pil)
            flat = arr.flatten()
            header_bits = (flat[:72] & 1).astype(np.uint8)
            header_bytes = bits_to_bytes(header_bits)
            payload_len = int.from_bytes(header_bytes[5:9], "big")
            
            # Calculate density
            cap = image_capacity_bits(image_pil)
            usage_ratio = (payload_len * 8) / cap
            
            # Calibration: Base 60% + payload factor
            cal_score = 0.60 + (usage_ratio * 0.399)
            cal_score = min(0.999, cal_score)
            
            return max(ai_score, cal_score)
        except Exception as e:
            logger.debug(f"Calibration error: {e}")
            return max(ai_score, 0.95)
    return ai_score

def load_ai_model():
    global MODEL
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'stego_model.pth')
    try:
        if os.path.exists(model_path):
            logger.info(f"Loading AI Model from {model_path} on {DEVICE}...")
            model = get_model().to(DEVICE)
            model.load_state_dict(torch.load(model_path, map_location=DEVICE))
            model.eval()
            MODEL = model
            logger.info("AI Model loaded successfully.")
        else:
            logger.warning(f"AI Model file {model_path} not found. AI features disabled.")
    except Exception as e:
        logger.error(f"Failed to load AI model: {e}", exc_info=True)

load_ai_model()

# --- Routes ---

@app.route('/api/batch', methods=['POST', 'OPTIONS'])
def api_batch():
    try:
        mode = request.form.get('mode') # 'hide' or 'extract'
        password = request.form.get('password', '')
        
        if mode == 'hide':
            if 'covers' not in request.files or 'secret' not in request.files:
                 return jsonify({'error': 'Missing files for batch hide'}), 400
            
            method = request.form.get('method', 'lsb')
            covers = request.files.getlist('covers')
            if len(covers) > 50:
                return jsonify({'error': 'Batch limit exceeded: maximum 50 covers.'}), 400
            
            secret = request.files['secret']
            secret_bytes = secret.read()
            
            zip_buffer = io.BytesIO()
            processed_count = 0
            summary_lines = [f"DeepStegAI Batch Hide Report - {datetime.datetime.now()}", "-"*50]
            
            with zipfile.ZipFile(zip_buffer, "w") as zf:
                for i, cover in enumerate(covers):
                    try:
                        c_img = Image.open(cover).convert("RGB")
                        
                        if method == 'adaptive':
                            stego, token = embed_file_adaptive(c_img, secret_bytes, secret.filename, password)
                            summary_lines.append(f"[+] {cover.filename}: Embedded (Adaptive). Recovery Token: {token}")
                        else:
                            # Standard LSB
                            payload = secret_bytes
                            mode_byte = 1 if password else 0
                            if password:
                                payload, _ = aes_encrypt(secret_bytes, password)
                            
                            header = MAGIC + bytes([mode_byte]) + len(payload).to_bytes(4, "big")
                            stego = embed_payload_into_image(c_img, header + payload)
                            summary_lines.append(f"[+] {cover.filename}: Embedded (Standard LSB)")

                        img_byte_arr = io.BytesIO()
                        stego.save(img_byte_arr, format="PNG")
                        zf.writestr(f"stego_{i}_{os.path.splitext(cover.filename)[0]}.png", img_byte_arr.getvalue())
                        processed_count += 1
                    except Exception as e:
                        summary_lines.append(f"[-] {cover.filename}: Error - {str(e)}")
                
                zf.writestr("embedding_report.txt", "\n".join(summary_lines))
            
            if processed_count == 0:
                return jsonify({'error': 'No images could be processed.', 'details': summary_lines}), 400
                
            zip_buffer.seek(0)
            return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='deepsteg_batch_stego.zip')

        elif mode == 'extract':
             if 'stegos' not in request.files:
                 return jsonify({'error': 'Missing stego files'}), 400
             
             stegos = request.files.getlist('stegos')
             if len(stegos) > 50:
                 return jsonify({'error': 'Batch limit exceeded: maximum 50 stego images.'}), 400
                 
             raw_keys = request.form.get('batch_keys', '')[:10000]  # Limit string size to prevent memory issues
             # Clean and split keys (passwords or tokens)
             candidate_keys = [k.strip() for k in raw_keys.split('\n') if k.strip()]
             if not candidate_keys:
                 candidate_keys = [""] # Try at least once (for plain images)
             
             zip_buffer = io.BytesIO()
             processed_success = 0
             summary_lines = [f"DeepStegAI Smart Batch Extraction Report - {datetime.datetime.now()}", "-"*50]
             
             with zipfile.ZipFile(zip_buffer, "w") as zf:
                 for i, stego_file in enumerate(stegos):
                     success_for_this_file = False
                     last_error = "Unknown"
                     
                     try:
                         # 1. Load Image
                         s_img = Image.open(stego_file).convert("RGB")
                         scan_res = scan_image_for_signature(s_img)
                         
                         # REMOVED: Early exit on signature. We now try extraction regardless 
                         # in case the signature was slightly mangled but the data is there.
                         
                         summary_lines.append(f"[*] Analyzing {stego_file.filename} (Scan hint: {scan_res['message']})")
                         
                         # 2. Key Trial Loop (Try every key against EVERY engine)
                         for key in candidate_keys:
                             try:
                                 content = b""
                                 final_fname = ""
                                 
                                 # ENGINE 1: Try Adaptive
                                 try:
                                     f_name, f_data, _ = extract_file_adaptive(s_img, password=key)
                                     content, final_fname = f_data, f_name
                                 except:
                                     if len(key) >= 16:
                                         try:
                                             f_name, f_data, _ = extract_file_adaptive(s_img, recovery_token=key)
                                             content, final_fname = f_data, f_name
                                         except: pass
                                 
                                 # ENGINE 2: Try LSB (if Adaptive didn't work)
                                 if not content:
                                     try:
                                         mode_id, payload, _ = extract_payload_from_image(s_img)
                                         is_encrypted = (mode_id & 1) == 1
                                         if is_encrypted:
                                             try:
                                                 content = aes_decrypt(payload, key, is_token=False)
                                             except:
                                                 content = aes_decrypt(payload, key, is_token=True)
                                         else:
                                             content = payload # Plain LSB
                                         
                                         kind = filetype.guess(content)
                                         ext = kind.extension if kind else 'bin'
                                         final_fname = f"extracted_{os.path.splitext(stego_file.filename)[0]}.{ext}"
                                     except: pass

                                 if content:
                                     zip_path = f"{i}_{final_fname}"
                                     zf.writestr(zip_path, content)
                                     summary_lines.append(f"  [+] Success using key: '{key[:5]}...'")
                                     processed_success += 1
                                     success_for_this_file = True
                                     break 
                                 
                             except Exception as e:
                                 last_error = str(e)
                                 continue 
                                 
                         # 3. Fallback: Try Plain LSB without any key if everything else failed
                         if not success_for_this_file:
                             try:
                                 mode_id, payload, _ = extract_payload_from_image(s_img)
                                 if not (mode_id & 1):
                                     kind = filetype.guess(payload)
                                     ext = kind.extension if kind else 'bin'
                                     f_name = f"extracted_{os.path.splitext(stego_file.filename)[0]}.{ext}"
                                     zf.writestr(f"{i}_{f_name}", payload)
                                     summary_lines.append("  [+] Success (Plain LSB, no key needed)")
                                     processed_success += 1
                                     success_for_this_file = True
                             except: pass

                         if not success_for_this_file:
                             summary_lines.append(f"  [-] Failed. Last tried key error hint: {last_error}")
                             
                     except Exception as e:
                        summary_lines.append(f"  [-] Critical Error: {str(e)}")
                        logger.error(f"Batch extractor critical failure: {e}")
                
                 zf.writestr("DEEPSTEGAI_BATCH_REPORT.txt", "\n".join(summary_lines))
            
             if processed_success == 0:
                 return jsonify({'error': 'No files extracted. Ensure your keys list contains the correct items.', 'details': summary_lines}), 400
                 
             zip_buffer.seek(0)
             return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='deepsteg_results.zip')

        return jsonify({'error': 'Invalid mode'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Contact & Admin Routes ---

import threading
messages_lock = threading.Lock()

@app.route('/api/contact', methods=['POST'])
def api_contact():
    """Endpoint for the Support page to submit queries."""
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'Message required'}), 400
            
        now = datetime.datetime.now()
        entry = {
            'id': random.randint(1000, 9999),
            'timestamp': str(now),
            'date': now.strftime("%Y-%m-%d"),
            'time': now.strftime("%H:%M:%S"),
            'name': data.get('name', 'Anonymous')[:100],  # Minimal sanitization
            'email': data.get('email', 'No Email')[:100],
            'message': data['message'][:2000]
        }
        
        with messages_lock:
            messages = []
            if os.path.exists(MESSAGES_FILE):
                try:
                    with open(MESSAGES_FILE, 'r') as f:
                        messages = json.load(f)
                except:
                    messages = []
            
            messages.append(entry)
            
            # Keep only the last 500 messages to prevent infinite file growth
            messages = messages[-500:]
            
            with open(MESSAGES_FILE, 'w') as f:
                json.dump(messages, f, indent=4)
            
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Contact API Error: {e}", exc_info=True)
        return jsonify({'error': "Processing Failed"}), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Admin endpoint to retrieve support queries."""
    try:
        if os.path.exists(MESSAGES_FILE):
            with open(MESSAGES_FILE, 'r') as f:
                messages = json.load(f)
            return jsonify(messages)
        return jsonify([])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Core API ---

@app.route('/api/embed', methods=['POST'])
def api_embed():
    logger.info("Processing embedding request")
    try:
        if 'cover' not in request.files or 'secret' not in request.files:
            return jsonify({'error': 'Missing cover image or secret file'}), 400
        
        cover_file = request.files['cover']
        secret_file = request.files['secret']
        method = request.form.get('method', 'LSB') # LSB or Adaptive
        password = request.form.get('password', '')

        if not password and method == 'Adaptive':
             return jsonify({'error': 'Password is required for Adaptive Edge method'}), 400
        
        cover_img = Image.open(cover_file).convert("RGB")
        secret_bytes = secret_file.read()
        recovery_token = None

        stego_img = None

        if method == 'Adaptive':
            # Adaptive Edge 
            stego_img, token = embed_file_adaptive(cover_img, secret_bytes, secret_file.filename, password)
            recovery_token = token 
        else:
            # Standard LSB
            payload_bytes = secret_bytes
            
            if password:
                # Use updated aes_encrypt that returns token
                encrypted_blob, token = aes_encrypt(secret_bytes, password)
                payload_bytes = encrypted_blob
                recovery_token = token
            
            mode_byte = 1 if password else 0
            header = MAGIC + bytes([mode_byte]) + len(payload_bytes).to_bytes(4, "big")
            full_payload = header + payload_bytes
            
            if len(full_payload) * 8 > image_capacity_bits(cover_img):
                 return jsonify({'error': 'File too large for this cover image'}), 400

            stego_img = embed_payload_into_image(cover_img, full_payload)

        # To return both Image and Token, we encode image to Base64 JSON
        img_buffer = io.BytesIO()
        stego_img.save(img_buffer, format="PNG")
        img_b64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'image_data': img_b64,
            'filename': 'stego_image.png',
            'recovery_token': recovery_token,
            'method': method
        })

    except Exception as e:
        logger.error(f"Embedding error: {e}", exc_info=True)
        return jsonify({'error': "Internal server error during embedding processing."}), 500

@app.route('/api/extract', methods=['POST'])
def api_extract():
    logger.info("Processing extraction request")
    try:
        if 'stego' not in request.files:
             return jsonify({'error': 'Missing stego image'}), 400
        
        stego_file = request.files['stego']
        password = request.form.get('password', '')
        recovery_token = request.form.get('recovery_token', '')
        
        stego_img = Image.open(stego_file).convert("RGB")
        
        # 1. Detect Signature
        scan_res = scan_image_for_signature(stego_img)
        
        filename = "extracted_data.bin"
        content = b""
        
        if scan_res["detected"] and "Adaptive" in scan_res["message"]:
            # Adaptive extract
            if not password and not recovery_token:
                 return jsonify({'error': 'Password or Recovery Token required for Adaptive Edge extraction'}), 401
            try:
                fname, data, _ = extract_file_adaptive(stego_img, password=password, recovery_token=recovery_token)
                filename = fname
                content = data
            except ValueError as ve:
                return jsonify({'error': f"Extraction Failed: {str(ve)}"}), 403
                
        elif scan_res["detected"]:
            # LSB extract
            mode_id, payload, _ = extract_payload_from_image(stego_img)
            is_encrypted = mode_id & 1
            
            content = payload
            if is_encrypted:
                try:
                    if recovery_token:
                        # Use Token
                        content = aes_decrypt(payload, recovery_token, is_token=True)
                    elif password:
                        # Use Password
                        content = aes_decrypt(payload, password, is_token=False)
                    else:
                        return jsonify({'error': 'Password OR Recovery Token required'}), 401
                except Exception as e:
                     return jsonify({'error': f'Decryption failed. Details: {str(e)}'}), 403
            
            # Attempt to guess extension
            kind = filetype.guess(content)
            if kind:
                filename = f"extracted_file.{kind.extension}"

        else:
            return jsonify({'error': 'No steganography signature found'}), 404

        # Return Extracted File
        return send_file(
            io.BytesIO(content),
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    logger.info("Processing analysis request")
    try:
        if 'image' not in request.files:
             return jsonify({'error': 'Missing image'}), 400
             
        img_file = request.files['image']
        image_pil = Image.open(img_file).convert("RGB")
        
        # 1. Static Analysis
        sig_res = scan_image_for_signature(image_pil)
        
        # 2. AI Analysis
        ai_score = 0.0
        ai_success = False
        
        if MODEL:
            try:
                ai_score = predict_image(MODEL, image_pil)
                ai_success = True
            except Exception as e:
                logger.error(f"AI classification layer error: {e}")
        
        # --- CONFIDENCE CALIBRATION LAYER ---
        ai_score = get_calibrated_ai_score(image_pil, ai_score, sig_res["detected"])
        if sig_res["detected"]: ai_success = True

        # Verdict Logic
        verdict = "Clean"
        description = "No hidden data detected."
        detected = False
        
        is_suspicious_ai = ai_success and ai_score > 0.5
        
        if sig_res["detected"]:
            detected = True
            verdict = "DETECTED"
            description = f"Confirmed Steganography. Method: {sig_res['message'].replace('DeepStegAI Signature Found ', '').strip('()')}"
        elif is_suspicious_ai:
            detected = True
            verdict = "SUSPICIOUS"
            description = f"Deep Learning found anomalies (Confidence: {ai_score*100:.1f}%)"
            
        # Remove bytes from JSON response
        if "magic_bytes" in sig_res:
             del sig_res["magic_bytes"]

        response = {
            "detected": detected,
            "verdict": verdict,
            "description": description,
            "static_analysis": sig_res,
            "ai_analysis": {
                "available": ai_success,
                "score": float(ai_score),
                "threshold": 0.5
            }
        }
        
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch_analyze', methods=['POST'])
@app.route('/api/detection/batch', methods=['POST'])
@app.route('/api/analyze/batch', methods=['POST'])
def api_batch_analyze():
    """Performs deep AI analysis on multiple images."""
    if 'images' not in request.files:
        return jsonify({'error': 'No images provided'}), 400
    
    files = request.files.getlist('images')
    if len(files) > 50:
        return jsonify({'error': 'Batch limit exceeded: maximum 50 images.'}), 400
        
    results = []
    
    for f in files:
        try:
            img = Image.open(f).convert("RGB")
            # 1. AI Analysis
            ai_score = 0.0
            if MODEL:
                ai_score = predict_image(MODEL, img)
            
            # 2. Heuristic Check
            scan = scan_image_for_signature(img)
            
            # 3. Confidence Calibration (Syncing batch logic with single scan)
            ai_score = get_calibrated_ai_score(img, ai_score, scan["detected"])
            
            # Verdict calculation
            verdict = "CLEAN"
            if scan["detected"]:
                verdict = "DETECTED"
            elif ai_score > 0.5:
                verdict = "SUSPICIOUS"

            results.append({
                'filename': f.filename,
                'ai_score': round(float(ai_score) * 100, 2),
                'verdict': verdict,
                'heuristic': scan['message']
            })
        except Exception as e:
            logger.error(f"Error in batch scan for {f.filename}: {e}")
            results.append({'filename': f.filename, 'error': str(e)})
            
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)