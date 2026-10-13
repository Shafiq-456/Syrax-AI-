"""
Authentication & Multi-Tenant Workspace Security Services.

Features:
- Cryptographic PBKDF2-HMAC-SHA256 password hashing.
- Standard HMAC-SHA256 signed JWT tokens (no heavy external deps needed).
- Workspace resolution: scopes all data queries to the user's active workspace.
- Default guest workspace fallback for seamless evaluation and demo runs.
"""
import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User, Workspace, WorkspaceMember

SECRET_KEY = "syrax-secure-signing-key-for-workspace-isolation-v2"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt:hash."""
    try:
        salt, stored_hash = hashed_password.split(":")
        computed = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hmac.compare_digest(computed.hex(), stored_hash)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def _b64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s.encode('utf-8'))


def create_access_token(user_id: int, workspace_id: int, email: str) -> str:
    """Generate signed JWT token containing user and workspace claims."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "email": email,
        "workspace_id": workspace_id,
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    segments = f"{_b64url_encode(header_bytes)}.{_b64url_encode(payload_bytes)}"
    signature = hmac.new(SECRET_KEY.encode('utf-8'), segments.encode('utf-8'), hashlib.sha256).digest()

    return f"{segments}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> Optional[dict]:
    """Verify signature and return token claims."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        segments = f"{parts[0]}.{parts[1]}"
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), segments.encode('utf-8'), hashlib.sha256).digest()
        provided_sig = _b64url_decode(parts[2])

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def get_default_workspace(db: Session) -> Workspace:
    """Ensure a default workspace exists for initial demo or unauthenticated users."""
    ws = db.query(Workspace).filter(Workspace.slug == "default-lab").first()
    if not ws:
        ws = Workspace(name="Default Innovation Lab", slug="default-lab")
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws


def get_current_workspace_id(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> int:
    """
    Extract active workspace ID from Bearer token.
    Falls back gracefully to Default Workspace (ID 1) for guest mode.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "workspace_id" in payload:
            return payload["workspace_id"]

    default_ws = get_default_workspace(db)
    return default_ws.id


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Retrieve User if valid token is provided."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            return db.get(User, int(payload["sub"]))
    return None
