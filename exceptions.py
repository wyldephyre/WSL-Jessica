"""
Custom exception classes for Jessica Core
Provides structured error handling across the application
"""


class APIError(Exception):
    """Base exception for all API-related errors"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        super().__init__(self.message)


class ValidationError(APIError):
    """Raised when input validation fails"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR")


class ServiceUnavailableError(APIError):
    """Raised when a required service is unavailable"""
    def __init__(self, service_name: str, message: str = None):
        msg = message or f"Service '{service_name}' is currently unavailable"
        super().__init__(msg, status_code=503, error_code="SERVICE_UNAVAILABLE")
        self.service_name = service_name


class MemoryError(APIError):
    """Raised when memory service operations fail"""
    def __init__(self, message: str, operation: str = None):
        super().__init__(message, status_code=500, error_code="MEMORY_ERROR")
        self.operation = operation


class ExternalAPIError(APIError):
    """Raised when external API calls fail"""
    def __init__(self, api_name: str, message: str, status_code: int = 502):
        super().__init__(f"[{api_name}] {message}", status_code=status_code, error_code="EXTERNAL_API_ERROR")
        self.api_name = api_name


class AuthenticationError(APIError):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR")

