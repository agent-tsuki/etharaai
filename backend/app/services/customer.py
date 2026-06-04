import logging
from app.core.bloom_filter import EntityBloomCache
from app.models.customer import Customer
from app.repositories.customer import CustomerRepository
from app.schemas.customer import CustomerCreate
from app.schemas.filters import CustomerFilter
from app.core.exceptions import NotFoundError, ConflictError

logger = logging.getLogger(__name__)


class CustomerService:
    def __init__(self, repo: CustomerRepository, email_cache: EntityBloomCache):
        self.repo = repo
        self._email_cache = email_cache

    def _warm_cache(self) -> None:
        if self._email_cache.is_stale:
            self._email_cache.rebuild(self.repo.get_all_emails())


    def get_all_customers(self, skip: int = 0, limit: int = 100) -> list[Customer]:
        return self.repo.get_all(skip=skip, limit=limit)

    def get_filtered_customers(
        self, filters: CustomerFilter, skip: int = 0, limit: int = 100
    ) -> list[Customer]:
        return self.repo.get_filtered(filters, skip=skip, limit=limit)

    def get_customer_by_id(self, customer_id: int) -> Customer:
        customer = self.repo.get_by_id(customer_id)
        if customer is None:
            raise NotFoundError("Customer", customer_id)
        return customer

    def get_total_count(self, filters: CustomerFilter | None = None) -> int:
        if filters is None:
            return self.repo.count()
        return self.repo.count_filtered(filters)

    def create_customer(self, data: CustomerCreate) -> Customer:
        self._warm_cache()
        if self._email_cache.might_exist(data.email) and self.repo.get_by_email(data.email):
            raise ConflictError(f"Customer with email '{data.email}' already exists")
        customer = self.repo.create(data.model_dump())
        self._email_cache.add(data.email)
        logger.info("Customer created: id=%d email=%s", customer.id, customer.email)
        return customer

    def delete_customer(self, customer_id: int) -> None:
        self.get_customer_by_id(customer_id)
        self.repo.delete(customer_id)
        logger.info("Customer deleted: id=%d", customer_id)
