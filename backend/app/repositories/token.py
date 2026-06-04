from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.token import RefreshToken, PasswordResetToken


class TokenRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Refresh tokens ---

    def create_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
        rt = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(rt)
        self.db.flush()
        return rt

    def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        return self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,  # noqa: E712
        ).first()

    def revoke_refresh_token(self, token_hash: str) -> None:
        rt = self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if rt:
            rt.revoked = True
            self.db.flush()

    def revoke_all_user_refresh_tokens(self, user_id: int) -> None:
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,  # noqa: E712
        ).update({"revoked": True})
        self.db.flush()

    # --- Password reset tokens ---

    def create_reset_token(self, user_id: int, token_hash: str, expires_at: datetime) -> PasswordResetToken:
        # Invalidate any existing unused reset tokens for this user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used == False,  # noqa: E712
        ).update({"used": True})
        rt = PasswordResetToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(rt)
        self.db.flush()
        return rt

    def get_reset_token(self, token_hash: str) -> PasswordResetToken | None:
        now = datetime.now(timezone.utc)
        return self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > now,
        ).first()

    def mark_reset_token_used(self, token_hash: str) -> None:
        rt = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()
        if rt:
            rt.used = True
            self.db.flush()
