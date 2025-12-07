"""
Unit tests for routing logic
Tests the detect_routing_tier function
"""

import pytest
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jessica_core import detect_routing_tier


class TestDetectRoutingTier:
    """Test cases for routing tier detection"""

    def test_explicit_directive_grok(self):
        """Test explicit grok directive"""
        provider, tier, reason = detect_routing_tier("test message", "grok")
        assert provider == "grok"
        assert tier == 2
        assert "User requested Grok" in reason

    def test_explicit_directive_claude(self):
        """Test explicit claude directive"""
        provider, tier, reason = detect_routing_tier("test message", "claude")
        assert provider == "claude"
        assert tier == 2
        assert "User requested Claude" in reason

    def test_explicit_directive_gemini(self):
        """Test explicit gemini directive"""
        provider, tier, reason = detect_routing_tier("test message", "gemini")
        assert provider == "gemini"
        assert tier == 2
        assert "User requested Gemini" in reason

    def test_explicit_directive_local(self):
        """Test explicit local directive"""
        provider, tier, reason = detect_routing_tier("test message", "local")
        assert provider == "local"
        assert tier == 2
        assert "User requested local" in reason

    def test_research_keywords(self):
        """Test research keyword detection"""
        research_messages = [
            "search for information about Python",
            "find the latest news on AI",
            "look up documentation for Flask",
            "google what is machine learning",
            "research quantum computing"
        ]
        for msg in research_messages:
            provider, tier, reason = detect_routing_tier(msg)
            assert provider == "grok", f"Failed for message: {msg}"
            assert tier == 1
            assert "Research task" in reason

    def test_complex_reasoning_keywords(self):
        """Test complex reasoning keyword detection"""
        complex_messages = [
            "analyze this problem deeply",
            "explain the reasoning behind quantum mechanics",
            "compare and contrast different approaches",
            "evaluate the pros and cons",
            "think through this carefully"
        ]
        for msg in complex_messages:
            provider, tier, reason = detect_routing_tier(msg)
            assert provider == "claude", f"Failed for message: {msg}"
            assert tier == 1
            assert "Complex reasoning" in reason

    def test_document_keywords(self):
        """Test document/lookup keyword detection"""
        document_messages = [
            "what is the definition of recursion",
            "quick lookup for HTTP status codes",
            "fact check this statement",
            "simple query about Python syntax"
        ]
        for msg in document_messages:
            provider, tier, reason = detect_routing_tier(msg)
            assert provider == "gemini", f"Failed for message: {msg}"
            assert tier == 1
            assert "Document/lookup" in reason

    def test_default_routing(self):
        """Test default routing to local"""
        default_messages = [
            "Hello Jessica",
            "How are you today?",
            "Tell me a joke",
            "What's the weather like?"
        ]
        for msg in default_messages:
            provider, tier, reason = detect_routing_tier(msg)
            assert provider == "local", f"Failed for message: {msg}"
            assert tier == 1
            assert "Standard task" in reason

    def test_case_insensitive(self):
        """Test that routing is case-insensitive"""
        test_cases = [
            ("SEARCH for something", "grok"),
            ("Analyze THIS PROBLEM", "claude"),
            ("DEFINE recursion", "gemini")
        ]
        for msg, expected_provider in test_cases:
            provider, _, _ = detect_routing_tier(msg)
            assert provider == expected_provider

    def test_empty_message(self):
        """Test behavior with empty message"""
        provider, tier, reason = detect_routing_tier("")
        assert provider == "local"
        assert tier == 1

    def test_keyword_priority(self):
        """Test that explicit directives override keyword detection"""
        # Message has research keywords but explicit local directive
        provider, tier, reason = detect_routing_tier("search for something", "local")
        assert provider == "local"
        assert tier == 2  # Explicit directive uses tier 2


@pytest.mark.parametrize("message,expected_provider", [
    ("find me some information", "grok"),
    ("analyze this deeply", "claude"),
    ("define this term", "gemini"),
    ("hello there", "local"),
])
def test_routing_parametrized(message, expected_provider):
    """Parametrized test for various routing scenarios"""
    provider, _, _ = detect_routing_tier(message)
    assert provider == expected_provider

