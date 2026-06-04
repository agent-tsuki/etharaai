import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.response import ApiResponse
from app.schemas.user import UserOut
from app.services.auth import AuthService

logger = logging.getLogger("app.auth")
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/signup", response_model=ApiResponse[UserOut], status_code=201)
def signup(body: SignupRequest, svc: AuthService = Depends(_get_auth_service)):
    user = svc.signup(email=body.email, password=body.password, full_name=body.full_name)
    logger.info("New user registered: %s", user.email)
    return ApiResponse(data=UserOut.model_validate(user))


@router.post("/login", response_model=ApiResponse[TokenResponse])
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, svc: AuthService = Depends(_get_auth_service)):
    tokens = svc.login(email=body.email, password=body.password)
    return ApiResponse(data=tokens)


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh(body: RefreshRequest, svc: AuthService = Depends(_get_auth_service)):
    tokens = svc.refresh(raw_refresh_token=body.refresh_token)
    return ApiResponse(data=tokens)


@router.post("/logout", response_model=ApiResponse[dict])
def logout(body: LogoutRequest, svc: AuthService = Depends(_get_auth_service)):
    svc.logout(raw_refresh_token=body.refresh_token)
    return ApiResponse(data={"message": "Logged out successfully"})


@router.post("/forgot-password", response_model=ApiResponse[dict])
@limiter.limit("5/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, svc: AuthService = Depends(_get_auth_service)):
    reset_token = svc.forgot_password(email=body.email)
    # In production: email the token, return generic message
    # In dev: return the token directly
    response_data: dict = {"message": "If that email exists, a reset link has been sent"}
    if reset_token:
        response_data["reset_token"] = reset_token  # Remove this in production
    return ApiResponse(data=response_data)


@router.post("/reset-password", response_model=ApiResponse[dict])
def reset_password(body: ResetPasswordRequest, svc: AuthService = Depends(_get_auth_service)):
    svc.reset_password(raw_token=body.token, new_password=body.new_password)
    return ApiResponse(data={"message": "Password reset successfully"})


@router.get("/me", response_model=ApiResponse[UserOut])
def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=UserOut.model_validate(current_user))
