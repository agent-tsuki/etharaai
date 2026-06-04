import logging
import time
from fastapi import FastAPI, Request, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import setup_logging
from app.api.v1 import products, customers, orders
from app.api.v1 import auth, users
from app.database import get_db
from app.repositories.product import ProductRepository
from app.repositories.customer import CustomerRepository
from app.repositories.order import OrderRepository
from app.schemas.response import ApiResponse

settings = get_settings()
setup_logging(settings.LOG_LEVEL)

logger = logging.getLogger("app.main")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
    description="Production-ready API for managing products, customers, and orders",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info("%s %s → %d (%.1fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.warning("%s %s → %s: %s", request.method, request.url.path, type(exc).__name__, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "fail", "msg": exc.detail, "error_code": exc.error_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join(
        f"{' -> '.join(str(loc) for loc in e['loc'])}: {e['msg']}"
        for e in errors
    )
    logger.warning("%s %s → RequestValidationError: %s", request.method, request.url.path, msg)
    return JSONResponse(
        status_code=422,
        content={"status": "fail", "msg": msg, "error_code": "VALIDATION_ERROR"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"status": "fail", "msg": "Internal server error", "error_code": "INTERNAL_SERVER_ERROR"},
    )


@app.get("/health", tags=["health"], response_model=ApiResponse[dict])
def health_check():
    return ApiResponse(data={"status": "healthy"})


@app.get("/api/v1/dashboard", tags=["dashboard"], response_model=ApiResponse[dict])
def get_dashboard(db: Session = Depends(get_db)):
    p_repo = ProductRepository(db)
    c_repo = CustomerRepository(db)
    o_repo = OrderRepository(db)
    low_stock = p_repo.get_low_stock(threshold=10, limit=20)
    return ApiResponse(
        data={
            "total_products": p_repo.count(),
            "total_customers": c_repo.count(),
            "total_orders": o_repo.count(),
            "low_stock_products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "quantity": p.quantity,
                    "price": float(p.price),
                }
                for p in low_stock
            ],
        }
    )
