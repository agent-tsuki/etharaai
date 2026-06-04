from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_order_service, require_roles
from app.models.user import User, UserRole
from app.schemas.filters import ComparisonOperator, OrderFilter
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.response import ApiResponse, PaginatedApiResponse, PaginationMeta
from app.services.order import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_filter(
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    status_: Optional[str] = Query(
        None, alias="status",
        description="Filter by order status (e.g. pending, completed, cancelled)",
    ),
    min_amount: Optional[Decimal] = Query(
        None,
        description=(
            "Minimum order total. If max_amount is also set, filters BETWEEN min and max. "
            "If max_amount is absent, use amount_operator to select direction."
        ),
    ),
    max_amount: Optional[Decimal] = Query(None, description="Maximum order total"),
    amount_operator: ComparisonOperator = Query(
        ComparisonOperator.gte,
        description=(
            "Used only when min_amount is set WITHOUT max_amount. "
            "gte → amount >= min_amount  |  lte → amount <= min_amount"
        ),
    ),
    date_from: Optional[datetime] = Query(None, description="Filter orders created on or after this datetime (ISO 8601)"),
    date_to: Optional[datetime] = Query(None, description="Filter orders created on or before this datetime (ISO 8601)"),
) -> OrderFilter:
    return OrderFilter(
        customer_id=customer_id,
        status=status_,
        min_amount=min_amount,
        max_amount=max_amount,
        amount_operator=amount_operator,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/",
    response_model=PaginatedApiResponse[OrderResponse],
    summary="List orders",
    description=(
        "Returns a paginated list of orders with their items. "
        "All filter parameters are optional. No authentication required."
    ),
)
def list_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    filters: OrderFilter = Depends(_order_filter),
    service: OrderService = Depends(get_order_service),
):
    orders = service.get_filtered_orders(filters, skip=skip, limit=limit)
    total = service.get_total_count(filters)
    return PaginatedApiResponse(
        data=[OrderResponse.from_orm_full(o) for o in orders],
        pagination=PaginationMeta(
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + limit) < total,
        ),
    )


@router.get(
    "/{order_id}",
    response_model=ApiResponse[OrderResponse],
    summary="Get order by ID",
    description="Returns a single order with all its items. No authentication required.",
)
def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    order = service.get_order_by_id(order_id)
    return ApiResponse(data=OrderResponse.from_orm_full(order))



@router.post(
    "/",
    response_model=ApiResponse[OrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create order",
    description="Creates a new order and deducts product stock. Requires authentication.",
)
def create_order(
    data: OrderCreate,
    service: OrderService = Depends(get_order_service),
    _: User = Depends(get_current_user),
):
    order = service.create_order(data)
    return ApiResponse(data=OrderResponse.from_orm_full(order))


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete order",
    description="Deletes an order and restores product stock. Requires admin or manager role.",
)
def delete_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    service.delete_order(order_id)
