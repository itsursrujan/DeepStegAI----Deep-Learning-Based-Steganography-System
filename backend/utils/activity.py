import logging
from sqlalchemy.orm import Session
from models.activity_log import ActivityLog
from flask import request

logger = logging.getLogger("DeepStegAI.Activity")

def log_user_activity(db: Session, user_id: str, action: str, details: str = None, meta: dict = None):
    try:
        ip = request.remote_addr if request else None
        new_log = ActivityLog(
            user_id=user_id,
            action=action,
            details=details,
            metadata_json=meta,
            ip_address=ip
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log activity: {e}")
