import logging
from decimal import Decimal
from app.core.bloom_filter import EntityBloomCache
from app.models.order import Order, OrderItem, OrderStatus
from app.repositories.order import OrderRepository
from app.repositories.product import ProductRepository
from app.repositories.customer import CustomerRepository
from app.schemas.filters import OrderFilter
from app.schemas.order import OrderCreate
from app.core.exceptions import NotFoundError, InsufficientStockError

logger = logging.getLogger(__name__)


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        product_repo: ProductRepository,
        customer_repo: CustomerRepository,
        product_id_cache: EntityBloomCache,
    ):
        self.order_repo = order_repo
        self.product_repo = product_repo
        self.customer_repo = customer_repo
        self._product_id_cache = product_id_cache


    def get_all_orders(self, skip: int = 0, limit: int = 100) -> list[Order]:
        return self.order_repo.get_all_with_items(skip=skip, limit=limit)

    def get_filtered_orders(
        self, filters: OrderFilter, skip: int = 0, limit: int = 100
    ) -> list[Order]:
        return self.order_repo.get_filtered_with_items(filters, skip=skip, limit=limit)

    def get_order_by_id(self, order_id: int) -> Order:
        order = self.order_repo.get_with_items(order_id)
        if order is None:
            raise NotFoundError("Order", order_id)
        return order

    def get_total_count(self, filters: OrderFilter | None = None) -> int:
        if filters is None:
            return self.order_repo.count()
        return self.order_repo.count_filtered(filters)


    def _warm_product_cache(self) -> None:
        if self._product_id_cache.is_stale:
            rows = self.product_repo.get_all_ids_and_skus()
            self._product_id_cache.rebuild(str(r[0]) for r in rows)

    def create_order(self, data: OrderCreate) -> Order:
        self._validate_customer(data.customer_id)
        self._warm_product_cache()

        qty_by_product: dict[int, int] = {}
        for item in data.items:
            qty_by_product[item.product_id] = qty_by_product.get(item.product_id, 0) + item.quantity

        products_with_qty: list[tuple] = []
        for product_id, qty in qty_by_product.items():
            if not self._product_id_cache.might_exist(str(product_id)):
                raise NotFoundError("Product", product_id)
            product = self.product_repo.get_by_id_for_update(product_id)
            if product is None:
                raise NotFoundError("Product", product_id)
            self._validate_stock(product, qty)
            products_with_qty.append((product, qty))

        total = self._calculate_total(products_with_qty)

        order = Order(customer_id=data.customer_id, total_amount=total, status=OrderStatus.pending)
        self.order_repo.db.add(order)
        self.order_repo.db.flush()

        for product, qty in products_with_qty:
            self.order_repo.db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                )
            )
            product.quantity -= qty

        self.order_repo.db.commit()
        order = self.order_repo.get_with_items(order.id)
        logger.info(
            "Order created: id=%d customer_id=%d total=%.2f items=%d",
            order.id, data.customer_id, float(total), len(data.items),
        )
        return order

    def delete_order(self, order_id: int) -> None:
        order = self.order_repo.get_with_items(order_id)
        if order is None:
            raise NotFoundError("Order", order_id)
        for item in order.items:
            product = self.product_repo.get_by_id(item.product_id)
            if product:
                product.quantity += item.quantity
        self.order_repo.db.delete(order)
        self.order_repo.db.commit()
        logger.info("Order deleted: id=%d stock_restored=%d items", order_id, len(order.items))

    def _validate_customer(self, customer_id: int) -> None:
        if self.customer_repo.get_by_id(customer_id) is None:
            raise NotFoundError("Customer", customer_id)

    def _validate_stock(self, product, requested_qty: int) -> None:
        if product.quantity < requested_qty:
            raise InsufficientStockError(product.name, product.quantity, requested_qty)

    def _calculate_total(self, products_with_qty: list[tuple]) -> Decimal:
        return sum(Decimal(str(product.price)) * qty for product, qty in products_with_qty)
