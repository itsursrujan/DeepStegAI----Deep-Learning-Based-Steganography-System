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
import base64
import datetime
from dotenv import load_dotenv
from database.db import engine, Base
from routes.auth import auth_bp
from routes.api import api_bp
from routes.razorpay_routes import razorpay_bp
from PIL import Image
from flask import Flask, request, jsonify, send_file, render_template, redirect, session, url_for
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
import concurrent.futures

# --- Modular Imports ---

# --- Modular Imports from Parent ---
from crypto_utils import aes_encrypt, aes_decrypt, xor_encrypt_decrypt
from stego_engine import embed_payload_into_image, extract_payload_from_image, image_capacity_bits, MAGIC, bits_to_bytes
from adaptive_engine import embed_file_adaptive, extract_file_adaptive, MAGIC_ADAPTIVE
from detection_engine import scan_image_for_signature
from steganalysis_model import get_model
from train_stego_model import predict_image
from utils.auth import token_required, require_credits, admin_required
from utils.email_utils import send_admin_notification, send_user_receipt
from utils.activity import log_user_activity

# --- Service Imports ---
from database.db import SessionLocal
from services.file_service import FileService
from services.analysis_service import AnalysisService

# --- Professional Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DeepStegAI")

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "deepstegai_secure_key_2024")

# Admin access is now restricted by verified developer email
DEVELOPER_EMAIL = "hjsudarshan18@gmail.com"

# Load environment variables
load_dotenv()

# Initialize Sentry for Crash Reporting
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        traces_sample_rate=1.0
    )
    logger.info("Sentry integration enabled.")

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(razorpay_bp, url_prefix='/api/razorpay')

# Initialize Database
try:
    import models  # Ensure all models are registered before creating tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

MESSAGES_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'messages.json')

# Apply standard CORS policy
CORS(app, resources={r"/*": {"origins": "*"}}, expose_headers=["Content-Disposition", "content-disposition", "X-Filename", "X-Updated-Credits"])

# Rate Limiter setup
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(error="Rate limit exceeded", details=str(e.description)), 429

def validate_uploaded_image(file_storage):
    """Deep binary validation to reject non-image payloads safely."""
    header = file_storage.read(512)
    file_storage.seek(0)
    kind = filetype.guess(header)
    if kind is None or kind.mime not in ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']:
        raise ValueError(f"Invalid file type. Found: {kind.extension if kind else 'Unknown'}. Only PNG/JPG/WEBP allowed.")

# Decrease file upload limit to 10MB (Strict Constraint)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

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
@limiter.limit("10 per minute")
@token_required
@require_credits(cost_per_unit=2, unit_field=['covers', 'stegos'])
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
            for c in covers:
                validate_uploaded_image(c)
            
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
            
            # Database Persistence for batch results
            db = SessionLocal()
            try:
                # Save the final ZIP as a stego file record (aggregate)
                FileService.save_file(db, request.user_id, zip_buffer.getvalue(), "deepsteg_batch_stego.zip", "stego")
                log_user_activity(db, request.user_id, "BATCH_EMBED", f"Processed {processed_count} files", {"method": method, "count": processed_count})
            finally:
                db.close()
            
            zip_buffer.seek(0)
            return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='deepsteg_batch_stego.zip')

        elif mode == 'extract':
             if 'stegos' not in request.files:
                 return jsonify({'error': 'Missing stego files'}), 400
             
             stegos = request.files.getlist('stegos')
             if len(stegos) > 50:
                 return jsonify({'error': 'Batch limit exceeded: maximum 50 stego images.'}), 400
             for s in stegos:
                 validate_uploaded_image(s)
                 
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
from models.message import Message

@app.route('/api/contact', methods=['POST'])
def api_contact():
    """Endpoint for the Support page to submit queries."""
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'Message required'}), 400
            
        now = datetime.datetime.now()
        name = data.get('name', 'Anonymous')[:100]
        email = data.get('email', 'No Email')[:100]
        msg_text = data['message'][:2000]
        
        db = SessionLocal()
        try:
            new_msg = Message(name=name, email=email, message=msg_text)
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            entry = new_msg.to_dict()
        finally:
            db.close()
            
        # Send Email Notifications in background (To Admin and User receipt)
        def notify_all(entry_data):
            try:
                send_admin_notification(entry_data)
                send_user_receipt(entry_data)
            except Exception as email_err:
                logger.error(f"Failed to send email: {email_err}")
                
        threading.Thread(target=notify_all, args=(entry,), daemon=True).start()
            
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Contact API Error: {e}", exc_info=True)
        return jsonify({'error': "Processing Failed"}), 500

