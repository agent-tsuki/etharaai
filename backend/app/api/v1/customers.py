from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_customer_service, require_roles
from app.models.user import User, UserRole
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.filters import CustomerFilter
from app.schemas.response import ApiResponse, PaginatedApiResponse, PaginationMeta
from app.services.customer import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


def _customer_filter(
    name: Optional[str] = Query(None, description="Partial name match (case-insensitive)"),
    email: Optional[str] = Query(None, description="Partial email match (case-insensitive)"),
) -> CustomerFilter:
    return CustomerFilter(name=name, email=email)


@router.get(
    "/",
    response_model=PaginatedApiResponse[CustomerResponse],
    summary="List customers",
    description=(
        "Returns a paginated list of customers. Filter by name or email with partial "
        "case-insensitive match. No authentication required."
    ),
)
def list_customers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    filters: CustomerFilter = Depends(_customer_filter),
    service: CustomerService = Depends(get_customer_service),
):
    customers = service.get_filtered_customers(filters, skip=skip, limit=limit)
    total = service.get_total_count(filters)
    return PaginatedApiResponse(
        data=customers,
        pagination=PaginationMeta(
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + limit) < total,
        ),
    )


@router.get(
    "/{customer_id}",
    response_model=ApiResponse[CustomerResponse],
    summary="Get customer by ID",
    description="Returns a single customer. No authentication required.",
)
def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
):
    customer = service.get_customer_by_id(customer_id)
    return ApiResponse(data=customer)


@router.post(
    "/",
    response_model=ApiResponse[CustomerResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create customer",
    description="Creates a new customer. Requires admin or manager role.",
)
def create_customer(
    data: CustomerCreate,
    service: CustomerService = Depends(get_customer_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    customer = service.create_customer(data)
    return ApiResponse(data=customer)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete customer",
    description="Deletes a customer. Requires admin or manager role.",
)
def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    service.delete_customer(customer_id)
