from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.exceptions import AppException
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.token import TokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse

settings = get_settings()

_DUMMY_HASH: str = hash_password("__timing_dummy__")


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)

    def signup(self, email: str, password: str, full_name: str) -> User:
        if self.user_repo.get_by_email(email):
            raise AppException(status_code=409, detail="Email already registered", error_code="EMAIL_TAKEN")
        hashed = hash_password(password)
        user = self.user_repo.create(email=email, hashed_password=hashed, full_name=full_name)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, email: str, password: str) -> TokenResponse:
        user = self.user_repo.get_by_email(email)
        ok = verify_password(password, user.hashed_password if user else _DUMMY_HASH)
        if not user or not ok or not user.is_active:
            raise AppException(status_code=401, detail="Invalid credentials", error_code="INVALID_CREDENTIALS")
        result = self._issue_tokens(user)
        self.db.commit()
        return result

    def refresh(self, raw_refresh_token: str) -> TokenResponse:
        token_hash = hash_token(raw_refresh_token)
        rt = self.token_repo.get_refresh_token(token_hash)
        if not rt:
            raise AppException(status_code=401, detail="Invalid or expired refresh token", error_code="INVALID_REFRESH_TOKEN")
        now = datetime.now(timezone.utc)
        expires = rt.expires_at if rt.expires_at.tzinfo else rt.expires_at.replace(tzinfo=timezone.utc)
        if expires < now:
            self.token_repo.revoke_refresh_token(token_hash)
            self.db.commit()
            raise AppException(status_code=401, detail="Refresh token expired", error_code="REFRESH_TOKEN_EXPIRED")
        user = self.user_repo.get_by_id(rt.user_id)
        if not user or not user.is_active:
            raise AppException(status_code=401, detail="User not found or inactive", error_code="INVALID_CREDENTIALS")

        self.token_repo.revoke_refresh_token(token_hash)
        result = self._issue_tokens(user)
        self.db.commit()
        return result

    def logout(self, raw_refresh_token: str) -> None:
        token_hash = hash_token(raw_refresh_token)
        self.token_repo.revoke_refresh_token(token_hash)
        self.db.commit()

    def forgot_password(self, email: str) -> str | None:
        """Returns reset token in dev mode. In production, email it and return None."""
        user = self.user_repo.get_by_email(email)
        if not user:
            return None

        raw, token_hash = generate_opaque_token()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
        self.token_repo.create_reset_token(user.id, token_hash, expires_at)
        self.db.commit()
        return raw

    def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = hash_token(raw_token)
        rt = self.token_repo.get_reset_token(token_hash)
        if not rt:
            raise AppException(status_code=400, detail="Invalid or expired reset token", error_code="INVALID_RESET_TOKEN")
        user = self.user_repo.get_by_id(rt.user_id)
        if not user:
            raise AppException(status_code=400, detail="User not found", error_code="USER_NOT_FOUND")
        self.user_repo.update(user, hashed_password=hash_password(new_password))
        self.token_repo.mark_reset_token_used(token_hash)
        # Revoke all refresh tokens so existing sessions are invalidated
        self.token_repo.revoke_all_user_refresh_tokens(user.id)
        self.db.commit()

    def _issue_tokens(self, user: User) -> TokenResponse:
        access = create_access_token(subject=str(user.id), role=user.role.value)
        raw_refresh, refresh_hash = generate_opaque_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.token_repo.create_refresh_token(user.id, refresh_hash, expires_at)
        return TokenResponse(
            access_token=access,
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
