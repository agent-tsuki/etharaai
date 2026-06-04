from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_product_service, require_roles
from app.models.user import User, UserRole
from app.schemas.filters import ComparisonOperator, ProductFilter
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.schemas.response import ApiResponse, PaginatedApiResponse, PaginationMeta
from app.services.product import ProductService

router = APIRouter(prefix="/products", tags=["products"])


# ── Filter dependency ──────────────────────────────────────────────────────

def _product_filter(
    name: Optional[str] = Query(None, description="Partial name match (case-insensitive)"),
    sku: Optional[str] = Query(None, description="Exact SKU match"),
    stock_count: Optional[int] = Query(
        None, ge=0,
        description="Filter by stock quantity. Use stock_operator to choose >= or <=",
    ),
    stock_operator: ComparisonOperator = Query(
        ComparisonOperator.gte,
        description="gte → quantity >= stock_count  |  lte → quantity <= stock_count",
    ),
    min_price: Optional[Decimal] = Query(
        None, gt=0,
        description=(
            "Minimum price. If max_price is also set, filters price BETWEEN min and max. "
            "If max_price is absent, use price_operator to select '>=' or '<=' direction."
        ),
    ),
    max_price: Optional[Decimal] = Query(None, gt=0, description="Maximum price (price <= max_price)"),
    price_operator: ComparisonOperator = Query(
        ComparisonOperator.gte,
        description=(
            "Used only when min_price is set WITHOUT max_price. "
            "gte → price >= min_price  |  lte → price <= min_price"
        ),
    ),
) -> ProductFilter:
    return ProductFilter(
        name=name,
        sku=sku,
        stock_count=stock_count,
        stock_operator=stock_operator,
        min_price=min_price,
        max_price=max_price,
        price_operator=price_operator,
    )


# ── Public GET endpoints (no authentication required) ──────────────────────

@router.get(
    "/",
    response_model=PaginatedApiResponse[ProductResponse],
    summary="List products",
    description=(
        "Returns a paginated list of products. All filter parameters are optional and "
        "can be combined freely. No authentication required."
    ),
)
def list_products(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    filters: ProductFilter = Depends(_product_filter),
    service: ProductService = Depends(get_product_service),
):
    products = service.get_filtered_products(filters, skip=skip, limit=limit)
    total = service.get_total_count(filters)
    return PaginatedApiResponse(
        data=products,
        pagination=PaginationMeta(
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + limit) < total,
        ),
    )


@router.get(
    "/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Get product by ID",
    description="Returns a single product. No authentication required.",
)
def get_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    product = service.get_product_by_id(product_id)
    return ApiResponse(data=product)


# ── Protected write endpoints (admin or manager) ────────────────────────────

@router.post(
    "/",
    response_model=ApiResponse[ProductResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create product",
    description="Creates a new product. Requires admin or manager role.",
)
def create_product(
    data: ProductCreate,
    service: ProductService = Depends(get_product_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    product = service.create_product(data)
    return ApiResponse(data=product)


@router.put(
    "/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Update product",
    description="Updates an existing product. Requires admin or manager role.",
)
def update_product(
    product_id: int,
    data: ProductUpdate,
    service: ProductService = Depends(get_product_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    product = service.update_product(product_id, data)
    return ApiResponse(data=product)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product",
    description="Deletes a product. Requires admin or manager role.",
)
def delete_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    service.delete_product(product_id)
