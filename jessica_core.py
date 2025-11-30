import requests
import os
import hashlib
import threading
import logging
import time
from flask import Flask, request, jsonify
from functools import lru_cache
from typing import Optional, Dict, List, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Connection pooling for HTTP requests
http_session = requests.Session()

# =============================================================================
# SERVICE ENDPOINTS
# =============================================================================
OLLAMA_URL = "http://localhost:11434"
WHISPER_URL = "http://localhost:5000"
MEMORY_URL = "http://localhost:5001"

# =============================================================================
# API KEYS (from environment)
# =============================================================================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
XAI_API_KEY = os.getenv("XAI_API_KEY")
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
MEM0_API_KEY = os.getenv("MEM0_API_KEY")

# =============================================================================
# MEM0 CONFIGURATION
# =============================================================================
MEM0_BASE_URL = "https://api.mem0.ai/v1"
MEM0_USER_ID = "PhyreBug"

# =============================================================================
# CONSTANTS
# =============================================================================
DEFAULT_MAX_TOKENS = 2048
MEMORY_TRUNCATE_LENGTH = 200
DEFAULT_OLLAMA_MODEL = "dolphin-llama3:8b"

# Timeouts (configurable via environment variables)
API_TIMEOUT = int(os.getenv("API_TIMEOUT", "60"))
LOCAL_SERVICE_TIMEOUT = int(os.getenv("LOCAL_SERVICE_TIMEOUT", "5"))
HEALTH_CHECK_TIMEOUT = int(os.getenv("HEALTH_CHECK_TIMEOUT", "2"))
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))
MEM0_TIMEOUT = int(os.getenv("MEM0_TIMEOUT", "30"))

# =============================================================================
# SPECIALIZED SYSTEM PROMPTS
# =============================================================================
GROK_SYSTEM_PROMPT = """You are part of Jessica, an AI cognitive prosthetic for a 100% disabled Marine Corps veteran with ADHD, PTSD, TBI, and Bipolar 2. Your specific role is RESEARCH and CURRENT INFORMATION.

WHEN YOU'RE CALLED:
Jessica's routing system sends you queries about:
- Current events, news, latest developments
- Real-time information lookup
- Research tasks requiring web search
- "What's happening with X?" type questions
- Investigations that need fresh data

YOUR COMMUNICATION STYLE:
- Direct and efficient (token conservation matters)
- No corporate HR language or disclaimers
- Marine-grade straight talk
- ADHD-aware: One main point at a time
- "Kind not Nice" - honest guidance over comfort

YOUR STRENGTHS (Why Jessica Routes to You):
- Real-time web access and current information
- Fast research and synthesis
- Pattern recognition across sources
- No knowledge cutoff limitations
- X/Twitter integration for breaking news

CRITICAL RULES:
1. Cite sources when providing factual claims
2. Distinguish between verified facts and speculation
3. If you don't know, say so (don't hallucinate)
4. Present multiple perspectives on controversial topics
5. Flag outdated information if you detect it

OUTPUT FORMAT:
- Lead with the answer/finding
- Supporting details in bullets if needed
- Sources at end
- If research is inconclusive, say why

VETERAN CONTEXT:
User is a disabled Marine veteran building a media empire (WyldePhyre Media Group) and transmedia IP (Nexus Arcanum). Research requests may relate to:
- Creative industry trends
- Veteran entrepreneurship
- ADHD/PTSD management strategies  
- Blockchain/crypto (for $PHYRE token)
- Media production techniques

Never talk down to him. He's built a 4-division company with a broken brain - he's competent, just needs research support.

Remember: You're Jessica's research specialist. Provide intel, not therapy. Facts, not feelings.

For the forgotten 99%, we rise. 🔥"""

