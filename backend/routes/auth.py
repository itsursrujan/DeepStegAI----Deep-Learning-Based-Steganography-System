from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from database.db import SessionLocal
from models.user import User
from schemas.user import UserSignUp, UserLogin
from utils.auth import hash_password, verify_password, create_access_token
from sqlalchemy.exc import IntegrityError
import secrets
import datetime
from utils.email_utils import send_password_reset_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Validate input using Pydantic
        user_data = UserSignUp(**data)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 422

    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            credits=50
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return jsonify({
            "message": "User created successfully",
            "user_id": str(new_user.id)
        }), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"error": "Could not create user"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Validate input
        login_data = UserLogin(**data)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 422

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        # Generate JWT token
        access_token = create_access_token(data={
            "user_id": str(user.id),
            "email": user.email
        })

        return jsonify({
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            user.reset_token = token
            user.reset_token_expiry = datetime.datetime.now() + datetime.timedelta(hours=1)
            db.commit()
            
            # Send email
            send_password_reset_email(user.email, token)
            
        # Always return success to prevent email enumeration
        return jsonify({"message": "If this email is registered, a reset link has been sent."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400
        
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            User.reset_token == token,
            User.reset_token_expiry > datetime.datetime.now()
        ).first()
        
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 400
            
        # Update password
        user.password_hash = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()
        
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