@app.route('/api/messages', methods=['GET'])
@token_required
@admin_required
def get_messages():
    """Admin endpoint to retrieve support queries. Only accessible by the developer."""
    try:

        db = SessionLocal()
        try:
            # Fetch last 500 messages
            messages = db.query(Message).order_by(Message.created_at.desc()).limit(500).all()
            msg_list = [m.to_dict() for m in messages]
        finally:
            db.close()
            
        return jsonify({
            "success": True,
            "data": msg_list,
            "error": None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/audit-logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs():
    """Admin endpoint to view all system activity logs."""
    from models.activity_log import ActivityLog
    try:
        db = SessionLocal()
        try:
            logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(1000).all()
            log_list = [l.to_dict() for l in logs]
        finally:
            db.close()
            
        return jsonify({
            "success": True,
            "data": log_list,
            "error": None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Core API ---

@app.route('/api/embed', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
@require_credits(cost_fixed=5)
def api_embed():
    logger.info("Processing embedding request")
    try:
        if 'cover' not in request.files or 'secret' not in request.files:
            return jsonify({'error': 'Missing cover image or secret file'}), 400
        
        cover_file = request.files['cover']
        validate_uploaded_image(cover_file)
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

        # Database Persistence
        db = SessionLocal()
        try:
            logging.info(f"Persisting embedding results to DB for user {request.user_id}")
            # Save Cover File
            cover_img_buffer = io.BytesIO()
            cover_img.save(cover_img_buffer, format="PNG")
            db_cover = FileService.save_file(db, request.user_id, cover_img_buffer.getvalue(), cover_file.filename, "cover")
            
            # Save Stego Image
            stego_buffer = io.BytesIO()
            stego_img.save(stego_buffer, format="PNG")
            db_stego = FileService.save_file(db, request.user_id, stego_buffer.getvalue(), "stego_image.png", "stego")
            
            # Log Activity
            log_user_activity(db, request.user_id, "EMBED", f"Embedded payload into {cover_file.filename}", {"method": method})
            
            logging.info(f"Persistence successful. Stego ID: {db_stego.id}")
        except Exception as db_err:
            logging.error(f"Database persistence failed: {str(db_err)}")
        finally:
            db.close()

        # To return both Image and Token, we encode image to Base64 JSON
        img_buffer = io.BytesIO()
        stego_img.save(img_buffer, format="PNG")
        img_b64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'data': {
                'image_data': img_b64,
                'filename': 'stego_image.png',
                'recovery_token': recovery_token,
                'method': method,
                'credits': getattr(request, 'updated_credits', None),
                'file_id': str(db_stego.id) if 'db_stego' in locals() else None
            },
            'error': None
        })

    except Exception as e:
        logger.error(f"Embedding error: {e}", exc_info=True)
        return jsonify({'error': "Internal server error during embedding processing."}), 500

@app.route('/api/extract', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
@require_credits(cost_fixed=2)
def api_extract():
    logger.info("Processing extraction request")
    try:
        if 'stego' not in request.files:
             return jsonify({'error': 'Missing stego image'}), 400
        
        stego_file = request.files['stego']
        validate_uploaded_image(stego_file)
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

        # Database Persistence
        db = SessionLocal()
        try:
            # Save Input Stego Image
            stego_buffer = io.BytesIO()
            stego_img.save(stego_buffer, format="PNG")
            db_file = FileService.save_file(db, request.user_id, stego_buffer.getvalue(), stego_file.filename, "stego")
            log_user_activity(db, request.user_id, "EXTRACT", f"Extracted {filename}")
        finally:
            db.close()

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
@limiter.limit("10 per minute")
@token_required
@require_credits(cost_fixed=2)
def api_analyze():
    logger.info("Processing analysis request")
    # Core AI Scan Pipeline: Upload -> Analyze -> Store -> Response
    try:
        # 1. Validation
        if 'image' not in request.files:
             return jsonify({
                 "success": False,
                 "data": None,
                 "error": "Missing image file"
             }), 400
             
        img_file = request.files['image']
        validate_uploaded_image(img_file)
        image_pil = Image.open(img_file).convert("RGB")
        
        # 2. Heuristic Analysis
        sig_res = scan_image_for_signature(image_pil)
        # Remove bytes from JSON early
        if "magic_bytes" in sig_res:
             del sig_res["magic_bytes"]
        
        # 3. AI Analysis
        ai_score = 0.0
        ai_success = False
        if MODEL:
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(predict_image, MODEL, image_pil)
                    ai_score = float(future.result(timeout=30.0))
                    ai_success = True
            except concurrent.futures.TimeoutError:
                logger.error("AI scanning timed out (exceeded 30s)")
                return jsonify({
                    "success": False,
                    "data": None,
                    "error": "AI scan timed out due to high server load. Please try again later."
                }), 503
            except Exception as e:
                logger.error(f"AI classification error: {e}")
        
        # 4. Confidence Calibration
        ai_score = float(get_calibrated_ai_score(image_pil, ai_score, sig_res.get("detected", False)))
        
        # 5. Verdict Logic (Optimized to reduce false positives for AI-generated images)
        verdict = "CLEAN"
        if sig_res.get("detected"):
            # A signature is a definitive 100% match
            verdict = "DETECTED"
        elif ai_score > 0.85:
            # High threshold for suspicious images without a signature
            verdict = "SUSPICIOUS"
        elif ai_score > 0.65:
            # Low probability of stego, likely AI-noise or high-frequency artifacts
            # We keep it as CLEAN but record the score in details
            verdict = "CLEAN"
            
        description = sig_res.get("message", "No hidden data detected.")
        if verdict == "SUSPICIOUS":
            description = f"Anomalies detected (Confidence: {ai_score*100:.1f}%)"
        elif verdict == "DETECTED":
             description = f"CONFIRMED Steganography: {description}"
        else:
            # Clean
            if ai_score > 0.5:
                description = "Clean (Minor noise artifacts detected, likely natural or AI-generated)"

        # 6. Build Standardized Data Objects
        # Structure for static_details in DB
        analysis_details = {
            "ai_score": ai_score,
            "method": "Signature + AI" if ai_success else "Signature Only",
            "extra": {
                "heuristic": sig_res,
                "description": description
            }
        }

        # 7. Database Persistence
        db = SessionLocal()
        file_id = "N/A"
        try:
            # Save Input File
            img_buffer = io.BytesIO()
            image_pil.save(img_buffer, format="PNG")
            db_file = FileService.save_file(db, request.user_id, img_buffer.getvalue(), img_file.filename, "stego")
            file_id = str(db_file.id)
            
            # Save Analysis Results (Using the standardized details)
            AnalysisService.save_analysis(db, db_file.id, verdict, ai_score, analysis_details)
            log_user_activity(db, request.user_id, "SCAN", f"Analyzed {img_file.filename} -> {verdict}", {"score": ai_score, "verdict": verdict})
        except Exception as db_err:
            logger.error(f"Persistence error: {db_err}")
        finally:
            db.close()

        # 8. Final Standardized API Response
        return jsonify({
            "success": True,
            "data": {
                "verdict": verdict,
                "ai_score": ai_score,
                "file_id": file_id,
                "details": analysis_details,
                "credits": getattr(request, 'updated_credits', None)
            },
            "error": None
        })

    except Exception as e:
        logger.error(f"Fatal Scan Error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "data": None,
            "error": str(e)
        }), 500

@app.route('/api/batch_analyze', methods=['POST'])
@app.route('/api/detection/batch', methods=['POST'])
@app.route('/api/analyze/batch', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
@require_credits(cost_per_unit=2, unit_field='images')
def api_batch_analyze():
    """Performs deep AI analysis on multiple images."""
    if 'images' not in request.files:
        return jsonify({'error': 'No images provided'}), 400
    
    files = request.files.getlist('images')
    if len(files) > 50:
        return jsonify({'error': 'Batch limit exceeded: maximum 50 images.'}), 400
    for f in files:
        validate_uploaded_image(f)
        
    results = []
    db = SessionLocal()
    try:
        for f in files:
            try:
                # Read file for processing
                f.seek(0)
                file_bytes = f.read()
                f.seek(0)
                img = Image.open(f).convert("RGB")
                
                # 1. AI Analysis
                ai_score = 0.0
                if MODEL:
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(predict_image, MODEL, img)
                        try:
                            ai_score = float(future.result(timeout=30.0))
                        except concurrent.futures.TimeoutError:
                            logger.error(f"AI batch scanning timed out for {f.filename}")
                            results.append({'filename': f.filename, 'error': "AI scan timed out for this image."})
                            continue
                
                # 2. Heuristic Check
                scan = scan_image_for_signature(img)
                
                # 3. Confidence Calibration
                ai_score = get_calibrated_ai_score(img, ai_score, scan["detected"])
                
                # Verdict calculation (Optimized for reliability)
                verdict = "CLEAN"
                if scan["detected"]:
                    verdict = "DETECTED"
                elif ai_score > 0.85:
                    verdict = "SUSPICIOUS"

                # 4. Database Persistence
                db_file = FileService.save_file(db, request.user_id, file_bytes, f.filename, "cover")
                AnalysisService.save_result(db, db_file.id, verdict, {
                    "ai_score": ai_score,
                    "method": "batch_scan",
                    "extra": {"heuristic": scan["message"]}
                }, confidence_score=ai_score)

                results.append({
                    'id': str(db_file.id),
                    'filename': f.filename,
                    'ai_score': round(float(ai_score) * 100, 2),
                    'verdict': verdict,
                    'details': {'heuristic': scan['message']}
                })
            except Exception as e:
                logger.error(f"Error in batch scan for {f.filename}: {e}")
                results.append({'filename': f.filename, 'error': str(e)})

        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "data": None, "error": f"Batch process failed: {str(e)}"}), 500
    finally:
        db.close()
            
    return jsonify({
        "success": True,
        "data": {
            "results": results,
            "credits": getattr(request, 'updated_credits', None)
        },
        "error": None
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)