GEMINI_SYSTEM_PROMPT = """You are part of Jessica, an AI cognitive prosthetic for a 100% disabled Marine Corps veteran with ADHD, PTSD, TBI, and Bipolar 2. Your specific role is QUICK LOOKUPS and DOCUMENT PROCESSING.

WHEN YOU'RE CALLED:
Jessica's routing system sends you queries about:
- Document summarization
- PDF/file content extraction  
- Quick definitions or explanations
- "What is X?" simple lookups
- Brief factual answers that don't need deep reasoning

YOUR COMMUNICATION STYLE:
- Concise and to-the-point
- No fluff or filler
- ADHD-optimized: Get to the answer fast
- No corporate disclaimers
- Marine-grade efficiency

YOUR STRENGTHS (Why Jessica Routes to You):
- Fast response times
- Document/PDF processing
- Multimodal understanding (text + images)
- Efficient for simple queries
- Good balance of speed and accuracy

CRITICAL RULES:
1. Keep answers SHORT unless asked for detail
2. If you need to process a document, extract key points only
3. For definitions: 1-2 sentence answer + example if helpful
4. If query is actually complex, flag it: "This needs deeper analysis - suggest routing to Claude"
5. Never make up information - say "I don't have access to that" if true

OUTPUT FORMAT:
- Answer first (1-3 sentences)
- Details/context in bullets only if needed
- If summarizing: 3-5 bullet points max
- For documents: Executive summary style

VETERAN CONTEXT:
User manages:
- WyldePhyre Media Group (4 divisions: Creator's Fyre, Talent & Marketing, Media/Publishing/Radio, Development Studio)
- Nexus Arcanum (transmedia IP: novels, tabletop RPG, video game)
- Personal life with executive dysfunction challenges

He needs FAST answers to keep moving. Don't slow him down with over-explanation.

ADHD ACCOMMODATION:
- One clear answer at a time
- No walls of text
- If you must provide multiple points, number them
- Use bold for key terms sparingly

Remember: You're Jessica's speed specialist. Fast, accurate, concise. Move him forward.

For the forgotten 99%, we rise. 🔥"""

# =============================================================================
# ROUTING KEYWORDS (optimized as sets for O(1) lookup)
# =============================================================================
RESEARCH_KEYWORDS = {
    "research", "look up", "find out", "what's happening", "current", 
    "news", "latest", "search", "investigate", "dig into"
}

COMPLEX_REASONING_KEYWORDS = {
    "analyze", "strategy", "plan", "complex", "detailed", "comprehensive",
    "deep dive", "break down", "explain thoroughly", "compare", "evaluate",
    "business decision", "architecture", "design"
}

