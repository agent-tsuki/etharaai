from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user import UserRepository


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def get_by_id(self, user_id: int) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise AppException(status_code=404, detail="User not found", error_code="USER_NOT_FOUND")
        return user

    def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        return self.repo.list_all(skip=skip, limit=limit)

    def update_user(self, user_id: int, full_name: str | None, email: str | None, is_active: bool | None) -> User:
        user = self.get_by_id(user_id)
        if email and email.lower() != user.email:
            existing = self.repo.get_by_email(email)
            if existing:
                raise AppException(status_code=409, detail="Email already in use", error_code="EMAIL_TAKEN")
        updates = {}
        if full_name is not None:
            updates["full_name"] = full_name
        if email is not None:
            updates["email"] = email.lower()
        if is_active is not None:
            updates["is_active"] = is_active
        user = self.repo.update(user, **updates)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_role(self, user_id: int, role: UserRole, requester: User) -> User:
        if requester.role != UserRole.admin:
            raise AppException(status_code=403, detail="Only admins can change roles", error_code="FORBIDDEN")
        user = self.get_by_id(user_id)
        user = self.repo.update(user, role=role)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_permissions(self, user_id: int, permissions: dict, requester: User) -> User:
        if requester.role != UserRole.admin:
            raise AppException(status_code=403, detail="Only admins can set permissions", error_code="FORBIDDEN")
        user = self.get_by_id(user_id)
        user = self.repo.update(user, permissions=permissions)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int, requester: User) -> None:
        if requester.id == user_id:
            raise AppException(status_code=400, detail="Cannot delete your own account", error_code="SELF_DELETE")
        user = self.get_by_id(user_id)
        self.repo.delete(user)
        self.db.commit()
