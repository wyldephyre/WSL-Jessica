"""
Unit tests for memory functions
Tests recall_memory_dual and store_memory_dual
"""

import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMemoryFunctions:
    """Test cases for memory functions"""

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_search_memories')
    def test_recall_memory_dual_success(self, mock_mem0_search, mock_http):
        """Test successful recall from both local and cloud"""
        from jessica_core import recall_memory_dual
        
        # Mock local memory response
        mock_http.post.return_value.status_code = 200
        mock_http.post.return_value.json.return_value = {
            "documents": ["Local memory 1", "Local memory 2"]
        }
        
        # Mock cloud memory response
        mock_mem0_search.return_value = ["Cloud memory 1", "Cloud memory 2"]
        
        result = recall_memory_dual("test query")
        
        assert "local" in result
        assert "cloud" in result
        assert len(result["local"]) == 2
        assert len(result["cloud"]) == 2
        assert result["local"][0] == "Local memory 1"
        assert result["cloud"][0] == "Cloud memory 1"

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_search_memories')
    def test_recall_memory_dual_local_failure(self, mock_mem0_search, mock_http):
        """Test recall when local memory fails but cloud succeeds"""
        from jessica_core import recall_memory_dual
        
        # Mock local memory failure
        mock_http.post.side_effect = Exception("Local memory down")
        
        # Mock cloud memory success
        mock_mem0_search.return_value = ["Cloud memory 1"]
        
        result = recall_memory_dual("test query")
        
        assert result["local"] == []
        assert len(result["cloud"]) == 1

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_search_memories')
    def test_recall_memory_dual_cloud_failure(self, mock_mem0_search, mock_http):
        """Test recall when cloud memory fails but local succeeds"""
        from jessica_core import recall_memory_dual
        
        # Mock local memory success
        mock_http.post.return_value.status_code = 200
        mock_http.post.return_value.json.return_value = {
            "documents": ["Local memory 1"]
        }
        
        # Mock cloud memory failure
        mock_mem0_search.side_effect = Exception("Cloud memory down")
        
        result = recall_memory_dual("test query")
        
        assert len(result["local"]) == 1
        assert result["cloud"] == []

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_search_memories')
    def test_recall_memory_dual_both_failure(self, mock_mem0_search, mock_http):
        """Test recall when both local and cloud fail"""
        from jessica_core import recall_memory_dual
        
        # Mock both failures
        mock_http.post.side_effect = Exception("Local memory down")
        mock_mem0_search.side_effect = Exception("Cloud memory down")
        
        result = recall_memory_dual("test query")
        
        assert result["local"] == []
        assert result["cloud"] == []

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_add_memory')
    @patch('threading.Thread')
    def test_store_memory_dual(self, mock_thread, mock_mem0_add, mock_http):
        """Test memory storage to both local and cloud"""
        from jessica_core import store_memory_dual
        
        # Mock responses
        mock_http.post.return_value.status_code = 200
        mock_mem0_add.return_value = {"success": True}
        
        # Call function
        store_memory_dual("user message", "response text", "local")
        
        # Verify thread was started for non-blocking storage
        assert mock_thread.called

    @patch('jessica_core.http_session')
    @patch('jessica_core.mem0_search_memories')
    def test_recall_memory_dict_format(self, mock_mem0_search, mock_http):
        """Test handling of dict-format memory from cloud"""
        from jessica_core import recall_memory_dual
        
        # Mock local memory
        mock_http.post.return_value.status_code = 200
        mock_http.post.return_value.json.return_value = {
            "documents": ["Local memory"]
        }
        
        # Mock cloud memory with dict format
        mock_mem0_search.return_value = [
            {"memory": "Memory content 1"},
            {"text": "Memory content 2"},
            {"content": "Memory content 3"}
        ]
        
        result = recall_memory_dual("test query")
        
        assert len(result["cloud"]) == 3
        assert result["cloud"][0] == "Memory content 1"
        assert result["cloud"][1] == "Memory content 2"
        assert result["cloud"][2] == "Memory content 3"


class TestMem0Functions:
    """Test cases for Mem0 API functions"""

    @patch('jessica_core.MEM0_API_KEY', 'test-key')
    @patch('jessica_core.http_session')
    def test_mem0_search_memories_success(self, mock_http):
        """Test successful Mem0 search"""
        from jessica_core import mem0_search_memories
        
        # Mock successful API response
        mock_http.post.return_value.status_code = 200
        mock_http.post.return_value.json.return_value = {
            "results": ["Memory 1", "Memory 2"]
        }
        
        result = mem0_search_memories("test query")
        
        assert len(result) == 2
        assert result[0] == "Memory 1"

    @patch('jessica_core.MEM0_API_KEY', '')
    def test_mem0_search_no_api_key(self):
        """Test Mem0 search with no API key"""
        from jessica_core import mem0_search_memories
        
        result = mem0_search_memories("test query")
        
        # Should return empty list when no API key
        assert result == []

    @patch('jessica_core.MEM0_API_KEY', 'test-key')
    @patch('jessica_core.http_session')
    def test_mem0_search_api_failure(self, mock_http):
        """Test Mem0 search when API fails"""
        from jessica_core import mem0_search_memories
        
        # Mock API failure
        mock_http.post.side_effect = Exception("API Error")
        
        result = mem0_search_memories("test query")
        
        # Should return empty list on error
        assert result == []

    @patch('jessica_core.MEM0_API_KEY', 'test-key')
    @patch('jessica_core.http_session')
    def test_mem0_add_memory_success(self, mock_http):
        """Test successful memory addition to Mem0"""
        from jessica_core import mem0_add_memory
        
        # Mock successful API response
        mock_http.post.return_value.status_code = 200
        mock_http.post.return_value.json.return_value = {
            "success": True,
            "memory_id": "test-123"
        }
        
        result = mem0_add_memory("Test memory content")
        
        assert result["success"] is True
        assert "memory_id" in result

    @patch('jessica_core.MEM0_API_KEY', '')
    def test_mem0_add_memory_no_api_key(self):
        """Test Mem0 add with no API key"""
        from jessica_core import mem0_add_memory
        
        result = mem0_add_memory("Test memory")
        
        # Should return error dict when no API key
        assert "error" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

