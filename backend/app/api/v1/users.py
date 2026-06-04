import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.response import ApiResponse
from app.schemas.user import UserOut, UserPermissionsUpdate, UserRoleUpdate, UserUpdate
from app.services.user import UserService

logger = logging.getLogger("app.users")

router = APIRouter(prefix="/users", tags=["users"])


def _get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get("", response_model=ApiResponse[list[UserOut]])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles(UserRole.admin)),
    svc: UserService = Depends(_get_user_service),
):
    users = svc.list_users(skip=skip, limit=limit)
    return ApiResponse(data=[UserOut.model_validate(u) for u in users])


@router.get("/{user_id}", response_model=ApiResponse[UserOut])
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    svc: UserService = Depends(_get_user_service),
):
    # Admin sees any user; others can only see themselves
    from app.core.exceptions import AppException
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise AppException(status_code=403, detail="Access denied", error_code="FORBIDDEN")
    user = svc.get_by_id(user_id)
    return ApiResponse(data=UserOut.model_validate(user))


@router.put("/{user_id}", response_model=ApiResponse[UserOut])
def update_user(
    user_id: int,
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    svc: UserService = Depends(_get_user_service),
):
    from app.core.exceptions import AppException
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise AppException(status_code=403, detail="Access denied", error_code="FORBIDDEN")
    user = svc.update_user(
        user_id=user_id,
        full_name=body.full_name,
        email=body.email,
        is_active=body.is_active,
    )
    return ApiResponse(data=UserOut.model_validate(user))


@router.patch("/{user_id}/role", response_model=ApiResponse[UserOut])
def update_role(
    user_id: int,
    body: UserRoleUpdate,
    current_user: User = Depends(require_roles(UserRole.admin)),
    svc: UserService = Depends(_get_user_service),
):
    user = svc.update_role(user_id=user_id, role=body.role, requester=current_user)
    return ApiResponse(data=UserOut.model_validate(user))


@router.patch("/{user_id}/permissions", response_model=ApiResponse[UserOut])
def update_permissions(
    user_id: int,
    body: UserPermissionsUpdate,
    current_user: User = Depends(require_roles(UserRole.admin)),
    svc: UserService = Depends(_get_user_service),
):
    user = svc.update_permissions(user_id=user_id, permissions=body.permissions, requester=current_user)
    return ApiResponse(data=UserOut.model_validate(user))


@router.delete("/{user_id}", response_model=ApiResponse[dict])
def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles(UserRole.admin)),
    svc: UserService = Depends(_get_user_service),
):
    svc.delete_user(user_id=user_id, requester=current_user)
    return ApiResponse(data={"message": "User deleted"})
