from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    skip: int
    limit: int
    has_more: bool


class ApiResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: T


class PaginatedApiResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: List[T]
    pagination: PaginationMeta


class ErrorResponse(BaseModel):
    status: str = "fail"
    msg: str
    error_code: str
