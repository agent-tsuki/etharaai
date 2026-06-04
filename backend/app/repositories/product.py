from typing import Optional
from sqlalchemy.orm import Session
from app.models.product import Product
from app.repositories.base import BaseRepository
from app.schemas.filters import ComparisonOperator, ProductFilter


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku).first()

    def get_low_stock(self, threshold: int = 10) -> list[Product]:
        return self.db.query(Product).filter(Product.quantity <= threshold).all()

    def update_quantity(self, entity_id: int, quantity_delta: int) -> Optional[Product]:
        product = self.get_by_id(entity_id)
        if product is None:
            return None
        product.quantity += quantity_delta
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_all_ids_and_skus(self) -> list[tuple[int, str]]:
        """Lightweight query returning only (id, sku) pairs for bloom filter warm-up."""
        return self.db.query(Product.id, Product.sku).all()

    def get_filtered(
        self, filters: ProductFilter, skip: int = 0, limit: int = 100
    ) -> list[Product]:
        return self._build_filter_query(filters).offset(skip).limit(limit).all()

    def count_filtered(self, filters: ProductFilter) -> int:
        return self._build_filter_query(filters).count()

    def _build_filter_query(self, filters: ProductFilter):
        query = self.db.query(Product)

        if filters.name:
            query = query.filter(Product.name.ilike(f"%{filters.name}%"))

        if filters.sku:
            query = query.filter(Product.sku == filters.sku)

        if filters.stock_count is not None:
            if filters.stock_operator == ComparisonOperator.gte:
                query = query.filter(Product.quantity >= filters.stock_count)
            else:
                query = query.filter(Product.quantity <= filters.stock_count)

        # Price: range when both bounds present; single-bound otherwise
        if filters.min_price is not None and filters.max_price is not None:
            query = query.filter(
                Product.price >= filters.min_price,
                Product.price <= filters.max_price,
            )
        elif filters.min_price is not None:
            if filters.price_operator == ComparisonOperator.gte:
                query = query.filter(Product.price >= filters.min_price)
            else:
                query = query.filter(Product.price <= filters.min_price)
        elif filters.max_price is not None:
            query = query.filter(Product.price <= filters.max_price)

        return query
