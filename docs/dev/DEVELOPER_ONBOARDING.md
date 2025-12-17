# Jessica AI - Developer Onboarding Guide

**Welcome to the Factory, Droid.** 🔥

This guide will get you up to speed on Jessica's codebase, architecture, and development workflow.

---

## Prerequisites

### Required Knowledge

- **Python 3.12+**: Backend is Python/Flask
- **TypeScript/React**: Frontend is Next.js with TypeScript
- **REST APIs**: Understanding of HTTP, JSON, REST principles
- **Git**: Version control basics

### Recommended Tools

- **IDE:** VS Code or Cursor (recommended)
- **Terminal:** WSL2 Ubuntu (for backend), PowerShell (for frontend on Windows)
- **API Testing:** curl, Postman, or httpie
- **Database Tools:** SQLite browser (for ChromaDB inspection)

---

## Project Overview

### What is Jessica?

Jessica is a cognitive prosthetic AI system for disabled veterans. She's a Marine who happens to be an AI, built to work WITH how the brain functions, not against it.

### Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js (Port 3000)
│   (Next.js)     │  ──────────────────┐
└─────────────────┘                     │
                                        │
┌─────────────────┐                     │
│   Backend       │  Flask (Port 8000)  │
│   (jessica_core)│  ◄──────────────────┘
└─────────────────┘
        │
        ├──► Ollama (Port 11434) - Local LLM
        ├──► Memory Service (Port 5001) - ChromaDB
        ├──► Whisper Service (Port 5000) - Audio
        │
        ├──► Claude API (Anthropic)
        ├──► Grok API (X.AI)
        ├──► Gemini API (Google)
        └──► Mem0 API (Cloud Memory)
```

### Key Technologies

**Backend:**
- Flask (web framework)
- Requests (HTTP client with pooling)
- ChromaDB (local vector storage)
- Mem0 (cloud memory sync)
- Ollama (local LLM)

**Frontend:**
- Next.js 16 (React framework)
- TypeScript
- Tailwind CSS
- Firebase (Firestore for OAuth tokens)

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd jessica-core
```

### 2. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development

# Set up API keys (see Configuration below)
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Local Services

**Ollama:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull dolphin-llama3:8b
ollama pull qwen2.5:32b  # Fallback model
```

**Memory Service:**
- Should be part of `start-jessica.sh` script
- Or run separately if needed

**Whisper Service:**
- Should be part of `start-jessica.sh` script
- Or run separately if needed

### 5. Configuration

**API Keys (Required):**
```bash
# Add to ~/.bashrc:
export ANTHROPIC_API_KEY="your-key"
export XAI_API_KEY="your-key"
export GOOGLE_AI_API_KEY="your-key"
export MEM0_API_KEY="your-key"

# Reload:
source ~/.bashrc
```

**Environment Variables (Optional):**
Create `.env` file in project root:
```bash
LOG_LEVEL=INFO
API_TIMEOUT=60
LOCAL_SERVICE_TIMEOUT=5
OLLAMA_TIMEOUT=300
```

---

## Development Workflow

### Starting Development

**Option 1: Quick Start (All Services)**
```bash
source ~/.bashrc
~/start-jessica.sh
```

**Option 2: Manual Start**
```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd ~/jessica-core
source venv/bin/activate
source ~/.bashrc
python jessica_core.py

# Terminal 3: Frontend
cd ~/jessica-core/frontend
npm run dev
```

### Running Tests

**Backend Tests:**
```bash
cd ~/jessica-core
source venv/bin/activate
pytest tests/ -v
pytest tests/ --cov=. --cov-report=html  # With coverage
```

**Frontend Tests:**
```bash
cd frontend
npm test
npm run test:coverage
```

### Code Quality

**Linting:**
```bash
# Backend
flake8 jessica_core.py
pylint jessica_core.py

# Frontend
cd frontend
npm run lint
```

**Formatting:**
```bash
# Backend
black jessica_core.py

