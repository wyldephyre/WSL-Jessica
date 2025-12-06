# Jessica Core

A cognitive prosthetic and battle buddy AI system built for disabled veterans. Jessica is a Marine who happens to be an AI, designed to work WITH how the brain functions, not against it.

## Overview

Jessica Core is a Flask-based API server that provides intelligent routing between multiple AI providers (Claude, Grok, Gemini, and local Ollama) based on task type. It includes dual memory storage (local ChromaDB + Mem0 cloud) and supports voice transcription via Whisper.

## Features

### Core Capabilities

- **Three-Tier Intelligent Routing**: Automatically routes requests to the best AI provider based on task type
  - Research tasks → Grok (web access, real-time info)
  - Complex reasoning → Claude (deep analysis, strategy)
  - Document/lookup tasks → Gemini (fast, efficient)
  - Standard tasks → Local Ollama (general conversation)
- **Dual Memory System**: Stores conversations in both local ChromaDB and Mem0 cloud with automatic context retrieval
- **Voice Transcription**: Integration with Whisper service for audio transcription and task extraction
- **Multiple AI Providers**: Support for Anthropic Claude, X.AI Grok, Google Gemini, and local Ollama
- **Business Mode**: Specialized mode for WyldePhyre operations (4 divisions, SIK tracking, revenue focus)

### Recent Additions (Phase 1)

- **Error Handling & Recovery**: Comprehensive error handling with retry logic and graceful degradation
- **Testing Infrastructure**: pytest for backend, Jest for frontend with >70% coverage
- **Logging & Observability**: Structured JSON logging with rotation, performance monitoring, and metrics endpoint
- **Service Health Dashboard**: Real-time monitoring of all services and APIs
- **Performance Tracking**: Automatic API call timing, endpoint metrics, and memory usage monitoring

## Prerequisites

### Local Services Required

