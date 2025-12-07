"""
Performance monitoring utilities for Jessica Core
Tracks API call timing, memory usage, and response times
"""

import time
import functools
import logging
import psutil
import os
from typing import Callable, Any, Dict, Optional
from contextlib import contextmanager
from flask import g, request


logger = logging.getLogger('jessica.performance')


class PerformanceMetrics:
    """
    Singleton class to track performance metrics
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize metrics storage"""
        self.api_call_times = []
        self.endpoint_times = {}
        self.memory_samples = []
        self.error_counts = {}
    
    def record_api_call(self, api_name: str, duration: float, success: bool = True):
        """
        Record an API call timing
        
        Args:
            api_name: Name of the API (e.g., 'claude', 'grok', 'ollama')
            duration: Duration in seconds
            success: Whether the call succeeded
        """
        self.api_call_times.append({
            'api': api_name,
            'duration': duration,
            'success': success,
            'timestamp': time.time()
        })
        
        # Keep only last 1000 calls
        if len(self.api_call_times) > 1000:
            self.api_call_times = self.api_call_times[-1000:]
        
        logger.debug(f"API call: {api_name} took {duration:.3f}s (success={success})")
    
    def record_endpoint(self, endpoint: str, duration: float, status_code: int):
        """
        Record an endpoint response time
        
        Args:
            endpoint: Endpoint path
            duration: Duration in seconds
            status_code: HTTP status code
        """
        if endpoint not in self.endpoint_times:
            self.endpoint_times[endpoint] = []
        
        self.endpoint_times[endpoint].append({
            'duration': duration,
            'status_code': status_code,
            'timestamp': time.time()
        })
        
        # Keep only last 100 calls per endpoint
        if len(self.endpoint_times[endpoint]) > 100:
            self.endpoint_times[endpoint] = self.endpoint_times[endpoint][-100:]
    
    def record_memory(self):
        """Record current memory usage"""
        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / 1024 / 1024
        
        self.memory_samples.append({
            'memory_mb': memory_mb,
            'timestamp': time.time()
        })
        
        # Keep only last 100 samples
        if len(self.memory_samples) > 100:
            self.memory_samples = self.memory_samples[-100:]
    
    def record_error(self, error_type: str):
        """
        Record an error occurrence
        
        Args:
            error_type: Type of error
        """
        if error_type not in self.error_counts:
            self.error_counts[error_type] = 0
        self.error_counts[error_type] += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics
        
        Returns:
            Dictionary of performance metrics
        """
        stats = {
            'total_api_calls': len(self.api_call_times),
            'total_errors': sum(self.error_counts.values()),
            'error_breakdown': dict(self.error_counts),
        }
        
        # API call statistics
        if self.api_call_times:
            successful_calls = [c for c in self.api_call_times if c['success']]
            if successful_calls:
                durations = [c['duration'] for c in successful_calls]
                stats['api_calls'] = {
                    'avg_duration': sum(durations) / len(durations),
                    'min_duration': min(durations),
                    'max_duration': max(durations),
                    'success_rate': len(successful_calls) / len(self.api_call_times),
                }
                
                # Per-API statistics
                apis = set(c['api'] for c in successful_calls)
                stats['api_breakdown'] = {}
                for api in apis:
                    api_calls = [c for c in successful_calls if c['api'] == api]
                    api_durations = [c['duration'] for c in api_calls]
                    stats['api_breakdown'][api] = {
                        'count': len(api_calls),
                        'avg_duration': sum(api_durations) / len(api_durations),
                    }
        
        # Endpoint statistics
        if self.endpoint_times:
            stats['endpoints'] = {}
            for endpoint, calls in self.endpoint_times.items():
                durations = [c['duration'] for c in calls]
                stats['endpoints'][endpoint] = {
                    'count': len(calls),
                    'avg_duration': sum(durations) / len(durations),
                    'min_duration': min(durations),
                    'max_duration': max(durations),
                }
        
        # Memory statistics
        if self.memory_samples:
            memory_values = [s['memory_mb'] for s in self.memory_samples]
            stats['memory'] = {
                'current_mb': memory_values[-1],
                'avg_mb': sum(memory_values) / len(memory_values),
                'min_mb': min(memory_values),
                'max_mb': max(memory_values),
            }
        
        return stats


# Global metrics instance
metrics = PerformanceMetrics()


def track_api_call(api_name: str):
    """
    Decorator to track API call timing
    
    Args:
        api_name: Name of the API being called
    
    Usage:
        @track_api_call('claude')
        def call_claude_api(...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = False
            try:
                result = func(*args, **kwargs)
                success = True
                return result
            finally:
                duration = time.time() - start_time
                metrics.record_api_call(api_name, duration, success)
                
                # Log slow API calls
                if duration > 5.0:
                    logger.warning(
                        f"Slow API call detected",
                        extra={
                            'api': api_name,
                            'duration': duration,
                            'slow_call': True
                        }
                    )
        return wrapper
    return decorator


@contextmanager
def track_operation(operation_name: str):
    """
    Context manager to track operation timing
    
    Usage:
        with track_operation('memory_search'):
            # ... do operation ...
    """
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        logger.debug(
            f"Operation completed",
            extra={
                'operation': operation_name,
                'duration': duration
            }
        )


def track_endpoint_performance(func: Callable) -> Callable:
    """
    Decorator to track Flask endpoint performance
    
    Usage:
        @app.route('/chat')
        @track_endpoint_performance
        def chat():
            ...
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Record memory before request
        metrics.record_memory()
        
        # Track request timing
        start_time = time.time()
        response = func(*args, **kwargs)
        duration = time.time() - start_time
        
        # Get status code from response
        status_code = 200
        if hasattr(response, 'status_code'):
            status_code = response.status_code
        elif isinstance(response, tuple):
            status_code = response[1] if len(response) > 1 else 200
        
        # Record metrics
        endpoint = request.path
        metrics.record_endpoint(endpoint, duration, status_code)
        
        # Log slow endpoints
        if duration > 2.0:
            logger.warning(
                f"Slow endpoint detected",
                extra={
                    'endpoint': endpoint,
                    'duration': duration,
                    'status_code': status_code,
                    'slow_endpoint': True
                }
            )
        
        return response
    
    return wrapper

