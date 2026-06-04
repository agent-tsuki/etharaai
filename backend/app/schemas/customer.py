from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
