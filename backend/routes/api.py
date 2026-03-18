from flask import Blueprint, jsonify, request
from utils.auth import token_required
from database.db import SessionLocal
from services.file_service import FileService
from services.credit_service import CreditService
from services.analysis_service import AnalysisService

api_bp = Blueprint('api', __name__)

@api_bp.route('/files', methods=['GET'])
@token_required
def list_files():
    db = SessionLocal()
    try:
        files = FileService.get_user_files(db, request.user_id)
        return jsonify({
            "success": True,
            "data": [f.to_dict() for f in files],
            "error": None
        })
    finally:
        db.close()

@api_bp.route('/credits', methods=['GET'])
@token_required
def get_credits():
    from models.user import User
    from models.credit_transaction import CreditTransaction
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        transactions = db.query(CreditTransaction).filter(CreditTransaction.user_id == request.user_id).order_by(CreditTransaction.created_at.desc()).limit(20).all()
        return jsonify({
            "success": True,
            "data": {
                "credits": user.credits,
                "transactions": [t.to_dict() for t in transactions]
            },
            "error": None
        })
    finally:
        db.close()

@api_bp.route('/analysis', methods=['GET'])
@token_required
def list_analysis():
    db = SessionLocal()
    try:
        results = AnalysisService.get_user_analyses(db, request.user_id)
        return jsonify({
            "success": True,
            "data": [r.to_dict() for r in results],
            "error": None
        })
    finally:
        db.close()

@api_bp.route('/analysis/<file_id>', methods=['GET'])
@token_required
def get_analysis(file_id):
    import uuid
    db = SessionLocal()
    try:
        analysis = AnalysisService.get_analysis_by_file(db, uuid.UUID(file_id))
        if not analysis:
            return jsonify({
                "success": False,
                "data": None,
                "error": "Analysis not found"
            }), 404
        return jsonify({
            "success": True,
            "data": analysis.to_dict(),
            "error": None
        })
    finally:
        db.close()
