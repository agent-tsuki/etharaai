from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def create(self, email: str, hashed_password: str, full_name: str, role: UserRole = UserRole.agent) -> User:
        user = User(
            email=email.lower(),
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        self.db.flush()
        return user

    def list_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def count(self) -> int:
        return self.db.query(User).count()

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.flush()
