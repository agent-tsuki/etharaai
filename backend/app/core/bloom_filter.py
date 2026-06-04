import hashlib
import math
import threading
import time
from typing import Iterable


class BloomFilter:
    """Space-efficient probabilistic membership test using double hashing.

    False positives possible at the configured error_rate.
    False negatives are impossible — if __contains__ returns False, the
    item is DEFINITELY absent.
    """

    def __init__(self, capacity: int, error_rate: float = 0.01):
        self._size = self._optimal_size(capacity, error_rate)
        self._hash_count = self._optimal_hash_count(self._size, capacity)
        self._bit_array = bytearray(self._size // 8 + 1)
        self._count = 0

    @staticmethod
    def _optimal_size(n: int, p: float) -> int:
        return max(8, int(-n * math.log(p) / (math.log(2) ** 2)))

    @staticmethod
    def _optimal_hash_count(m: int, n: int) -> int:
        return max(1, int(m / n * math.log(2)))

    def _positions(self, item: str) -> list[int]:
        encoded = item.encode()
        h1 = int(hashlib.sha256(encoded).hexdigest(), 16)
        # Keep h2 odd to guarantee it is coprime with any power-of-2 table size
        h2 = int(hashlib.md5(encoded).hexdigest(), 16) | 1
        return [(h1 + i * h2) % self._size for i in range(self._hash_count)]

    def add(self, item: str) -> None:
        for pos in self._positions(item):
            self._bit_array[pos >> 3] |= 1 << (pos & 7)
        self._count += 1

    def __contains__(self, item: str) -> bool:
        return all(
            self._bit_array[pos >> 3] & (1 << (pos & 7))
            for pos in self._positions(item)
        )

    def clear(self) -> None:
        self._bit_array = bytearray(len(self._bit_array))
        self._count = 0

    @property
    def count(self) -> int:
        return self._count


class EntityBloomCache:
    """Thread-safe, TTL-backed bloom filter for entity existence checks.

    Call might_exist() before a DB lookup — if it returns False the item is
    DEFINITELY absent and the round-trip can be skipped entirely.
    The filter rebuilds itself from a fresh DB snapshot whenever it becomes stale
    (TTL expired or not yet initialized).
    """

    def __init__(
        self,
        capacity: int = 500_000,
        ttl_seconds: int = 300,
        error_rate: float = 0.01,
    ):
        self._capacity = capacity
        self._ttl = ttl_seconds
        self._error_rate = error_rate
        self._filter = BloomFilter(capacity, error_rate)
        self._initialized = False
        self._last_rebuild: float = 0.0
        self._lock = threading.RLock()

    @property
    def is_stale(self) -> bool:
        return not self._initialized or (time.monotonic() - self._last_rebuild) > self._ttl

    def rebuild(self, items: Iterable[str]) -> None:
        with self._lock:
            new_filter = BloomFilter(self._capacity, self._error_rate)
            for item in items:
                new_filter.add(item)
            self._filter = new_filter
            self._initialized = True
            self._last_rebuild = time.monotonic()

    def add(self, item: str) -> None:
        with self._lock:
            self._filter.add(item)

    def might_exist(self, item: str) -> bool:
        """Returns False only when item is DEFINITELY not in the set."""
        if not self._initialized:
            return True
        return item in self._filter


# ── Module-level singletons ────────────────────────────────────────────────
# Shared across all requests in a single process.  The 5-minute TTL means
# the filter is rebuilt from DB at most once per 5 minutes per worker.

product_sku_cache: EntityBloomCache = EntityBloomCache(capacity=500_000, ttl_seconds=300)
product_id_cache: EntityBloomCache = EntityBloomCache(capacity=500_000, ttl_seconds=300)
customer_email_cache: EntityBloomCache = EntityBloomCache(capacity=500_000, ttl_seconds=300)