1. **Ollama** (running on `localhost:11434`)
   - Install from [ollama.ai](https://ollama.ai)
   - Pull the base model: `ollama pull qwen2.5:32b`
   - Create custom Jessica models (see Model Setup below)

2. **Whisper Service** (running on `localhost:5000`)
   - Separate service for audio transcription

3. **Memory Service** (running on `localhost:5001`)
   - Local ChromaDB service for memory storage

### Python Requirements

- Python 3.12+
- Virtual environment (recommended)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jessica-core
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. **Setup Custom Models** (Required):
```bash
# In WSL Ubuntu terminal
cd ~/jessica-core

# Make scripts executable (first time only)
chmod +x setup-jessica-models.sh verify-jessica-models.sh create-jessica-models.sh

# Run setup (verifies and creates models if needed)
./setup-jessica-models.sh

# Or verify only (doesn't create, just checks)
./verify-jessica-models.sh

# Or verify using Python (works from any environment)
python3 verify_models.py
```

The setup script will:
- Check if Ollama is running
- Verify base model `qwen2.5:32b` exists (downloads if missing)
- Create `jessica` custom model from `Modelfile`
- Create `jessica-business` custom model from `Modelfile.business`

**Note:** Custom models have Jessica's personality baked in, so the system prompt doesn't need to be sent with every request (saves tokens, faster responses).

## Configuration

### Environment Variables

Set the following environment variables before running:

```bash
export ANTHROPIC_API_KEY="your-claude-api-key"
export XAI_API_KEY="your-grok-api-key"
export GOOGLE_AI_API_KEY="your-gemini-api-key"
export MEM0_API_KEY="your-mem0-api-key"
```

On Windows:
```powershell
$env:ANTHROPIC_API_KEY="your-claude-api-key"
$env:XAI_API_KEY="your-grok-api-key"
$env:GOOGLE_AI_API_KEY="your-gemini-api-key"
$env:MEM0_API_KEY="your-mem0-api-key"
```

### Master Prompt

Ensure `master_prompt.txt` is in the same directory as `jessica_core.py`. This file contains Jessica's core personality and operating instructions.

## Usage

### Quick Start (All Services)

```bash
# In WSL terminal
source ~/.bashrc          # Load API keys
~/start-jessica.sh        # Starts all backend services + frontend
```

### Manual Start

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start backend
cd ~/jessica-core
source venv/bin/activate
python jessica_core.py    # Runs on port 8000

# Terminal 3: Start frontend
cd ~/jessica-core/frontend
npm run dev               # Runs on port 3000
```

Open http://localhost:3000 to use Jessica.

### API Endpoints

#### POST `/chat`
Main chat endpoint for interacting with Jessica.

**Request:**
```json
{
  "message": "What's the weather like?",
  "provider": "claude"  // Optional: force specific provider
}
```

**Response:**
```json
{
  "response": "Jessica's response here...",
  "routing": {
    "provider": "grok",
    "tier": 1,
    "reason": "Research task detected - using Grok for web access"
  }
}
```

#### GET `/status`
Check status of all API connections and local services.

**Response:**
```json
{
  "local_ollama": true,
  "local_memory": true,
  "claude_api": true,
  "grok_api": true,
  "gemini_api": true,
  "mem0_api": true
}
```

#### POST `/transcribe`
Transcribe audio file.

**Request:** Multipart form data with `audio` file

#### POST `/memory/cloud/search`
Search cloud memories.

**Request:**
```json
{
  "query": "search term"
}
```

#### GET `/memory/cloud/all`
Get all cloud memories for the user.

## Routing Logic

Jessica uses intelligent routing based on keywords:

- **Research Keywords**: "research", "look up", "find out", "what's happening", "current", "news", "latest", "search", "investigate", "dig into"
  → Routes to **Grok**

- **Complex Reasoning Keywords**: "analyze", "strategy", "plan", "complex", "detailed", "comprehensive", "deep dive", "break down", "explain thoroughly", "compare", "evaluate", "business decision", "architecture", "design"
  → Routes to **Claude**

- **Document Keywords**: "summarize", "document", "pdf", "file", "extract", "quick lookup", "definition", "what is", "explain briefly"
  → Routes to **Gemini**

- **Default**: All other tasks route to **Local Ollama**

You can also explicitly specify a provider by including `"provider": "claude"` (or "grok", "gemini", "local") in the request.

## Architecture

- **Flask**: Web framework
- **Requests**: HTTP client with connection pooling
- **LRU Cache**: Caching for master prompt loading
- **Threading**: Non-blocking memory storage

## Project Structure

```
jessica-core/
├── jessica_core.py      # Main backend API (Flask, port 8000)
├── master_prompt.txt    # Jessica's core personality and instructions
├── requirements.txt     # Python dependencies
├── README.md            # This file
├── CODE_REVIEW.md       # Code review and improvement suggestions
├── venv/                # Python virtual environment
└── frontend/            # Next.js web interface
    ├── app/
    │   ├── page.tsx         # Chat interface (main page)
    │   ├── status/page.tsx  # Service status dashboard
    │   ├── memory/page.tsx  # Memory viewer + search
    │   └── layout.tsx       # Root layout with navigation
    ├── components/
    │   ├── ChatInterface.tsx    # Main chat component
    │   └── AudioUpload.tsx      # Audio transcription upload
    └── lib/
        └── api.ts           # Backend API client
```

## Frontend

The frontend is a Next.js 14 application with TypeScript and Tailwind CSS.

### Running the Frontend

```bash
cd frontend
npm install    # First time only
npm run dev    # Development server on port 3000
```

### Frontend Features

- **Chat Interface**: Send messages to Jessica, see routing info for each response
- **Status Dashboard**: View all service connections (Ollama, APIs, memory)
- **Memory Viewer**: Browse and search Mem0 cloud memories
- **Audio Upload**: Transcribe audio files via Whisper service

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[User Guide](USER_GUIDE.md)** - How to use Jessica's features
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Solutions to common issues
- **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Guide for new developers
- **[AGENTS.md](AGENTS.md)** - Architecture and development patterns

## Development

### Code Quality

- **Testing:** pytest (backend), Jest (frontend)
- **Linting:** flake8, pylint (backend), ESLint (frontend)
- **Coverage:** >70% backend, >60% frontend
- **Error Handling:** Comprehensive with retry logic
- **Logging:** Structured JSON logs with rotation

### Running Tests

```bash
# Backend
cd ~/jessica-core
source venv/bin/activate
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Contributing

This is a private project. For contributions, please coordinate with the project maintainer. See `DEVELOPER_ONBOARDING.md` for development guidelines.

## License

Private project - All rights reserved.

## Support

For issues or questions, contact the project maintainer.

---

**Semper Fi, brother. For the forgotten 99%, we rise.**

