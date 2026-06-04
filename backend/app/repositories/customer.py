from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.repositories.base import BaseRepository
from app.schemas.filters import CustomerFilter


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: Session):
        super().__init__(Customer, db)

    def get_by_email(self, email: str) -> Optional[Customer]:
        return (
            self.db.query(Customer)
            .filter(func.lower(Customer.email) == email.lower())
            .first()
        )

    def get_all_emails(self) -> list[str]:
        """Lightweight query returning only emails for bloom filter warm-up."""
        return [row[0] for row in self.db.query(Customer.email).all()]

    def get_filtered(
        self, filters: CustomerFilter, skip: int = 0, limit: int = 100
    ) -> list[Customer]:
        return self._build_filter_query(filters).offset(skip).limit(limit).all()

    def count_filtered(self, filters: CustomerFilter) -> int:
        return self._build_filter_query(filters).count()

    def _build_filter_query(self, filters: CustomerFilter):
        query = self.db.query(Customer)

        if filters.name:
            query = query.filter(Customer.full_name.ilike(f"%{filters.name}%"))

        if filters.email:
            query = query.filter(Customer.email.ilike(f"%{filters.email}%"))

        return query
