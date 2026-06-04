from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    permissions: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserPermissionsUpdate(BaseModel):
    permissions: dict
