import logging
from app.core.bloom_filter import EntityBloomCache
from app.models.product import Product
from app.repositories.product import ProductRepository
from app.schemas.filters import ProductFilter
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundError, ConflictError, NegativeQuantityError

logger = logging.getLogger(__name__)


class ProductService:
    def __init__(
        self,
        repo: ProductRepository,
        sku_cache: EntityBloomCache,
        id_cache: EntityBloomCache,
    ):
        self.repo = repo
        self._sku_cache = sku_cache
        self._id_cache = id_cache

    # ── Cache management ──────────────────────────────────────────────────

    def _warm_caches(self) -> None:
        """Rebuild stale bloom filters from DB in one lightweight query."""
        sku_stale = self._sku_cache.is_stale
        id_stale = self._id_cache.is_stale
        if not (sku_stale or id_stale):
            return
        rows = self.repo.get_all_ids_and_skus()
        if id_stale:
            self._id_cache.rebuild(str(r[0]) for r in rows)
        if sku_stale:
            self._sku_cache.rebuild(r[1] for r in rows)

    # ── Queries ────────────────────────────────────────────────────────────

    def get_all_products(self, skip: int = 0, limit: int = 100) -> list[Product]:
        return self.repo.get_all(skip=skip, limit=limit)

    def get_filtered_products(
        self, filters: ProductFilter, skip: int = 0, limit: int = 100
    ) -> list[Product]:
        return self.repo.get_filtered(filters, skip=skip, limit=limit)

    def get_product_by_id(self, product_id: int) -> Product:
        self._warm_caches()
        # Bloom filter eliminates a DB round-trip for IDs that are definitely absent
        if not self._id_cache.might_exist(str(product_id)):
            raise NotFoundError("Product", product_id)
        product = self.repo.get_by_id(product_id)
        if product is None:
            raise NotFoundError("Product", product_id)
        return product

    def get_total_count(self, filters: ProductFilter | None = None) -> int:
        if filters is None:
            return self.repo.count()
        return self.repo.count_filtered(filters)

    def get_low_stock_products(self, threshold: int = 10) -> list[Product]:
        return self.repo.get_low_stock(threshold)

    # ── Mutations ──────────────────────────────────────────────────────────

    def create_product(self, data: ProductCreate) -> Product:
        if data.quantity < 0:
            raise NegativeQuantityError()
        self._warm_caches()
        # Skip the DB uniqueness check when bloom filter is certain SKU is absent
        if self._sku_cache.might_exist(data.sku) and self.repo.get_by_sku(data.sku):
            raise ConflictError(f"Product with SKU '{data.sku}' already exists")
        product = self.repo.create(data.model_dump())
        self._sku_cache.add(data.sku)
        self._id_cache.add(str(product.id))
        logger.info("Product created: id=%d sku=%s", product.id, product.sku)
        return product

    def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        self.get_product_by_id(product_id)
        update_data = data.model_dump(exclude_none=True)
        if "quantity" in update_data and update_data["quantity"] < 0:
            raise NegativeQuantityError()
        if "sku" in update_data:
            new_sku = update_data["sku"]
            if self._sku_cache.might_exist(new_sku):
                existing = self.repo.get_by_sku(new_sku)
                if existing and existing.id != product_id:
                    raise ConflictError(f"SKU '{new_sku}' is already taken")
            self._sku_cache.add(new_sku)
        product = self.repo.update(product_id, update_data)
        logger.info("Product updated: id=%d fields=%s", product_id, list(update_data.keys()))
        return product

    def delete_product(self, product_id: int) -> None:
        self.get_product_by_id(product_id)
        self.repo.delete(product_id)
        # Deletions make the filter stale; TTL will trigger a full rebuild on next use
        self._id_cache._initialized = False
        logger.info("Product deleted: id=%d", product_id)
