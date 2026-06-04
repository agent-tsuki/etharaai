from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ComparisonOperator(str, Enum):
    gte = "gte"  # >=
    lte = "lte"  # <=


class ProductFilter(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None

    # Stock quantity filter
    stock_count: Optional[int] = None
    stock_operator: ComparisonOperator = ComparisonOperator.gte

    # Price filter
    # Both provided  → range: min_price <= price <= max_price
    # Only min_price  → single-bound controlled by price_operator
    # Only max_price  → price <= max_price
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    price_operator: ComparisonOperator = ComparisonOperator.gte


class OrderFilter(BaseModel):
    customer_id: Optional[int] = None
    status: Optional[str] = None

    # Amount filter (same single/range semantics as price above)
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    amount_operator: ComparisonOperator = ComparisonOperator.gte

    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class CustomerFilter(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