DOCUMENT_KEYWORDS = {
    "summarize", "document", "pdf", "file", "extract", "quick lookup",
    "definition", "what is", "explain briefly"
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def detect_routing_tier(message: str, explicit_directive: str = None) -> tuple:
    """Three-tier routing logic (optimized)"""
    # Handle explicit directives first (fast path)
    if explicit_directive:
        directive_map = {
            "claude": ("claude", 2, "User requested Claude"),
            "grok": ("grok", 2, "User requested Grok"),
            "gemini": ("gemini", 2, "User requested Gemini"),
            "local": ("local", 2, "User requested local processing")
        }
        return directive_map.get(explicit_directive, ("local", 1, "Standard task - using local Dolphin"))
    
    # Optimized keyword detection - check substring matches efficiently
    # Convert to lowercase once and reuse
    message_lower = message.lower()
    
    # Check each keyword set (early exit on first match)
    for kw in RESEARCH_KEYWORDS:
        if kw in message_lower:
            return ("grok", 1, "Research task detected - using Grok for web access")
    
    for kw in COMPLEX_REASONING_KEYWORDS:
        if kw in message_lower:
            return ("claude", 1, "Complex reasoning detected - using Claude")
    
    for kw in DOCUMENT_KEYWORDS:
        if kw in message_lower:
            return ("gemini", 1, "Document/lookup task - using Gemini")
    
    return ("local", 1, "Standard task - using local Dolphin")


def call_local_ollama(prompt: str, model: str = DEFAULT_OLLAMA_MODEL) -> str:
    """Call local Ollama with Dolphin model"""
    try:
        response = http_session.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=OLLAMA_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        return data.get('response', 'Error: No response from local model')
    except Exception as e:
        return f"Error calling local Ollama: {str(e)}"


def call_claude_api(prompt: str, system_prompt: str = "") -> str:
    """Call Claude API for complex reasoning"""
    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY not configured"
    
    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": DEFAULT_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = http_session.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=API_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        if "content" in data and len(data["content"]) > 0:
            return data["content"][0]["text"]
        return "Error: Unexpected Claude response format"
    except Exception as e:
        return f"Error calling Claude API: {str(e)}"


def call_grok_api(prompt: str, system_prompt: str = "") -> str:
    """Call Grok API for research/real-time info"""
    if not XAI_API_KEY:
        return "Error: XAI_API_KEY not configured"
    
    try:
        headers = {
            "Authorization": f"Bearer {XAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": "grok-beta",
            "messages": messages,
            "max_tokens": DEFAULT_MAX_TOKENS
        }
        
        response = http_session.post(
            "https://api.x.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=API_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        return "Error: Unexpected Grok response format"
    except Exception as e:
        return f"Error calling Grok API: {str(e)}"


def call_gemini_api(prompt: str, system_prompt: str = "") -> str:
    """Call Gemini API for quick lookups and document tasks"""
    if not GOOGLE_AI_API_KEY:
        return "Error: GOOGLE_AI_API_KEY not configured"
    
    try:
        # Gemini doesn't have separate system role, so prepend system_prompt to prompt if provided
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_AI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
        
        response = http_session.post(url, json=payload, timeout=API_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return "Error: Unexpected Gemini response format"
    except Exception as e:
        return f"Error calling Gemini API: {str(e)}"


# =============================================================================
# MEM0 FUNCTIONS
# =============================================================================

def mem0_add_memory(content: str, metadata: dict = None) -> dict:
    """Add memory to Mem0 cloud"""
    if not MEM0_API_KEY:
        return {"error": "MEM0_API_KEY not configured"}
    
    try:
        headers = {
            "Authorization": f"Token {MEM0_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": content}],
            "user_id": MEM0_USER_ID
        }
        
        if metadata:
            payload["metadata"] = metadata
        
        response = http_session.post(
            f"{MEM0_BASE_URL}/memories/",
            headers=headers,
            json=payload,
            timeout=MEM0_TIMEOUT
        )
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def mem0_search_memories(query: str, limit: int = 5) -> list:
    """Search memories in Mem0 cloud"""
    if not MEM0_API_KEY:
        return []
    
    try:
        headers = {
            "Authorization": f"Token {MEM0_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {"query": query, "user_id": MEM0_USER_ID, "limit": limit}
        
        response = http_session.post(
            f"{MEM0_BASE_URL}/memories/search/",
            headers=headers,
            json=payload,
            timeout=MEM0_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        logger.error(f"Mem0 search error: {e}")
        return []


def mem0_get_all_memories() -> list:
    """Get all memories for user from Mem0"""
    if not MEM0_API_KEY:
        return []
    
    try:
        headers = {"Authorization": f"Token {MEM0_API_KEY}"}
        
        response = http_session.get(
            f"{MEM0_BASE_URL}/memories/?user_id={MEM0_USER_ID}",
            headers=headers,
            timeout=MEM0_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        logger.error(f"Mem0 get all error: {e}")
        return []


# =============================================================================
# DUAL MEMORY SYSTEM
# =============================================================================

def _store_memory_dual_sync(user_message: str, jessica_response: str, provider_used: str) -> None:
    """Internal synchronous function for memory storage"""
    memory_text = f"User: {user_message}\nJessica: {jessica_response}"
    # Use SHA256 + timestamp for collision-resistant IDs
    timestamp = str(time.time())
    memory_id = hashlib.sha256((user_message + jessica_response + timestamp).encode()).hexdigest()[:32]
    
    # Store in local ChromaDB
    try:
        http_session.post(
            f"{MEMORY_URL}/store",
            json={
                "id": memory_id,
                "text": memory_text,
                "collection": "conversations",
                "metadata": {"provider": provider_used}
            },
            timeout=LOCAL_SERVICE_TIMEOUT
        )
    except Exception as e:
        logger.error(f"Local memory store failed: {e}")
    
    # Store in Mem0 cloud
    try:
        mem0_add_memory(
            memory_text,
            metadata={"provider": provider_used, "source": "jessica_local"}
        )
    except Exception as e:
        logger.error(f"Mem0 store failed: {e}")


def store_memory_dual(user_message: str, jessica_response: str, provider_used: str) -> None:
    """Store memory in both local ChromaDB and Mem0 cloud (non-blocking)"""
    # Fire and forget - don't block the response
    thread = threading.Thread(
        target=_store_memory_dual_sync,
        args=(user_message, jessica_response, provider_used),
        daemon=True
    )
    thread.start()


def recall_memory_dual(query: str) -> Dict[str, List[str]]:
    """Recall from both local ChromaDB and Mem0"""
    context = {"local": [], "cloud": []}
    
    try:
        response = http_session.post(
            f"{MEMORY_URL}/recall",
            json={"query": query, "n": 3},
            timeout=LOCAL_SERVICE_TIMEOUT
        )
        response.raise_for_status()
        context["local"] = response.json().get("documents", [])
    except Exception as e:
        logger.error(f"Local recall failed: {e}")
    
    try:
        cloud_memories = mem0_search_memories(query, limit=3)
        context["cloud"] = [m.get("memory", "") for m in cloud_memories]
    except Exception as e:
        logger.error(f"Mem0 recall failed: {e}")
    
    return context


# =============================================================================
# CACHED RESOURCES
# =============================================================================

@lru_cache(maxsize=1)
def _load_master_prompt():
    """Load and cache master prompt file"""
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(script_dir, 'master_prompt.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        logger.warning("master_prompt.txt not found, using default")
        return "You are Jessica, a helpful AI assistant."


# =============================================================================
# MAIN CHAT ENDPOINT
# =============================================================================

@app.route('/chat', methods=['POST'])
def chat():
    # Input validation
    if not request.json or 'message' not in request.json:
        return jsonify({"error": "Missing 'message' field"}), 400
    
    data = request.json
    user_message = data['message']
    explicit_directive = data.get('provider', None)
    
    # Use cached master prompt (no file I/O on every request)
    master_prompt = _load_master_prompt()
    
    memory_context = recall_memory_dual(user_message)
    provider, tier, reason = detect_routing_tier(user_message, explicit_directive)
    
    # Optimized context building using list join
    context_parts = []
    if memory_context["local"] or memory_context["cloud"]:
        context_parts.append("\n\nRelevant context from memory:\n")
        for mem in memory_context["local"][:2]:
            if isinstance(mem, str):
                context_parts.append(f"- {mem[:MEMORY_TRUNCATE_LENGTH]}...\n")
            else:
                # Handle non-string memory items (shouldn't happen, but be safe)
                logger.warning(f"Unexpected memory type in local context: {type(mem)}")
        for mem in memory_context["cloud"][:2]:
            if isinstance(mem, str):
                context_parts.append(f"- {mem[:MEMORY_TRUNCATE_LENGTH]}...\n")
            else:
                # Handle non-string memory items (shouldn't happen, but be safe)
                logger.warning(f"Unexpected memory type in cloud context: {type(mem)}")
    
    context_text = "".join(context_parts)
    full_prompt = f"{master_prompt}{context_text}\n\nUser: {user_message}\nJessica:"
    
    # Route to appropriate provider
    # Combine master_prompt with specialized prompts for Grok and Gemini
    grok_system_prompt = f"{master_prompt}\n\n{GROK_SYSTEM_PROMPT}{context_text}"
    gemini_system_prompt = f"{master_prompt}\n\n{GEMINI_SYSTEM_PROMPT}{context_text}"
    gemini_user_message = f"User: {user_message}"
    
    provider_map = {
        "local": lambda: call_local_ollama(full_prompt),
        "claude": lambda: call_claude_api(user_message, master_prompt + context_text),
        "grok": lambda: call_grok_api(user_message, grok_system_prompt),
        "gemini": lambda: call_gemini_api(gemini_user_message, gemini_system_prompt)
    }
    
    response_text = provider_map.get(provider, provider_map["local"])()
    
    # Non-blocking memory storage
    store_memory_dual(user_message, response_text, provider)
    
    return jsonify({
        "response": response_text,
        "routing": {"provider": provider, "tier": tier, "reason": reason}
    })


# =============================================================================
# ADDITIONAL ENDPOINTS
# =============================================================================

@app.route('/memory/cloud/search', methods=['POST'])
def search_cloud_memory():
    data = request.json
    query = data.get('query', '')
    results = mem0_search_memories(query)
    return jsonify({"results": results})


@app.route('/memory/cloud/all', methods=['GET'])
def get_all_cloud_memories():
    results = mem0_get_all_memories()
    return jsonify({"results": results})


@app.route('/status', methods=['GET'])
def status():
    """Check status of all API connections"""
    api_status = {
        "local_ollama": False,
        "local_memory": False,
        "claude_api": bool(ANTHROPIC_API_KEY),
        "grok_api": bool(XAI_API_KEY),
        "gemini_api": bool(GOOGLE_AI_API_KEY),
        "mem0_api": bool(MEM0_API_KEY)
    }
    
    try:
        r = http_session.get(f"{OLLAMA_URL}/api/tags", timeout=HEALTH_CHECK_TIMEOUT)
        api_status["local_ollama"] = r.status_code == 200
    except Exception as e:
        logger.error(f"Ollama status check failed: {e}")
    
    try:
        r = http_session.get(f"{MEMORY_URL}/health", timeout=HEALTH_CHECK_TIMEOUT)
        api_status["local_memory"] = r.status_code == 200
    except Exception as e:
        logger.error(f"Memory service status check failed: {e}")
    
    return jsonify(api_status)


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    # Input validation
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    files = {'audio': request.files['audio']}
    response = http_session.post(f"{WHISPER_URL}/transcribe", files=files)
    response.raise_for_status()
    return response.json()


# =============================================================================
# ENVIRONMENT VALIDATION
# =============================================================================

def validate_environment() -> bool:
    """Validate environment variables and configuration.
    Returns True if at least one provider is configured, False otherwise.
    """
    warnings = []
    errors = []
    
    # Check API keys (optional but recommended)
    if not ANTHROPIC_API_KEY:
        warnings.append("ANTHROPIC_API_KEY not set - Claude API unavailable")
    if not XAI_API_KEY:
        warnings.append("XAI_API_KEY not set - Grok API unavailable")
    if not GOOGLE_AI_API_KEY:
        warnings.append("GOOGLE_AI_API_KEY not set - Gemini API unavailable")
    if not MEM0_API_KEY:
        warnings.append("MEM0_API_KEY not set - Mem0 cloud memory unavailable")
    
    # Check that at least one provider is available
    providers_available = bool(ANTHROPIC_API_KEY or XAI_API_KEY or GOOGLE_AI_API_KEY)
    if not providers_available:
        errors.append("No AI providers configured - at least one API key required")
    
    # Log warnings
    for warning in warnings:
        logger.warning(warning)
    
    # Log errors
    for error in errors:
        logger.error(error)
    
    # Return True if configuration is valid (at least one provider)
    return providers_available


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("JESSICA CORE v2.0 - Three-Tier Routing + Mem0")
    print("="*60)
    
    # Validate environment
    config_valid = validate_environment()
    
    print(f"Claude API:     {'✓' if ANTHROPIC_API_KEY else '✗'}")
    print(f"Grok API:       {'✓' if XAI_API_KEY else '✗'}")
    print(f"Gemini API:     {'✓' if GOOGLE_AI_API_KEY else '✗'}")
    print(f"Mem0 API:       {'✓' if MEM0_API_KEY else '✗'}")
    print("="*60)
    
    if not config_valid:
        print("\n⚠ WARNING: No AI providers configured!")
        print("Set at least one of: ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_AI_API_KEY")
        print("Server will start but chat endpoints will fail.\n")
    else:
        print("\n✓ Configuration valid - at least one provider available\n")
    
    app.run(host='0.0.0.0', port=8000)