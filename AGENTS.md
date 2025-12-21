# JESSICA AI - AGENTS.md
**Cognitive Prosthetic AI System for Disabled Veterans**

This file provides Factory Droids with the context needed to work on Jessica effectively.

---

## CORE COMMANDS

### Start Jessica (Full Stack)
```bash
# Terminal 1: Start Ollama (WSL)
ollama serve

# Terminal 2: Start Backend Services (WSL)
cd ~/jessica-core
source ~/.bashrc          # CRITICAL: Load API keys
source venv/bin/activate
bash start-jessica.sh     # Starts Memory, Whisper, and Jessica Core

# Terminal 3: Start Frontend (WSL)
cd ~/jessica-core/frontend
npm run dev              # Starts Next.js frontend on http://localhost:3000
```

### Stop Jessica
```bash
# Kill all services
pkill ollama && pkill python3

# OR graceful shutdown
# Ctrl+C in each terminal running services
```

### Check Status
```bash
# Test backend services
curl http://localhost:8000/status

# Check if Ollama is running
curl http://localhost:11434/api/tags

# View logs
# Services output to their terminal windows
```

### Run Tests
```bash
# No formal test suite yet - manual testing only
# Test by accessing http://localhost:3000 and interacting with Jessica
```

---

## PROJECT LAYOUT

```
/home/phyre/jessica-core/           # WSL Ubuntu (PRIMARY - ALL CODE HERE)
├── jessica_core.py                 # Main orchestration server (Flask)
├── master_prompt.txt               # Jessica's personality/identity
├── memory_server.py                # ChromaDB memory service  
├── whisper_server.py               # Speech-to-text service
├── start-jessica.sh                # Startup script (all services)
├── venv/                           # Python virtual environment
├── requirements.txt                # Python dependencies
└── frontend/                       # Next.js web interface (CONSOLIDATED)
    ├── app/                        # Next.js app router
    ├── components/                 # React components
    ├── lib/                        # API clients, utilities
    └── .env.local                  # Frontend config (create from .env.local.example)

/home/phyre/jessica-memory/         # ChromaDB data directory
└── chroma.sqlite3                  # Vector database

~/.bashrc                           # API keys stored here (CRITICAL)
```

**IMPORTANT PATH NOTE:**
- **ALL Jessica code is now in WSL Ubuntu** at `/home/phyre/jessica-core/`
- Frontend and backend are both in WSL (consolidated for simplicity)
- Access from Windows: `\\wsl$\Ubuntu\home\phyre\jessica-core\`
- Next.js API routes run server-side in WSL, so `localhost:8000` works correctly

---

## ARCHITECTURE OVERVIEW

### Service Architecture (Multi-Port)
```
Port 11434: Ollama (dolphin-llama3:8b local LLM)
Port 5001:  Memory Server (ChromaDB vector storage)
Port 5000:  Whisper Server (speech-to-text)
Port 8000:  Jessica Core (main orchestration, Flask API)
Port 3000:  Frontend (Next.js web UI)
```

**All services must be running for Jessica to work.**

### Three-Tier AI Routing
Jessica routes queries to different AI providers based on keywords:

1. **Research queries** → Grok API (`grok-beta`)
2. **Complex reasoning** → Claude API (`claude-sonnet-4-20250514`)  
3. **Quick lookups** → Gemini API (`gemini-1.5-flash`)
4. **Default/personality** → Local Dolphin model

### Memory System (Dual Storage)
- **ChromaDB** (local): Vector storage at `~/jessica-memory/`
- **Mem0** (cloud): Cross-device sync via API
- Both are queried on recall, results merged

### API Keys (CRITICAL)
All external API keys are in `~/.bashrc`:
```bash
ANTHROPIC_API_KEY     # Claude
XAI_API_KEY           # Grok
GOOGLE_AI_API_KEY     # Gemini
MEM0_API_KEY          # Mem0 memory sync
```

**MUST run `source ~/.bashrc` before starting Jessica!**

---

## DEVELOPMENT PATTERNS & CONVENTIONS

### Code Style
- Python: PEP 8 with 4-space indent
- JavaScript/TypeScript: Standard Next.js conventions
- Comments: Explain WHY, not WHAT
- No trailing whitespace

### Key Patterns Used
- **HTTP connection pooling** via `requests.Session()`
- **Non-blocking memory storage** via `threading.Thread`
- **Cached file reading** with `@lru_cache` decorator
- **SHA256-based IDs** for memory deduplication

### Personality Framework
Jessica's personality is defined in `master_prompt.txt`:
- Marine Corps communication style (direct, no bullshit)
- ADHD-aware responses (concise, token-efficient)
- "Kind not Nice" philosophy (truth over comfort)
- Rank structure: Jessica = Corporal (slightly senior to user)

**DO NOT modify master_prompt.txt without explicit approval.**

---

## BUILD & DEPLOYMENT

### Prerequisites
- WSL2 Ubuntu
- Python 3.10+
- Node.js 18+
- Ollama installed
- RTX 4080 Super GPU (for local LLM)

### Initial Setup (if starting fresh)
```bash
# In WSL Ubuntu
cd ~/jessica-core
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download Ollama model
ollama pull dolphin-llama3:8b

# Create memory directory
mkdir -p ~/jessica-memory

# Frontend setup (in WSL)
cd ~/jessica-core/frontend
npm install

