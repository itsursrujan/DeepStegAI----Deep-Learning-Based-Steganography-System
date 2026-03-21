import os
import razorpay
from flask import Blueprint, request, jsonify
from database.db import SessionLocal
from models.user import User
from models.razorpay_transaction import RazorpayTransaction
from utils.auth import token_required
import logging

logger = logging.getLogger("DeepStegAI.Razorpay")

razorpay_bp = Blueprint('razorpay', __name__)

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "mock_key_id")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "mock_key_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Pricing Tiers
PRICING_TIERS = {
    99: 50,    # ₹99 -> 50 credits
    199: 120,  # ₹199 -> 120 credits
    499: 350   # ₹499 -> 350 credits
}

@razorpay_bp.route('/create-order', methods=['POST'])
@token_required
def create_order():
    data = request.json
    if not data or 'amount_inr' not in data:
        return jsonify({"error": "amount_inr is required"}), 400
        
    amount = int(data['amount_inr'])
    if amount not in PRICING_TIERS:
        return jsonify({"error": "Invalid pricing tier"}), 400
        
    try:
        order_data = {
            "amount": amount * 100, # paise
            "currency": "INR",
            "receipt": f"receipt_{request.user_id[:8]}",
            "notes": {
                "user_id": request.user_id,
                "credits": PRICING_TIERS[amount]
            }
        }
        order = client.order.create(data=order_data)
        return jsonify({
            "success": True,
            "data": {
                "order_id": order['id'],
                "amount": order['amount'],
                "currency": order['currency'],
                "key_id": RAZORPAY_KEY_ID
            },
            "error": None
        })
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        return jsonify({"error": str(e)}), 500

@razorpay_bp.route('/webhook', methods=['POST'])
def webhook():
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    payload = request.data.decode('utf-8')
    
    # If signature doesn't exist, we must reject (security)
    if not webhook_signature:
        return jsonify({"error": "Missing signature headers"}), 400

    try:
        # Verify cryptograhpic signature
        client.utility.verify_webhook_signature(
            payload,
            webhook_signature,
            os.environ.get('RAZORPAY_WEBHOOK_SECRET', 'mock_webhook_secret')
        )
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        return jsonify({"error": "Invalid signature"}), 400
        
    event = request.json
    if event['event'] == 'payment.captured':
        payment_entity = event['payload']['payment']['entity']
        payment_id = payment_entity['id']
        order_id = payment_entity.get('order_id', '')
        amount_paid = payment_entity['amount'] // 100
        user_id = payment_entity['notes'].get('user_id')
        credits_to_add = PRICING_TIERS.get(amount_paid, 0)
        
        if not user_id or credits_to_add == 0:
            logger.error(f"Webhook error: Invalid notes or tier. user_id: {user_id}, amount: {amount_paid}")
            return jsonify({"status": "ignored"}), 200
            
        db = SessionLocal()
        try:
            # Idempotency check: Ensure payment_id was not already processed
            existing_txn = db.query(RazorpayTransaction).filter_by(razorpay_payment_id=payment_id).first()
            if existing_txn:
                logger.info(f"Idempotency hit: Payment {payment_id} already processed. Skipping.")
                return jsonify({"status": "already_processed"}), 200
                
            # Create transaction record and LOCK IT to prevent concurrent duplicate pings
            new_txn = RazorpayTransaction(
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id,
                razorpay_signature=webhook_signature,
                user_id=user_id,
                amount_inr=amount_paid,
                credits_added=credits_to_add
            )
            db.add(new_txn)
            
            # Physically add credits
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.credits += credits_to_add
                logger.info(f"Added {credits_to_add} credits to {user.email}")
            
            db.commit()
            return jsonify({"status": "ok"}), 200
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing webhook database update: {e}")
            return jsonify({"error": "Database error"}), 500
        finally:
            db.close()
            
    return jsonify({"status": "ignored"}), 200
