import jwt
import datetime
import os
import bcrypt
from functools import wraps
from flask import request, jsonify, g

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-this-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

def hash_password(password: str) -> str:
    # bcrypt requires bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
def require_credits(cost_fixed=0, cost_per_unit=0, unit_field=None):
    """
    Decorator to check and deduct credits before an operation.
    cost_fixed: Flat cost for the operation.
    cost_per_unit: Cost per file (for batch operations).
    unit_field: The name of the file list field in request.files to count units.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from database.db import SessionLocal
            from models.user import User
            from services.credit_service import CreditService
            
            user_id_raw = getattr(request, 'user_id', None)
            email = getattr(request, 'user_email', None)
            
            if not user_id_raw:
                return jsonify({"error": "Authentication required"}), 401
            
            from uuid import UUID
            try:
                user_id = UUID(str(user_id_raw))
            except Exception:
                user_id = user_id_raw # Fallback
            
            # Developer Bypass (hjsudarshan18@gmail.com)
            if email == "hjsudarshan18@gmail.com":
                return f(*args, **kwargs)
                
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    return jsonify({"error": "User context lost"}), 404
                
                # Calculate total cost
                total_cost = cost_fixed
                if cost_per_unit > 0 and unit_field:
                    fields = [unit_field] if isinstance(unit_field, str) else unit_field
                    unit_count = 0
                    for field in fields:
                        unit_count += len(request.files.getlist(field))
                    total_cost += (unit_count * cost_per_unit)
                
                # Use CreditService to deduct credits and record transaction
                description = f"Service usage: {request.path}"
                new_balance = CreditService.deduct_credits(db, user_id, total_cost, description)
                
                if new_balance is None:
                    return jsonify({
                        "error": "Insufficient Neural Credits",
                        "required": total_cost,
                        "message": "Protocol rejected: Credit exhaustion detected."
                    }), 402 # Payment Required
                
                # Attach updated balance to request
                request.updated_credits = new_balance
                
            except Exception as e:
                db.rollback()
                return jsonify({"error": f"Credit Matrix Error: {str(e)}"}), 500
            finally:
                db.close()
                
            response = f(*args, **kwargs)
            
            # If credits were updated, attach them to headers (especially useful for Blobs)
            updated_credits = getattr(request, 'updated_credits', None)
            if updated_credits is not None:
                if isinstance(response, tuple):
                    # response might be (data, status) or (data, status, headers)
                    data, status = response[0], response[1]
                    headers = response[2] if len(response) > 2 else {}
                    headers['X-Updated-Credits'] = str(updated_credits)
                    return data, status, headers
                elif hasattr(response, 'headers'):
                    response.headers['X-Updated-Credits'] = str(updated_credits)
                    
            return response
        return decorated
    return decorator

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.user_id = payload.get("user_id")
            request.user_email = payload.get("email")
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token!"}), 401
        except Exception as e:
            return jsonify({"message": str(e)}), 401

        return f(*args, **kwargs)

    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # We assume @token_required runs before this, so request.user_id is available
        user_id = getattr(request, 'user_id', None)
        email = getattr(request, 'user_email', None)

        if not user_id:
            return jsonify({"message": "Authentication required for admin access"}), 401

        # Developer bypass
        if email == "hjsudarshan18@gmail.com":
            return f(*args, **kwargs)

        from database.db import SessionLocal
        from models.user import User
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                return jsonify({"message": "Admin privileges required"}), 403
        finally:
            db.close()

        return f(*args, **kwargs)
    return decorated
