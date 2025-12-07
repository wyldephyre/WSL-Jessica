"""
Centralized logging configuration for Jessica Core
Provides structured JSON logging with rotation and performance tracking
"""

import logging
import logging.handlers
import json
import time
import os
from datetime import datetime
from pathlib import Path
from flask import g
from typing import Optional


# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)


class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings
    Makes logs easily parseable for analysis tools
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        # Get request_id from Flask g object or record
        request_id = getattr(record, 'request_id', None)
        if not request_id:
            try:
                from flask import g
                request_id = getattr(g, 'request_id', 'N/A')
            except (RuntimeError, AttributeError):
                request_id = 'N/A'
        
        # Build base log structure
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'request_id': request_id,
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add any extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName', 
                          'levelname', 'levelno', 'lineno', 'module', 'msecs', 
                          'pathname', 'process', 'processName', 'relativeCreated',
                          'thread', 'threadName', 'exc_info', 'exc_text', 'stack_info',
                          'request_id', 'message']:
                log_data[key] = value
        
        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """
    Formatter for console output that's easier to read
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record for human readability"""
        # Get request_id
        request_id = getattr(record, 'request_id', None)
        if not request_id:
            try:
                from flask import g
                request_id = getattr(g, 'request_id', 'N/A')
            except (RuntimeError, AttributeError):
                request_id = 'N/A'
        
        # Color codes for different levels
        colors = {
            'DEBUG': '\033[36m',    # Cyan
            'INFO': '\033[32m',     # Green
            'WARNING': '\033[33m',  # Yellow
            'ERROR': '\033[31m',    # Red
            'CRITICAL': '\033[35m', # Magenta
        }
        reset_color = '\033[0m'
        
        # Get color for this level
        color = colors.get(record.levelname, '')
        
        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        
        # Build log line
        log_line = (
            f"{color}{record.levelname:8s}{reset_color} "
            f"{timestamp} "
            f"[{request_id:8s}] "
            f"{record.name:20s} "
            f"{record.getMessage()}"
        )
        
        # Add exception if present
        if record.exc_info:
            log_line += f"\n{self.formatException(record.exc_info)}"
        
        return log_line


def setup_logging(
    log_level: str = 'INFO',
    json_logs: bool = True,
    console_output: bool = True,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Setup logging configuration for Jessica Core
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to use JSON format for file logs
        console_output: Whether to output to console
        log_file: Optional specific log file path (defaults to logs/jessica-core.log)
    
    Returns:
        Configured logger instance
    """
    # Get root logger
    logger = logging.getLogger('jessica')
    logger.setLevel(getattr(logging, log_level.upper()))
    logger.handlers.clear()
    
    # Console handler (human-readable)
    if console_output:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(HumanReadableFormatter())
        logger.addHandler(console_handler)
    
    # File handler with rotation (JSON format)
    if log_file is None:
        log_file = LOGS_DIR / 'jessica-core.log'
    
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10,  # Keep 10 old files
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    
    if json_logs:
        file_handler.setFormatter(JSONFormatter())
    else:
        file_handler.setFormatter(HumanReadableFormatter())
    
    logger.addHandler(file_handler)
    
    # Error file handler (separate file for errors only)
    error_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / 'jessica-errors.log',
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter() if json_logs else HumanReadableFormatter())
    logger.addHandler(error_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a child logger for a specific module
    
    Args:
        name: Module name
    
    Returns:
        Logger instance
    """
    return logging.getLogger(f'jessica.{name}')

