"""
Integration tests for /chat endpoint
Tests the main chat endpoint with various scenarios
"""

import pytest
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestChatEndpoint:
    """Integration tests for /chat endpoint"""

    @pytest.fixture
    def app(self):
        """Create Flask app for testing"""
        from jessica_core import app
        app.config['TESTING'] = True
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_chat_missing_json(self, client):
        """Test chat endpoint with no JSON body"""
        response = client.post('/chat')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data
        assert data["error_code"] == "VALIDATION_ERROR"

    def test_chat_missing_message_field(self, client):
        """Test chat endpoint with missing message field"""
        response = client.post(
            '/chat',
            data=json.dumps({'provider': 'local'}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data
        assert data["error_code"] == "VALIDATION_ERROR"

    def test_chat_empty_message(self, client):
        """Test chat endpoint with empty message"""
        response = client.post(
            '/chat',
            data=json.dumps({'message': '   '}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    @patch('jessica_core.recall_memory_dual')
    @patch('jessica_core.call_local_ollama')
    @patch('jessica_core.store_memory_dual')
    def test_chat_local_provider_success(self, mock_store, mock_ollama, mock_recall, client):
        """Test successful chat with local provider"""
        # Mock memory recall
        mock_recall.return_value = {"local": [], "cloud": []}
        
        # Mock Ollama response
        mock_ollama.return_value = "Hello! How can I help you?"
        
        response = client.post(
            '/chat',
            data=json.dumps({'message': 'Hello', 'provider': 'local'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "response" in data
        assert data["response"] == "Hello! How can I help you?"
        assert data["routing"]["provider"] == "local"
        assert "request_id" in data

    @patch('jessica_core.recall_memory_dual')
    @patch('jessica_core.call_claude_api')
    @patch('jessica_core.store_memory_dual')
    def test_chat_claude_provider(self, mock_store, mock_claude, mock_recall, client):
        """Test chat with Claude provider"""
        # Mock memory recall
        mock_recall.return_value = {"local": [], "cloud": []}
        
        # Mock Claude response
        mock_claude.return_value = "Claude's response"
        
        response = client.post(
            '/chat',
            data=json.dumps({'message': 'analyze this', 'provider': 'claude'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["routing"]["provider"] == "claude"

    @patch('jessica_core.recall_memory_dual')
    @patch('jessica_core.call_grok_api')
    @patch('jessica_core.store_memory_dual')
    def test_chat_grok_provider(self, mock_store, mock_grok, mock_recall, client):
        """Test chat with Grok provider"""
        # Mock memory recall
        mock_recall.return_value = {"local": [], "cloud": []}
        
        # Mock Grok response
        mock_grok.return_value = "Grok's response"
        
        response = client.post(
            '/chat',
            data=json.dumps({'message': 'search for', 'provider': 'grok'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["routing"]["provider"] == "grok"

    @patch('jessica_core.recall_memory_dual')
    @patch('jessica_core.call_local_ollama')
    @patch('jessica_core.store_memory_dual')
    def test_chat_with_mode(self, mock_store, mock_ollama, mock_recall, client):
        """Test chat with different modes"""
        mock_recall.return_value = {"local": [], "cloud": []}
        mock_ollama.return_value = "Response"
        
        response = client.post(
            '/chat',
            data=json.dumps({
                'message': 'test',
                'provider': 'local',
                'mode': 'business'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "response" in data

    @patch('jessica_core.recall_memory_dual')
    def test_chat_routing_tier_detection(self, mock_recall, client):
        """Test that routing tier is correctly detected"""
        mock_recall.return_value = {"local": [], "cloud": []}
        
        with patch('jessica_core.call_grok_api', return_value="Response"):
            response = client.post(
                '/chat',
                data=json.dumps({'message': 'search for information'}),
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data["routing"]["provider"] == "grok"
            assert "Research task" in data["routing"]["reason"]

    @patch('jessica_core.recall_memory_dual')
    @patch('jessica_core.call_local_ollama')
    @patch('jessica_core.store_memory_dual')
    def test_chat_with_memory_context(self, mock_store, mock_ollama, mock_recall, client):
        """Test chat includes memory context"""
        # Mock memory with content
        mock_recall.return_value = {
            "local": ["Previous conversation 1", "Previous conversation 2"],
            "cloud": ["Cloud memory 1"]
        }
        mock_ollama.return_value = "Response with context"
        
        response = client.post(
            '/chat',
            data=json.dumps({'message': 'continue our discussion'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        # Verify memory was recalled
        mock_recall.assert_called_once()

    def test_chat_special_characters(self, client):
        """Test chat with special characters in message"""
        with patch('jessica_core.recall_memory_dual', return_value={"local": [], "cloud": []}):
            with patch('jessica_core.call_local_ollama', return_value="Response"):
                response = client.post(
                    '/chat',
                    data=json.dumps({'message': "Test with 'quotes' and \"double quotes\" & symbols!"}),
                    content_type='application/json'
                )
                
                assert response.status_code == 200


class TestAdditionalEndpoints:
    """Tests for additional endpoints"""

    @pytest.fixture
    def app(self):
        """Create Flask app for testing"""
        from jessica_core import app
        app.config['TESTING'] = True
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    @patch('jessica_core.http_session')
    def test_status_endpoint(self, mock_http, client):
        """Test /status endpoint"""
        # Mock Ollama status
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_http.get.return_value = mock_response
        
        response = client.get('/status')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "local_ollama" in data
        assert "local_memory" in data
        assert "claude_api" in data

    def test_modes_endpoint(self, client):
        """Test /modes endpoint"""
        response = client.get('/modes')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "available_modes" in data
        assert "default" in data["available_modes"]
        assert "business" in data["available_modes"]

    def test_memory_cloud_search_endpoint(self, client):
        """Test /memory/cloud/search endpoint"""
        with patch('jessica_core.mem0_search_memories', return_value=["Memory 1"]):
            response = client.post(
                '/memory/cloud/search',
                data=json.dumps({'query': 'test'}),
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "results" in data

    def test_memory_cloud_search_no_json(self, client):
        """Test /memory/cloud/search with no JSON"""
        response = client.post('/memory/cloud/search')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["error_code"] == "VALIDATION_ERROR"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

