"""
Command Parser Module
Detects explicit routing commands and action commands from user messages.
"""

import re
from typing import Optional, Dict, Tuple

# Provider names for matching
PROVIDER_NAMES = {
    "claude": ["claude", "anthropic"],
    "grok": ["grok", "xai", "x.ai"],
    "gemini": ["gemini", "google ai", "google"],
    "local": ["local", "jessica", "dolphin", "ollama"]
}

# Explicit routing patterns
EXPLICIT_ROUTING_PATTERNS = [
    r"use\s+(\w+)",
    r"switch\s+to\s+(\w+)",
    r"(\w+)\s+for\s+this",
    r"route\s+to\s+(\w+)",
    r"let\s+(\w+)\s+handle",
    r"(\w+)\s+handle\s+this",
    r"i\s+need\s+(\w+)",
    r"(\w+)\s+analysis",
    r"(\w+)\s+mode",
]

# Natural language routing patterns
NATURAL_ROUTING_PATTERNS = {
    "grok": [
        r"research",
        r"web\s+search",
        r"look\s+up",
        r"find\s+out",
        r"what's\s+happening",
        r"current\s+events",
        r"latest\s+news",
        r"investigate",
        r"dig\s+into",
    ],
    "claude": [
        r"complex\s+analysis",
        r"deep\s+dive",
        r"strategy",
        r"plan",
        r"analyze",
        r"break\s+down",
        r"comprehensive",
        r"detailed",
        r"reasoning",
        r"think\s+through",
    ],
    "gemini": [
        r"quick\s+lookup",
        r"definition",
        r"what\s+is",
        r"explain\s+briefly",
        r"summarize",
        r"document",
        r"pdf",
        r"file",
    ],
}

# Action command patterns
ACTION_PATTERNS = {
    "research": [
        r"go\s+out\s+and\s+research",
        r"research\s+(?:this|that|it)",
    ],
}


def detect_explicit_routing(message: str) -> Optional[str]:
    """
    Detect explicit routing commands like "use Claude", "switch to Grok", etc.
    
    Args:
        message: User's message
        
    Returns:
        Provider name if detected, None otherwise
    """
    message_lower = message.lower()
    
    # Check explicit routing patterns
    for pattern in EXPLICIT_ROUTING_PATTERNS:
        matches = re.finditer(pattern, message_lower, re.IGNORECASE)
        for match in matches:
            provider_candidate = match.group(1).lower()
            
            # Check if it matches any provider name
            for provider, names in PROVIDER_NAMES.items():
                if provider_candidate in names or provider_candidate == provider:
                    return provider
    
    return None


def detect_natural_routing(message: str) -> Optional[str]:
    """
    Detect natural language routing patterns.
    
    Args:
        message: User's message
        
    Returns:
        Provider name if detected, None otherwise
    """
    message_lower = message.lower()
    
    # Check natural language patterns
    for provider, patterns in NATURAL_ROUTING_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return provider
    
    return None


def detect_action_command(message: str) -> Optional[Dict[str, str]]:
    """
    Detect action commands like "create Google sheet", "research X", etc.
    
    Args:
        message: User's message
        
    Returns:
        Dict with 'type' and 'message' if action detected, None otherwise
    """
    message_lower = message.lower()
    
    for action_type, patterns in ACTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return {
                    "type": action_type,
                    "message": message
                }
    
    return None


def extract_command_intent(message: str) -> Dict:
    """
    Main entry point for command parsing.
    Extracts routing and action information from user message.
    
    Args:
        message: User's message
        
    Returns:
        Dict with routing and action information:
        {
            "routing": {
                "provider": str | None,
                "reason": str,
                "command_type": "explicit" | "natural" | "action" | "keyword" | "default"
            },
            "action": {
                "type": str | None,
                "message": str
            }
        }
    """
    result = {
        "routing": {
            "provider": None,
            "reason": "",
            "command_type": "default"
        },
        "action": None
    }
    
    # Check for explicit routing first (highest priority)
    explicit_provider = detect_explicit_routing(message)
    if explicit_provider:
        result["routing"]["provider"] = explicit_provider
        result["routing"]["reason"] = f"Explicit routing command detected: {explicit_provider}"
        result["routing"]["command_type"] = "explicit"
        return result
    
    # Check for action commands
    action = detect_action_command(message)
    if action:
        result["action"] = action
        result["routing"]["command_type"] = "action"
        # Action commands may imply routing (e.g., research → grok)
        # But we'll let the main routing logic handle keyword-based routing
        return result
    
    # Check for natural language routing
    natural_provider = detect_natural_routing(message)
    if natural_provider:
        result["routing"]["provider"] = natural_provider
        result["routing"]["reason"] = f"Natural language routing detected: {natural_provider}"
        result["routing"]["command_type"] = "natural"
        return result
    
    # No command detected - will fall back to keyword-based routing
    result["routing"]["command_type"] = "keyword"
    result["routing"]["reason"] = "No explicit command - using keyword-based routing"
    
    return result

