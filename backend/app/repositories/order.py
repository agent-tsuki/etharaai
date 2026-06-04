from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.order import Order, OrderItem
from app.repositories.base import BaseRepository
from app.schemas.filters import ComparisonOperator, OrderFilter


class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: Session):
        super().__init__(Order, db)

    def get_with_items(self, entity_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .filter(Order.id == entity_id)
            .first()
        )

    def get_all_with_items(self, skip: int = 0, limit: int = 100) -> list[Order]:
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_filtered_with_items(
        self, filters: OrderFilter, skip: int = 0, limit: int = 100
    ) -> list[Order]:
        return (
            self._build_filter_query(filters)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_filtered(self, filters: OrderFilter) -> int:
        return self._build_filter_query(filters).count()

    def _build_filter_query(self, filters: OrderFilter):
        query = self.db.query(Order)

        if filters.customer_id is not None:
            query = query.filter(Order.customer_id == filters.customer_id)

        if filters.status:
            query = query.filter(Order.status == filters.status)

        # Amount: range when both bounds present; single-bound otherwise
        if filters.min_amount is not None and filters.max_amount is not None:
            query = query.filter(
                Order.total_amount >= filters.min_amount,
                Order.total_amount <= filters.max_amount,
            )
        elif filters.min_amount is not None:
            if filters.amount_operator == ComparisonOperator.gte:
                query = query.filter(Order.total_amount >= filters.min_amount)
            else:
                query = query.filter(Order.total_amount <= filters.min_amount)
        elif filters.max_amount is not None:
            query = query.filter(Order.total_amount <= filters.max_amount)

        if filters.date_from:
            query = query.filter(Order.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Order.created_at <= filters.date_to)

        return query
