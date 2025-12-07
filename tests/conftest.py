"""
Pytest configuration and fixtures
Shared test fixtures for all tests
"""

import pytest
import sys
import os
from unittest.mock import Mock, MagicMock

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Mock environment variables for testing"""
    test_env = {
        'ANTHROPIC_API_KEY': 'test-anthropic-key',
        'XAI_API_KEY': 'test-xai-key',
        'GOOGLE_AI_API_KEY': 'test-google-key',
        'MEM0_API_KEY': 'test-mem0-key',
        'GROQ_API_KEY': 'test-groq-key',
    }
    for key, value in test_env.items():
        monkeypatch.setenv(key, value)
    return test_env


@pytest.fixture
def mock_flask_app():
    """Mock Flask app for testing"""
    from flask import Flask
    app = Flask(__name__)
    app.config['TESTING'] = True
    return app


@pytest.fixture
def mock_flask_client(mock_flask_app):
    """Flask test client"""
    return mock_flask_app.test_client()


@pytest.fixture
def mock_requests(mocker):
    """Mock requests.Session for HTTP calls"""
    mock_session = MagicMock()
    mocker.patch('requests.Session', return_value=mock_session)
    return mock_session


@pytest.fixture
def sample_chat_request():
    """Sample chat request data"""
    return {
        'message': 'Hello Jessica',
        'provider': 'local',
        'mode': 'default'
    }


@pytest.fixture
def sample_memory_data():
    """Sample memory data"""
    return {
        'content': 'Test memory content',
        'metadata': {
            'context': 'personal',
            'type': 'test',
            'source': 'pytest'
        }
    }

