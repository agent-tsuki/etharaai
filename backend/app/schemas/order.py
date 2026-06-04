from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_at_least_one(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be at least 1")
        return v


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None

    @classmethod
    def from_orm_with_product(cls, item) -> "OrderItemResponse":
        return cls(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else None,
        )


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("order must contain at least one item")
        return v


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse] = []
    customer_name: Optional[str] = None

    @classmethod
    def from_orm_full(cls, order) -> "OrderResponse":
        return cls(
            id=order.id,
            customer_id=order.customer_id,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at,
            customer_name=order.customer.full_name if order.customer else None,
            items=[OrderItemResponse.from_orm_with_product(i) for i in order.items],
        )
