from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel
from app.models.order import OrderStatus


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
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    price_operator: ComparisonOperator = ComparisonOperator.gte


class OrderFilter(BaseModel):
    customer_id: Optional[int] = None
    status: Optional[OrderStatus] = None

    # Amount filter
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    amount_operator: ComparisonOperator = ComparisonOperator.gte

    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class CustomerFilter(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
