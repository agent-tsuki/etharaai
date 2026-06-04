class AppException(Exception):
    def __init__(self, detail: str, status_code: int = 400, error_code: str = "BAD_REQUEST"):
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(detail)


class NotFoundError(AppException):
    def __init__(self, resource: str, identifier):
        super().__init__(
            f"{resource} with id '{identifier}' not found",
            status_code=404,
            error_code="NOT_FOUND",
        )


class ConflictError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail, status_code=409, error_code="CONFLICT")


class BusinessValidationError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail, status_code=422, error_code="BUSINESS_VALIDATION_ERROR")


class InsufficientStockError(AppException):
    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            f"Insufficient stock for '{product_name}': available={available}, requested={requested}",
            status_code=400,
            error_code="INSUFFICIENT_STOCK",
        )


class NegativeQuantityError(AppException):
    def __init__(self):
        super().__init__(
            "Product quantity cannot be negative",
            status_code=422,
            error_code="NEGATIVE_QUANTITY",
        )