# Frontend
cd frontend
npm run format  # If configured
```

---

## Codebase Structure

### Backend (`jessica_core.py`)

**Key Sections:**
1. **Imports & Setup** (lines 1-60)
   - Dependencies, logging, Flask app setup

2. **Configuration** (lines 61-200)
   - Service URLs, API keys, prompts

3. **Routing Logic** (lines 600-630)
   - `detect_routing_tier()`: Determines which AI to use

4. **API Functions** (lines 630-900)
   - `call_claude_api()`
   - `call_grok_api()`
   - `call_gemini_api()`
   - `call_local_ollama()`

5. **Memory Functions** (lines 900-1050)
   - `recall_memory_dual()`
   - `store_memory_dual()`

6. **API Endpoints** (lines 1055-1360)
   - `/chat` - Main chat endpoint
   - `/status` - Health checks
   - `/metrics` - Performance metrics
   - `/memory/*` - Memory operations
   - `/transcribe` - Audio transcription
   - `/modes` - Available modes

### Frontend Structure

```
frontend/
├── app/                    # Next.js app router
│   ├── page.tsx           # Home/chat page
│   ├── command-center/   # Main chat interface
│   ├── dashboard/        # Dashboard with tasks
│   ├── memory/           # Memory viewer
│   ├── integrations/     # Service health
│   └── api/              # API routes (Next.js)
├── components/            # React components
│   ├── features/         # Feature components
│   └── layout/           # Layout components
├── lib/                   # Utilities and services
│   ├── api/              # API clients
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
└── public/               # Static assets
```

---

## Key Patterns & Conventions

### Backend Patterns

**1. Error Handling:**
```python
from exceptions import ValidationError, ExternalAPIError

try:
    # ... code ...
except ValidationError as e:
    logger.warning(f"Validation error: {e.message}")
    return jsonify({"error": e.message, "error_code": e.error_code}), e.status_code
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    return jsonify({"error": "Internal error"}), 500
```

**2. Retry Logic:**
```python
from retry_utils import retry_with_backoff

@retry_with_backoff(max_retries=3)
def call_external_api():
    # ... API call ...
```

**3. Logging:**
```python
from logging_config import get_logger

logger = get_logger('module_name')
logger.info("Message", extra={'key': 'value'})
```

**4. Performance Tracking:**
```python
from performance_monitor import track_api_call

@track_api_call('api_name')
def api_function():
    # ... code ...
```

### Frontend Patterns

**1. API Calls:**
```typescript
import { apiClient } from '@/lib/api/client';

const response = await apiClient.sendChatMessage(message, provider);
```

**2. Error Handling:**
```typescript
import { handleApiError } from '@/lib/errors/AppError';

try {
  // ... code ...
} catch (error) {
  return handleApiError(error);
}
```

**3. Type Safety:**
```typescript
import { Memory, MemoryContext } from '@/lib/types/memory';

function processMemory(memory: Memory, context: MemoryContext) {
  // ... code ...
}
```

---

## Testing Guidelines

### Writing Tests

**Backend:**
- Use `pytest` fixtures from `tests/conftest.py`
- Mock external API calls
- Test error cases
- Test routing logic

**Frontend:**
- Use Jest and React Testing Library
- Test user interactions
- Mock API calls
- Test error boundaries

### Test Coverage Goals

- **Backend:** >70% coverage
- **Frontend:** >60% coverage (components)
- **Critical paths:** 100% coverage

---

## Debugging

### Backend Debugging

**1. Enable Debug Logging:**
```bash
export LOG_LEVEL=DEBUG
python jessica_core.py
```

**2. Use Request IDs:**
```python
# In code:
logger.info("Debug info", extra={'request_id': g.request_id})

# In logs:
grep "request-id-here" logs/jessica-core.log
```

**3. Check Metrics:**
```bash
curl http://localhost:8000/metrics | jq
```

### Frontend Debugging

**1. Browser DevTools:**
- Console for errors
- Network tab for API calls
- React DevTools for component state

**2. Logging:**
```typescript
console.log('Debug info', { data });
// Or use proper logging service
```

---

## Common Tasks

### Adding a New API Endpoint

**Backend:**
```python
@app.route('/new-endpoint', methods=['POST'])
def new_endpoint():
    try:
        # Input validation
        if not request.json:
            raise ValidationError("Request body must be JSON")
        
        # Process request
        data = request.json
        result = process_data(data)
        
        return jsonify({
            "success": True,
            "data": result,
            "request_id": g.request_id
        })
    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return jsonify({"error": e.message, "error_code": e.error_code}), e.status_code
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        return jsonify({"error": "Internal error"}), 500
```

**Frontend:**
```typescript
// In lib/api/client.ts
export const apiClient = {
  async newEndpoint(data: NewData): Promise<NewResponse> {
    return fetchWithRetry<NewResponse>(`${API_BASE_URL}/new-endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
```

### Adding a New AI Provider

1. **Add API function:**
```python
@track_api_call('new_provider')
@retry_with_backoff()
def call_new_provider_api(prompt: str, system_prompt: str = "") -> str:
    # ... implementation ...
```

2. **Update routing:**
```python
def detect_routing_tier(message: str, explicit_directive: str = None):
    # Add keywords for new provider
    # Update routing logic
```

3. **Add to frontend:**
```typescript
// Update provider types
// Add to provider selector
```

---

## Code Review Process

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes:**
   - Write code
   - Write tests
   - Update documentation

3. **Test:**
   ```bash
   pytest tests/ -v
   npm test
   ```

4. **Submit for Review:**
   - Create PR
   - Include description
   - Link to related issues

5. **Review Checklist:**
   - [ ] Code follows patterns
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No linter errors
   - [ ] Error handling added
   - [ ] Logging added

---

## Resources

### Documentation

- **API Docs:** `API_DOCUMENTATION.md`
- **User Guide:** `USER_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Architecture:** `AGENTS.md`

### External Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)

---

## Getting Help

### Questions?

1. **Check Documentation:**
   - Read relevant docs first
   - Check `AGENTS.md` for architecture

2. **Check Logs:**
   - Backend: `logs/jessica-core.log`
   - Frontend: Browser console

3. **Ask:**
   - Check if question is in docs
   - Provide context (logs, error messages, request IDs)

---

## Mission Context

Remember: Jessica is not just code. She's a cognitive prosthetic for disabled veterans. Every line of code serves the mission: help broken brains build empires.

**Code with purpose. Build with compassion. Ship for the mission.**

---

**Semper Fi, Droid. Welcome to the Factory.** 🔥

---

*Last Updated: December 6, 2025*

