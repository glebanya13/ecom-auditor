"""
Security utilities: JWT, password hashing, AES encryption (PBKDF2-based).
"""
from __future__ import annotations

import uuid
import logging
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

from .config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Return bcrypt hash of *password*."""
    return pwd_context.hash(password)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token.

    Includes a ``jti`` (JWT ID) claim so individual tokens can be revoked
    via :class:`TokenBlacklist`.
    """
    to_encode = data.copy()
    expire = (
        datetime.utcnow() + expires_delta
        if expires_delta
        else datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token; return None on any error."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Token blacklist (V05 – logout revocation)
# ---------------------------------------------------------------------------

class TokenBlacklist:
    """In-memory store of revoked JWT IDs.

    For multi-process / multi-instance deployments swap the dict for a
    Redis SET with TTL.  The interface stays the same.
    """

    def __init__(self) -> None:
        self._store: Dict[str, datetime] = {}

    def revoke(self, jti: str, expires_at: datetime) -> None:
        """Add *jti* to the blacklist until *expires_at*."""
        self._store[jti] = expires_at
        self._purge_expired()

    def is_revoked(self, jti: str) -> bool:
        """Return True if *jti* has been revoked."""
        return jti in self._store

    def _purge_expired(self) -> None:
        now = datetime.utcnow()
        expired = [j for j, exp in self._store.items() if exp < now]
        for j in expired:
            del self._store[j]


# Singleton – import this wherever you need revocation checks.
token_blacklist = TokenBlacklist()


# ---------------------------------------------------------------------------
# AES-256 encryption for API keys (V06 – PBKDF2 key derivation)
# ---------------------------------------------------------------------------

_PBKDF2_SALT = b"ecom_auditor_2026_fixed_salt"
_PBKDF2_ITERATIONS = 390_000          # NIST SP 800-132 minimum as of 2023


class AESCipher:
    """Fernet (AES-128-CBC + HMAC-SHA256) wrapper with PBKDF2 key derivation.

    Stored values are tagged with a version prefix to allow seamless
    migration of legacy tokens:

    * ``v2:<token>`` – PBKDF2HMAC-derived key (**current**)
    * ``<token>``    – SHA-256-derived key (**legacy**, read-only)
    """

    def __init__(self, key: str) -> None:
        # --- Legacy (SHA-256) cipher – decrypt-only ---
        legacy_raw = base64.urlsafe_b64encode(
            hashlib.sha256(key.encode()).digest()
        )
        self._legacy = Fernet(legacy_raw)

        # --- Current (PBKDF2) cipher ---
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=_PBKDF2_SALT,
            iterations=_PBKDF2_ITERATIONS,
        )
        current_raw = base64.urlsafe_b64encode(kdf.derive(key.encode()))
        self._current = Fernet(current_raw)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt *plaintext* with the PBKDF2 key and tag as ``v2:``."""
        if not plaintext:
            return ""
        token = self._current.encrypt(plaintext.encode()).decode()
        return f"v2:{token}"

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt *ciphertext*, auto-selecting the cipher by version prefix."""
        if not ciphertext:
            return ""
        if ciphertext.startswith("v2:"):
            return self._current.decrypt(ciphertext[3:].encode()).decode()
        # Legacy value – no prefix
        return self._legacy.decrypt(ciphertext.encode()).decode()


# Singleton cipher – key is read once from settings at startup.
cipher = AESCipher(settings.AES_ENCRYPTION_KEY)


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for database storage."""
    return cipher.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored API key for runtime use."""
    return cipher.decrypt(encrypted_key)
