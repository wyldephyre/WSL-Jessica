"""
Tests for logging and performance monitoring
Phase 1.3: Logging & Observability
"""

import pytest
import os
import json
import time
import logging
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logging_config import setup_logging, JSONFormatter, HumanReadableFormatter, get_logger
from performance_monitor import PerformanceMetrics, track_api_call, track_operation


class TestLoggingConfig:
    """Test logging configuration and formatters"""
    
    def test_json_formatter(self):
        """Test that JSONFormatter produces valid JSON"""
        formatter = JSONFormatter()
        
        # Create a log record
        logger = logging.getLogger('test')
        logger.setLevel(logging.INFO)
        
        record = logger.makeRecord(
            'test', logging.INFO, __file__, 1,
            'Test message', None, None
        )
        record.request_id = 'test-123'
        
        # Format the record
        formatted = formatter.format(record)
        
        # Should be valid JSON
        data = json.loads(formatted)
        
        assert data['level'] == 'INFO'
        assert data['message'] == 'Test message'
        assert data['request_id'] == 'test-123'
        assert 'timestamp' in data
    
    def test_human_readable_formatter(self):
        """Test that HumanReadableFormatter produces readable output"""
        formatter = HumanReadableFormatter()
        
        logger = logging.getLogger('test')
        record = logger.makeRecord(
            'test', logging.INFO, __file__, 1,
            'Test message', None, None
        )
        record.request_id = 'test-123'
        
        formatted = formatter.format(record)
        
        # Should contain key elements
        assert 'INFO' in formatted
        assert 'Test message' in formatted
        assert 'test-123' in formatted
    
    def test_setup_logging_creates_log_dir(self, tmp_path):
        """Test that setup_logging creates log directory"""
        # This test verifies the function doesn't crash
        logger = setup_logging(log_level='DEBUG', console_output=False)
        
        assert logger is not None
        assert logger.level == logging.DEBUG
    
    def test_get_logger(self):
        """Test get_logger returns properly named logger"""
        logger = get_logger('test_module')
        
        assert logger.name == 'jessica.test_module'


class TestPerformanceMetrics:
    """Test performance monitoring"""
    
    def test_metrics_singleton(self):
        """Test that PerformanceMetrics is a singleton"""
        metrics1 = PerformanceMetrics()
        metrics2 = PerformanceMetrics()
        
        assert metrics1 is metrics2
    
    def test_record_api_call(self):
        """Test API call recording"""
        metrics = PerformanceMetrics()
        initial_count = len(metrics.api_call_times)
        
        metrics.record_api_call('test_api', 1.5, success=True)
        
        assert len(metrics.api_call_times) == initial_count + 1
        
        last_call = metrics.api_call_times[-1]
        assert last_call['api'] == 'test_api'
        assert last_call['duration'] == 1.5
        assert last_call['success'] is True
    
    def test_record_endpoint(self):
        """Test endpoint recording"""
        metrics = PerformanceMetrics()
        
        metrics.record_endpoint('/test', 0.5, 200)
        
        assert '/test' in metrics.endpoint_times
        assert len(metrics.endpoint_times['/test']) == 1
        
        last_call = metrics.endpoint_times['/test'][-1]
        assert last_call['duration'] == 0.5
        assert last_call['status_code'] == 200
    
    def test_record_memory(self):
        """Test memory recording"""
        metrics = PerformanceMetrics()
        initial_count = len(metrics.memory_samples)
        
        metrics.record_memory()
        
        assert len(metrics.memory_samples) == initial_count + 1
        assert 'memory_mb' in metrics.memory_samples[-1]
        assert 'timestamp' in metrics.memory_samples[-1]
    
    def test_record_error(self):
        """Test error recording"""
        metrics = PerformanceMetrics()
        
        metrics.record_error('TestError')
        metrics.record_error('TestError')
        metrics.record_error('OtherError')
        
        assert metrics.error_counts['TestError'] == 2
        assert metrics.error_counts['OtherError'] == 1
    
    def test_get_stats(self):
        """Test statistics generation"""
        metrics = PerformanceMetrics()
        
        # Add some test data
        metrics.record_api_call('test_api', 1.0, success=True)
        metrics.record_api_call('test_api', 2.0, success=True)
        metrics.record_api_call('test_api', 1.5, success=False)
        metrics.record_endpoint('/test', 0.5, 200)
        metrics.record_memory()
        metrics.record_error('TestError')
        
        stats = metrics.get_stats()
        
        # Check structure
        assert 'total_api_calls' in stats
        assert 'total_errors' in stats
        assert 'error_breakdown' in stats
        
        # Check values
        assert stats['total_errors'] == 1
        assert stats['error_breakdown']['TestError'] == 1
    
    def test_rolling_window_api_calls(self):
        """Test that API calls are limited to 1000"""
        metrics = PerformanceMetrics()
        
        # Record 1100 calls
        for i in range(1100):
            metrics.record_api_call('test', 1.0, success=True)
        
        # Should only keep last 1000
        assert len(metrics.api_call_times) == 1000
    
    def test_rolling_window_endpoints(self):
        """Test that endpoint calls are limited to 100 per endpoint"""
        metrics = PerformanceMetrics()
        
        # Record 150 calls to same endpoint
        for i in range(150):
            metrics.record_endpoint('/test', 1.0, 200)
        
        # Should only keep last 100
        assert len(metrics.endpoint_times['/test']) == 100


