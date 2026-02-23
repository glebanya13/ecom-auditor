"""
Authentication API endpoints
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.rate_limit import limiter
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    encrypt_api_key,
    token_blacklist,
)
from ..core.config import settings
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token, UserUpdate

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


# ---------------------------------------------------------------------------
# Dependency: current authenticated user
# ---------------------------------------------------------------------------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT and return the owning User row."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # V05 – check token has not been revoked (logout blacklist)
    jti = payload.get("jti")  # type: Optional[str]
    if jti and token_blacklist.is_revoked(jti):
        raise credentials_exception

    user_id_str = payload.get("sub")  # type: Optional[str]
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user.

    Returns the same generic error whether the email already exists or not
    to prevent user-enumeration (V09).
    """
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        # Generic message – do NOT reveal that the email is already taken (V09)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please check your details.",
        )

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        telegram_id=user_data.telegram_id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info("New user registered: id=%s", new_user.id)
    return new_user


# ---------------------------------------------------------------------------
# Login – rate-limited (V01)
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate user and return a JWT access token.

    Limited to 10 requests per minute per IP to prevent brute-force (V01).
    """
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt for email=%s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )

    user.last_login = datetime.utcnow()
    db.commit()

    logger.info("User logged in: id=%s", user.id)
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Profile endpoints
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile, API keys, and/or password."""
    update_fields = user_data.dict(exclude_unset=True)

    # ── Password change ───────────────────────────────────────────────────
    if "new_password" in update_fields:
        current_pw = update_fields.pop("current_password", None)
        new_pw = update_fields.pop("new_password")
        if not current_pw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для смены пароля необходимо указать текущий пароль",
            )
        if not verify_password(current_pw, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Текущий пароль указан неверно",
            )
        current_user.hashed_password = get_password_hash(new_pw)
    else:
        update_fields.pop("current_password", None)
        update_fields.pop("new_password", None)

    # ── Profile + API keys ────────────────────────────────────────────────
    for field, value in update_fields.items():
        if value is None:
            continue
        if field in ("wb_api_key", "ozon_api_key") and value:
            value = encrypt_api_key(value)
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


# ---------------------------------------------------------------------------
# Logout – revoke the current token (V05)
# ---------------------------------------------------------------------------

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
):
    """Invalidate the current JWT so it cannot be reused after logout (V05).

    The JTI is added to the in-memory blacklist until the token's natural
    expiry.  Clients should also delete the token on their side.
    """
    payload = decode_access_token(token)
    if payload:
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            expires_at = datetime.utcfromtimestamp(exp)
            token_blacklist.revoke(jti, expires_at)
            logger.info("Token revoked for user id=%s jti=%s", current_user.id, jti)

    return {"message": "Successfully logged out"}
