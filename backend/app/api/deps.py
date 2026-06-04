from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.bloom_filter import customer_email_cache, product_id_cache, product_sku_cache
from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User, UserRole
from app.repositories.customer import CustomerRepository
from app.repositories.order import OrderRepository
from app.repositories.product import ProductRepository
from app.repositories.user import UserRepository
from app.services.customer import CustomerService
from app.services.order import OrderService
from app.services.product import ProductService

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise AppException(status_code=401, detail="Not authenticated", error_code="NOT_AUTHENTICATED")
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise AppException(status_code=401, detail="Invalid or expired token", error_code="INVALID_TOKEN")
    user_id = int(payload["sub"])
    user = UserRepository(db).get_by_id(user_id)
    if not user or not user.is_active:
        raise AppException(status_code=401, detail="User not found or inactive", error_code="INVALID_TOKEN")
    return user


def require_roles(*roles: UserRole):
    """Factory: returns a dependency that enforces role membership."""
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role in roles:
            return current_user
        raise AppException(status_code=403, detail="Insufficient permissions", error_code="FORBIDDEN")
    return _check


# ── Repository factories ───────────────────────────────────────────────────

def get_product_repo(db: Session = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)


def get_customer_repo(db: Session = Depends(get_db)) -> CustomerRepository:
    return CustomerRepository(db)


def get_order_repo(db: Session = Depends(get_db)) -> OrderRepository:
    return OrderRepository(db)


# ── Service factories ──────────────────────────────────────────────────────

def get_product_service(
    repo: ProductRepository = Depends(get_product_repo),
) -> ProductService:
    return ProductService(repo, product_sku_cache, product_id_cache)


def get_customer_service(
    repo: CustomerRepository = Depends(get_customer_repo),
) -> CustomerService:
    return CustomerService(repo, customer_email_cache)


def get_order_service(
    order_repo: OrderRepository = Depends(get_order_repo),
    product_repo: ProductRepository = Depends(get_product_repo),
    customer_repo: CustomerRepository = Depends(get_customer_repo),
) -> OrderService:
    return OrderService(order_repo, product_repo, customer_repo, product_id_cache)
