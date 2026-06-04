from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class ProductBase(BaseModel):
    name: str
    sku: str
    price: Decimal
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("quantity cannot be negative")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("price must be greater than zero")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    quantity: Optional[int] = None

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("quantity cannot be negative")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("price must be greater than zero")
        return v


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