class TestPerformanceDecorators:
    """Test performance tracking decorators"""
    
    def test_track_api_call_decorator(self):
        """Test that track_api_call decorator records timing"""
        metrics = PerformanceMetrics()
        initial_count = len(metrics.api_call_times)
        
        @track_api_call('test_decorator')
        def test_function():
            time.sleep(0.1)
            return 'success'
        
        result = test_function()
        
        assert result == 'success'
        assert len(metrics.api_call_times) > initial_count
        
        # Find our call
        our_calls = [c for c in metrics.api_call_times if c['api'] == 'test_decorator']
        assert len(our_calls) > 0
        
        last_call = our_calls[-1]
        assert last_call['duration'] >= 0.1  # Should be at least 100ms
        assert last_call['success'] is True
    
    def test_track_api_call_decorator_on_failure(self):
        """Test that decorator records failures"""
        metrics = PerformanceMetrics()
        
        @track_api_call('test_failure')
        def failing_function():
            raise ValueError("Test error")
        
        with pytest.raises(ValueError):
            failing_function()
        
        # Should still record the call as failed
        our_calls = [c for c in metrics.api_call_times if c['api'] == 'test_failure']
        assert len(our_calls) > 0
        assert our_calls[-1]['success'] is False
    
    def test_track_operation_context_manager(self):
        """Test track_operation context manager"""
        # This mainly tests that it doesn't crash
        with track_operation('test_operation'):
            time.sleep(0.05)
        
        # If we get here without exception, test passes


class TestMetricsStats:
    """Test metrics statistics calculations"""
    
    def test_api_stats_calculation(self):
        """Test API statistics are calculated correctly"""
        metrics = PerformanceMetrics()
        
        # Clear previous data
        metrics.api_call_times = []
        
        # Add known data
        metrics.record_api_call('test', 1.0, success=True)
        metrics.record_api_call('test', 2.0, success=True)
        metrics.record_api_call('test', 3.0, success=True)
        
        stats = metrics.get_stats()
        
        assert stats['api_calls']['avg_duration'] == 2.0
        assert stats['api_calls']['min_duration'] == 1.0
        assert stats['api_calls']['max_duration'] == 3.0
        assert stats['api_calls']['success_rate'] == 1.0
    
    def test_per_api_breakdown(self):
        """Test per-API breakdown statistics"""
        metrics = PerformanceMetrics()
        metrics.api_call_times = []
        
        # Add calls for different APIs
        metrics.record_api_call('claude', 2.0, success=True)
        metrics.record_api_call('claude', 3.0, success=True)
        metrics.record_api_call('grok', 1.0, success=True)
        
        stats = metrics.get_stats()
        
        assert 'api_breakdown' in stats
        assert 'claude' in stats['api_breakdown']
        assert 'grok' in stats['api_breakdown']
        
        claude_stats = stats['api_breakdown']['claude']
        assert claude_stats['count'] == 2
        assert claude_stats['avg_duration'] == 2.5
        
        grok_stats = stats['api_breakdown']['grok']
        assert grok_stats['count'] == 1
        assert grok_stats['avg_duration'] == 1.0
    
    def test_endpoint_stats(self):
        """Test endpoint statistics"""
        metrics = PerformanceMetrics()
        metrics.endpoint_times = {}
        
        metrics.record_endpoint('/test', 1.0, 200)
        metrics.record_endpoint('/test', 2.0, 200)
        metrics.record_endpoint('/test', 3.0, 500)
        
        stats = metrics.get_stats()
        
        assert 'endpoints' in stats
        assert '/test' in stats['endpoints']
        
        endpoint_stats = stats['endpoints']['/test']
        assert endpoint_stats['count'] == 3
        assert endpoint_stats['avg_duration'] == 2.0
        assert endpoint_stats['min_duration'] == 1.0
        assert endpoint_stats['max_duration'] == 3.0
    
    def test_memory_stats(self):
        """Test memory statistics"""
        metrics = PerformanceMetrics()
        metrics.memory_samples = []
        
        # Add fake memory samples
        metrics.memory_samples = [
            {'memory_mb': 100, 'timestamp': time.time()},
            {'memory_mb': 110, 'timestamp': time.time()},
            {'memory_mb': 105, 'timestamp': time.time()},
        ]
        
        stats = metrics.get_stats()
        
        assert 'memory' in stats
        assert stats['memory']['current_mb'] == 105
        assert stats['memory']['avg_mb'] == 105
        assert stats['memory']['min_mb'] == 100
        assert stats['memory']['max_mb'] == 110


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

