"""
Retry utilities with exponential backoff
Provides retry decorators and functions for resilient API calls
"""

import time
import logging
from functools import wraps
from typing import Callable, Type, Tuple, Optional
from requests.exceptions import RequestException, Timeout, ConnectionError

logger = logging.getLogger(__name__)


def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (RequestException, Timeout, ConnectionError),
    on_retry: Optional[Callable] = None
):
    """
    Decorator to retry a function with exponential backoff
    
    Args:
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds before first retry
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff calculation
        retryable_exceptions: Tuple of exception types that should trigger retry
        on_retry: Optional callback function called before each retry
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        if on_retry:
                            on_retry(attempt + 1, e, delay)
                        
                        logger.warning(
                            f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}. "
                            f"Retrying in {delay:.2f}s..."
                        )
                        
                        time.sleep(delay)
                        delay = min(delay * exponential_base, max_delay)
                    else:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {str(e)}"
                        )
                        raise
                except Exception as e:
                    # Non-retryable exception, raise immediately
                    logger.error(f"{func.__name__} raised non-retryable exception: {str(e)}")
                    raise
            
            # Should never reach here, but just in case
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


def retry_on_timeout(max_retries: int = 2):
    """Convenience decorator for retrying on timeout errors"""
    return retry_with_backoff(
        max_retries=max_retries,
        initial_delay=2.0,
        retryable_exceptions=(Timeout, ConnectionError)
    )


def retry_on_connection_error(max_retries: int = 3):
    """Convenience decorator for retrying on connection errors"""
    return retry_with_backoff(
        max_retries=max_retries,
        initial_delay=1.0,
        retryable_exceptions=(ConnectionError,)
    )