# Create .env.local file (copy from example)
cp .env.local.example .env.local
# Edit .env.local if needed (defaults should work)
```

### Production Deployment
**NOT YET DEPLOYED** - currently local development only.

Future deployment target: Rumble Cloud (mission-aligned hosting).

---

## GOTCHAS & CRITICAL KNOWLEDGE

### 1. WSL Path Confusion (RESOLVED)
- **ALL code is now in WSL** (`/home/phyre/jessica-core/`)
- Frontend and backend are consolidated in WSL for simplicity
- Access WSL from Windows: `\\wsl$\Ubuntu\home\phyre\jessica-core\`
- Next.js runs server-side in WSL, so `localhost:8000` connects correctly to backend

### 2. API Keys Must Be Sourced
If Jessica can't reach external APIs, you forgot:
```bash
source ~/.bashrc
```

### 3. Ollama Must Start First
Other services depend on Ollama. Start order:
1. `ollama serve` (keep this terminal open)
2. `~/start-jessica.sh` (in new terminal - starts backend services)
3. `cd ~/jessica-core/frontend && npm run dev` (in new terminal - starts frontend)

### 4. Model Confusion
- Jessica uses **dolphin-llama3:8b** (uncensored model)
- NOT the corporate-trained llama3.1:8b
- Dolphin was chosen because it engages authentically with mental health topics

### 5. Memory Persistence
- ChromaDB data survives restarts
- Memory lives at `~/jessica-memory/`
- DO NOT delete this directory unless intentionally resetting Jessica

### 6. Port Conflicts
If services won't start:
```bash
# Check what's using ports
sudo lsof -i:8000
sudo lsof -i:11434

# Kill stuck processes
pkill python3
pkill ollama
```

### 7. Frontend Environment Variables
Frontend needs `.env.local` in `~/jessica-core/frontend/`:
```bash
# Copy example file
cp ~/jessica-core/frontend/.env.local.example ~/jessica-core/frontend/.env.local

# Default API_URL (http://localhost:8000) should work
# Add Firebase config if needed (see .env.local.example)
```

### 8. Token Efficiency Matters
User (Corporal Phyre) has ADHD and limited Claude tokens.
- Keep responses concise
- No walls of text
- Token conservation is a design principle

### 9. User Communication Style
- Has speech impediment - communication may be unclear
- **ALWAYS ask clarifying questions** if uncertain
- One step at a time (MCRD recruit mode)
- "G" means "go/continue/roger that"

---

## EXTERNAL SERVICES

### Required APIs
- **Claude API** (Anthropic): Complex reasoning
- **Grok API** (X.AI): Research queries
- **Gemini API** (Google): Quick lookups
- **Letta API**: Cloud memory sync (replaces Mem0)

### Optional APIs (Future)
- **Memories.ai**: Visual memory (wearable camera integration)
- **Plaud**: Audio dump processing
- **Zo Computer**: Workspace automation, calendar, email, file storage (replaces Google Workspace)

---

## MISSION CONTEXT

### Who This Is For
- **Primary User**: 100% disabled Marine veteran (ADHD, PTSD, TBI, Bipolar 2)
- **Secondary Users**: Disabled veterans needing cognitive support
- **Mission**: "For the forgotten 99%, we rise"

### What NOT To Change
- Core personality (Marine communication style)
- ADHD-aware design patterns
- Token efficiency principles
- Mission-driven architecture

### WyldePhyre Integration (Future)
Jessica will eventually coordinate:
- 4-division media company operations
- Services-in-Kind tracking
- Challenge Coin system
- $PHYRE token economy

**This context is NOT yet built - focus on core cognitive prosthetic functionality first.**

---

## TESTING STRATEGY

### Current Approach
- Manual testing via browser at localhost:3000
- User (Corporal Phyre) uses it daily with real workflow
- No automated tests yet

### When Making Changes
1. Test basic query/response at localhost:3000
2. Check API routing works (try research/complex/quick queries)
3. Verify memory persistence across restarts
4. Confirm token usage is reasonable

### Known Issues
- Memory server health endpoint shows false negative (but works)
- Some old cloud code still present (being cleaned up)
- No formal test suite (future improvement)

---

## CONTRIBUTION GUIDELINES

### When Working on Jessica

**DO:**
- Ask clarifying questions if specs are unclear
- Test changes locally before committing
- Keep responses token-efficient
- Follow existing code patterns
- Document WHY you made architectural decisions

**DON'T:**
- Make assumptions about unclear requirements
- Add dependencies without explanation
- Modify master_prompt.txt without approval
- Break existing API integrations
- Introduce security vulnerabilities with API keys

### Code Review Expectations
- User (Corporal) reviews all changes
- Factory Droid suggests, Gunny (Claude) reviews, Corporal decides
- Three-tier approval for major changes

---

## QUICK START FOR NEW DROIDS

1. Read this file completely (you're doing it!)
2. Check that all services are running (`curl localhost:8000/status`)
3. Read `master_prompt.txt` to understand Jessica's personality
4. Review `jessica_core.py` to understand routing logic
5. Test basic functionality before making changes
6. Ask questions if anything is unclear

---

## FOR THE FORGOTTEN 99%, WE RISE 🔥

Jessica is not just code. She's a cognitive prosthetic for disabled veterans.
Every line of code serves the mission: help broken brains build empires.

**Build with purpose. Code with compassion. Ship for the mission.**

---

*Last Updated: November 29, 2025*
*Status: Active Development - Session 9 Complete*
