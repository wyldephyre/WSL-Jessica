# Jessica AI - Development Status & Technical Debt Log

**Project:** Jessica AI - Cognitive Prosthetic for Disabled Veterans  
**Purpose:** Battle buddy AI system with multi-provider routing and dual memory storage  
**Current Phase:** Phase 1 Complete - Production Readiness Assessment  
**Last Updated:** December 10, 2025

---

## Executive Summary

Jessica AI is a **multi-tier AI routing system** designed as a cognitive prosthetic for disabled veterans with ADHD, PTSD, TBI, and other cognitive challenges. The system routes queries to optimal AI providers (Claude, Grok, Gemini, or local Ollama) based on task complexity, maintains dual memory storage (local ChromaDB + Mem0 cloud), and includes voice transcription capabilities.

**Current Status:** ✅ Phase 1 Complete - Core functionality operational with comprehensive error handling, testing, and monitoring.

**Technical Stack:**
- **Backend:** Python 3.12 + Flask (Port 8000)
- **Frontend:** Next.js 16 + React 19 + TypeScript (Port 3000)
- **AI Providers:** Claude Sonnet 4, Grok Beta, Gemini 1.5 Flash, Local Ollama
- **Memory:** ChromaDB (local, port 5001) + Mem0 (cloud sync)
- **Voice:** Whisper (port 5000)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16)                                  │
│  - Command Center (Chat)                                │
│  - Service Health Dashboard                             │
│  - Memory Viewer                                        │
│  - Task Management                                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
         ┌───────────▼───────────┐
         │ Jessica Core (Flask)  │
         │ Port 8000             │
         │ - Intelligent Routing │
         │ - Memory Management   │
         │ - Error Handling      │
         └───┬────┬────┬────┬───┘
             │    │    │    │
    ┌────────┘    │    │    └────────┐
    │             │    │             │
┌───▼───┐   ┌───▼───┐ ┌──▼──┐   ┌──▼──┐
│Ollama │   │Memory │ │Whis-│   │Ext. │
│:11434 │   │:5001  │ │per  │   │APIs │
│       │   │Chroma │ │:5000│   │     │
│Local  │   │DB     │ │     │   │Claude│
│LLM    │   │       │ │     │   │Grok │
│       │   │       │ │     │   │Gemini│
└───────┘   └───┬───┘ └─────┘   └─────┘
                │
          ┌─────▼─────┐
          │ Mem0 Cloud│
          │   Sync    │
          └───────────┘
```

---

## Current Development Status

### ✅ Phase 1.1: Error Handling & Recovery (COMPLETE)

**Status:** Production-ready  
**Completion Date:** December 6, 2025

#### Backend Achievements
- ✅ Comprehensive error handling on all endpoints
- ✅ Custom exception hierarchy (ValidationError, ServiceUnavailableError, etc.)
- ✅ Retry logic with exponential backoff for external APIs (3 retries, 1s-60s delays)
- ✅ Request ID tracking for debugging
- ✅ Structured error responses with error codes
- ✅ Connection pooling for HTTP efficiency
- ✅ Non-blocking memory storage (threaded)

#### Frontend Achievements
- ✅ Centralized API client with automatic retry
- ✅ Toast notifications for user feedback
- ✅ Graceful degradation when services unavailable
- ✅ Real-time service health monitoring dashboard
- ✅ Auto-refresh health checks (30-second intervals)
- ✅ Response time color coding (green/amber/red)

**Key Files:**
- `jessica_core.py` - Main Flask server with routing logic
- `exceptions.py` - Custom exception classes
- `retry_utils.py` - Retry decorators
- `frontend/lib/api/client.ts` - Centralized API client
- `frontend/components/ServiceHealth.tsx` - Health dashboard

---

### ✅ Phase 1.2: Testing Infrastructure (COMPLETE)

**Status:** Test coverage >70% backend  
**Completion Date:** December 6, 2025

#### Backend Testing
- ✅ pytest framework configured
- ✅ Unit tests for routing logic (`test_routing.py`)
- ✅ Unit tests for memory functions (`test_memory.py`)
- ✅ Unit tests for chat endpoint (`test_chat_endpoint.py`)
- ✅ Security validation tests (`test_security.py`)
- ✅ Logging performance tests (`test_logging_performance.py`)
- ✅ Test coverage reporting configured

#### Frontend Testing
- ✅ Jest + React Testing Library configured
- ✅ Component test infrastructure ready
- ⚠️ **DEBT:** Minimal component tests written (needs expansion)

**Test Execution:**
```bash
# Backend
pytest tests/ -v --cov=. --cov-report=html

# Frontend
npm test
```

---

### ✅ Phase 1.3: Logging & Observability (COMPLETE)

**Status:** Production-ready monitoring  
**Completion Date:** December 6, 2025

#### Logging System
- ✅ Structured JSON logging with rotation
- ✅ Separate error log file (10MB rotation, 5 backups)
- ✅ Request ID propagation through all services
- ✅ Human-readable console output (colored)
- ✅ File logging with machine-parseable JSON

**Log Locations:**
- `logs/jessica-core.log` - Main application logs
- `logs/jessica-errors.log` - Errors only

#### Performance Monitoring
- ✅ API call timing per provider
- ✅ Endpoint response time tracking
- ✅ Memory usage monitoring
- ✅ Error count by type
- ✅ Metrics endpoint (`/metrics`)

---

### ✅ Phase 1.4: Documentation (COMPLETE)

**Status:** Comprehensive documentation suite  
**Completion Date:** December 6, 2025

#### Documentation Files
- ✅ `README.md` - Quick start and overview
- ✅ `AGENTS.md` - Architecture and development patterns
- ✅ `ARCHITECTURE.md` - System design deep dive
- ✅ `API_DOCUMENTATION.md` - Complete API reference
- ✅ `USER_GUIDE.md` - Feature usage guide
- ✅ `DEVELOPER_ONBOARDING.md` - New developer guide
- ✅ `TROUBLESHOOTING.md` - Common issues and solutions
- ✅ `MODEL_SETUP.md` - Ollama model configuration
- ✅ `DEPLOYMENT.md` - Deployment procedures
- ✅ `SECURITY_QUICK_REF.md` - Security guidelines

---

## Core Features Status

### 1. Intelligent AI Routing ✅
**Status:** Production-ready

Routes requests to optimal AI provider based on keywords:
- **Research** (news, current events) → Grok (web access)
- **Complex reasoning** (strategy, analysis) → Claude (deep thinking)
- **Quick lookups** (definitions, summaries) → Gemini (fast)
- **General conversation** → Local Ollama (personality-driven)

**Performance:**
- Keyword detection optimized with O(1) set lookups
- Routing decision <1ms
- Explicit provider override supported

---

### 2. Dual Memory System ✅
**Status:** Operational with known limitations

**Local ChromaDB:**
- Vector storage at `~/jessica-memory/`
- Semantic search with embeddings
- Fast local queries
- No external dependencies

**Mem0 Cloud:**
- Cross-device synchronization
- Cloud backup of conversations
- API-based access

**Memory Flow:**
1. User message → Semantic search in both systems
2. Top 2 results from each added to context
3. AI generates response with memory context
4. Conversation stored asynchronously to both systems

**Known Issue:** 
- Memory server health endpoint returns false negative (reports unhealthy but works fine)
- ⚠️ **DEBT:** False alarm in `/status` - cosmetic, doesn't affect functionality

---

### 3. Voice Transcription ✅
**Status:** Functional

- Whisper model (base) for speech-to-text
- Endpoint: `POST /transcribe`
- Accepts multipart/form-data audio uploads
- Returns transcription + detected language
- ⚠️ **DEBT:** No voice activity detection (manual start/stop only)

---

### 4. Jessica Modes ✅
**Status:** Two modes implemented

**Default Mode:** General cognitive support
- Model: `jessica` (custom Ollama model)
- Personality baked into Modelfile
- General Marine battle buddy persona

**Business Mode:** WyldePhyre operations
- Model: `jessica-business` (custom Ollama model)  
- 4-division focus (Creators Fyre, Talent & Marketing, Media/Publishing, Development Studio)
- SIK tracking awareness
- Revenue/business context

**Usage:**
```json
{
  "message": "What's the status of Division 2?",
  "mode": "business"
}
```

---

## Technical Debt & Known Issues

### 🔴 HIGH PRIORITY

#### 1. CORS Configuration Too Permissive
**File:** `jessica_core.py:45-48`  
**Issue:** CORS restricted to localhost only, but needs production domain configuration  
**Impact:** Deployment blocker for production hosting  
**Fix Required:** Environment-based CORS configuration
```python
# Current
CORS(app, origins=["http://localhost:3000", "https://localhost:3000"])

# Needed
CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","))
```

#### 2. Single-User Architecture
**File:** `jessica_core.py:55`  
**Issue:** Hardcoded `USER_ID = "PhyreBug"` - not multi-tenant ready  
**Impact:** Cannot scale to multiple users without refactor  
**Scope:** 
- User ID hardcoded in 12+ locations
- No authentication system
- No user isolation (single constant used everywhere)

**Recommendation:** Phase 2 feature - defer until post-MVP

---

### 🟡 MEDIUM PRIORITY

#### 3. Memory Server False Health Check
**File:** `memory_server.py` (health endpoint behavior)  
**Issue:** Health endpoint sometimes reports unhealthy when service is operational  
**Impact:** Confusing health dashboard, user concern  
**Workaround:** Known cosmetic issue, doesn't affect functionality  
**Fix Required:** Debug ChromaDB health check logic

#### 4. Frontend Component Test Coverage Low
**Status:** Infrastructure ready, tests minimal  
**Impact:** Risk of UI regressions during changes  
**Files Needing Tests:**
- `components/features/*.tsx` - Feature components
- `app/*/page.tsx` - Page components
- `components/ui/*.tsx` - UI primitives

**Recommendation:** Write component tests incrementally as features evolve

#### 5. No Rate Limiting Per Endpoint
**File:** `jessica_core.py:64-66`  
**Issue:** Rate limits configured but single global limit  
**Impact:** Abuse potential, no granular control  
**Fix Required:** Per-endpoint rate limit decorators

---

### 🟢 LOW PRIORITY (Future Enhancements)

#### 6. No Response Caching
**Impact:** Repeated identical queries hit APIs unnecessarily  
**Recommendation:** Redis caching layer in Phase 4

#### 7. No Fallback Provider Chain
**Issue:** If Claude fails, doesn't fall back to Grok or Gemini  
**Impact:** Service degradation on provider outage  
**Recommendation:** Provider fallback chain in Phase 4

#### 8. Memory Storage Not Deduplicated
**Issue:** Near-duplicate conversations may be stored multiple times  
**Impact:** Storage inefficiency, noise in recall  
**Recommendation:** Content-based deduplication in Phase 3

#### 9. No Circuit Breaker Pattern
**Issue:** Failing external APIs repeatedly called despite consistent failures  
**Impact:** Wasted time on known-bad endpoints  
**Recommendation:** Circuit breaker in Phase 4

#### 10. Logs Not Aggregated
**Issue:** Logs stored locally only, no central aggregation  
**Impact:** Hard to debug across multiple instances  
**Recommendation:** Log aggregation (ELK stack or similar) in Phase 6

---

## Security Considerations

### ✅ Current Security (Development Mode)

**Implemented:**
- ✅ API keys stored in environment variables (not in code)
- ✅ CORS restricted to localhost
- ✅ Input validation on all endpoints
- ✅ Request length limits (10K characters)
- ✅ Error messages sanitized (no sensitive data leakage)
- ✅ Rate limiting framework in place

**Not Implemented (Known Limitations):**
- ❌ No authentication system
- ❌ No data encryption at rest
- ❌ No HTTPS enforcement (development only)
- ❌ No secrets management vault
- ❌ No audit logging
- ❌ No CSRF protection

### 🔴 Production Security Requirements (Phase 6)

**Critical Pre-Launch:**
1. JWT authentication or Firebase Auth integration
2. HTTPS/TLS enforcement
3. API key rotation system
4. Secrets management (AWS Secrets Manager or similar)
5. Data encryption at rest for ChromaDB
6. Audit logging for sensitive operations
7. CSRF token validation
8. Content Security Policy headers

---

## Performance Metrics

### Current Performance (Local Development)

**Response Times:**
- Local Ollama: 800-2000ms (32B model on RTX 4080 Super)
- Claude API: 1500-3000ms
- Grok API: 1200-2500ms
- Gemini API: 600-1200ms
- Memory recall: 50-150ms (local ChromaDB)

**Resource Usage:**
- Backend memory: ~300MB (idle)
- Ollama VRAM: ~24GB (qwen2.5:32b loaded)
- ChromaDB disk: ~50MB (varies with memory count)

**Bottlenecks Identified:**
1. Ollama model loading (first request: 30-60s)
2. Large context windows slow Ollama inference
3. External API rate limits (provider-dependent)

**Optimizations Applied:**
- ✅ HTTP connection pooling
- ✅ Master prompt caching (LRU cache)
- ✅ Non-blocking memory storage
- ✅ Async memory operations

---

## Deployment Status

### Current Environment: Local Development

**Host:** WSL2 Ubuntu on Windows 11  
**Architecture:** Single-server, all services local

**Service Ports:**
- Port 3000: Next.js frontend
- Port 5000: Whisper service
- Port 5001: Memory service (ChromaDB)
- Port 8000: Jessica Core (Flask)
- Port 11434: Ollama LLM service

**Startup Method:**
```bash
# All services
~/start-jessica.sh

# Individual services
ollama serve                    # Terminal 1
python memory_server.py         # Terminal 2  
python whisper_server.py        # Terminal 3
python jessica_core.py          # Terminal 4
npm run dev --prefix frontend   # Terminal 5
```

---

### Production Deployment Plan (Phase 6 - Not Yet Implemented)

**Target Platform:** TBD (Rumble Cloud preferred for mission alignment)

**Infrastructure Requirements:**
- Load balancer (Flask + Next.js instances)
- Managed database (replace local ChromaDB)
- Redis cache layer
- CDN for static assets
- Secrets management vault
- Log aggregation service
- Monitoring & alerting (Prometheus + Grafana)

**Estimated Infrastructure Cost:** $200-500/month (depending on traffic)

---

## Dependencies & Versions

### Backend (Python)

**Core Framework:**
- Flask 3.1.0
- Python 3.12+

**AI/ML:**
- openai-whisper 20250625
- mem0ai 1.0.0
- torch 2.9.0

**External APIs:**
- anthropic-sdk (Claude)
- xai-sdk 1.0.1 (Grok)
- google-generativeai (Gemini)

**Database:**
- ChromaDB (via requirements.txt)
- SQLAlchemy 2.0.44

**Utilities:**
- requests 2.32.5
- python-dotenv (for .env loading)
- flask-limiter 3.8.0 (rate limiting)
- flask-cors (CORS handling)

**Testing:**
- pytest
- pytest-cov (coverage reporting)

### Frontend (Next.js)

**Core:**
- Next.js 16.0.1
- React 19.2.0
- TypeScript 5

**UI:**
- Tailwind CSS 4
- react-hot-toast 2.4.1 (notifications)

**Data/API:**
- axios 1.13.1
- firebase 12.5.0
- zod 4.1.12 (validation)

**Testing:**
- Jest 29.7.0
- React Testing Library 14.3.1

---

## File Structure Overview

```
jessica-core/
├── Backend (Python/Flask)
│   ├── jessica_core.py          # Main Flask server (1545 lines)
│   ├── memory_server.py         # ChromaDB service (189 lines)
│   ├── whisper_server.py        # Whisper service (140 lines)
│   ├── exceptions.py            # Custom exceptions
│   ├── retry_utils.py           # Retry decorators
│   ├── logging_config.py        # Log configuration
│   ├── performance_monitor.py   # Metrics tracking
│   ├── master_prompt.txt        # Jessica personality (full)
│   ├── jessica_local_prompt.txt # Condensed for local models
│   ├── Modelfile                # jessica model definition
│   ├── Modelfile.business       # jessica-business model
│   └── requirements.txt         # Python dependencies
│
├── Frontend (Next.js/TypeScript)
│   ├── app/
│   │   ├── page.tsx             # Home/chat page
│   │   ├── command-center/      # Main chat interface
│   │   ├── dashboard/           # Task management
│   │   ├── memory/              # Memory viewer
│   │   ├── integrations/        # Service health
│   │   └── settings/            # Configuration
│   │
│   ├── components/
│   │   ├── features/            # Feature components
│   │   ├── layout/              # Layout components
│   │   ├── ui/                  # UI primitives
│   │   └── ServiceHealth.tsx    # Health dashboard
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts        # Centralized API client
│   │   ├── services/
│   │   │   └── memoryService.ts # Memory operations
│   │   └── utils/
│   │       └── retry.ts         # Retry utilities
│   │
│   └── package.json
│
├── Tests
│   ├── tests/                   # Backend tests (pytest)
│   │   ├── test_routing.py
│   │   ├── test_memory.py
│   │   ├── test_chat_endpoint.py
│   │   ├── test_security.py
│   │   └── test_logging_performance.py
│   │
│   └── frontend/tests/          # Frontend tests (Jest)
│       └── (infrastructure ready, tests minimal)
│
├── Documentation
│   ├── README.md                # Quick start
│   ├── AGENTS.md                # Dev patterns
│   ├── ARCHITECTURE.md          # System design
│   ├── API_DOCUMENTATION.md     # API reference
│   ├── USER_GUIDE.md            # User features
│   ├── DEVELOPER_ONBOARDING.md  # New dev guide
│   ├── TROUBLESHOOTING.md       # Common issues
│   ├── MODEL_SETUP.md           # Ollama config
│   ├── DEPLOYMENT.md            # Deploy procedures
│   └── SECURITY_QUICK_REF.md    # Security guide
│
├── Scripts
│   ├── start-jessica.sh         # Start all services
│   ├── setup-jessica-models.sh  # Model setup
│   ├── verify-jessica-models.sh # Model verification
│   └── create-jessica-models.sh # Model creation
│
└── Logs
    ├── logs/jessica-core.log    # Main logs
    └── logs/jessica-errors.log  # Errors only
```

---

## Code Quality Metrics

### Backend (Python)

**Lines of Code:**
- `jessica_core.py`: 1,545 lines
- `memory_server.py`: 189 lines
- `whisper_server.py`: 140 lines
- Total backend: ~2,000 lines (core services)

**Test Coverage:**
- Unit tests: 70%+ coverage
- Integration tests: Partial
- End-to-end tests: Manual only

**Code Quality:**
- ✅ Comprehensive error handling
- ✅ Type hints used extensively
- ✅ Docstrings on all functions
- ✅ Logging statements throughout
- ⚠️ Some long functions (could be refactored)

### Frontend (TypeScript)

**Lines of Code:**
- Components: ~1,500 lines
- API/Services: ~800 lines
- Total frontend: ~3,000 lines

**Test Coverage:**
- Unit tests: <20% (infrastructure only)
- Component tests: Minimal
- Integration tests: None

**Code Quality:**
- ✅ TypeScript strict mode
- ✅ ESLint configured
- ✅ Consistent component structure
- ⚠️ Minimal test coverage (needs improvement)

---

## Roadmap & Next Steps

### Phase 2: Voice Interface (Q1 2026)
- [ ] Web Speech API integration
- [ ] Real-time audio streaming
- [ ] Voice activity detection (VAD)
- [ ] Push-to-talk UI
- [ ] Continuous conversation mode

### Phase 3: WyldePhyre Integration (Q2 2026)
- [ ] SIK tracking database
- [ ] Challenge Coin system
- [ ] $PHYRE token integration
- [ ] 4-division coordination
- [ ] Cross-division synergy alerts

### Phase 4: Performance & Scale (Q2-Q3 2026)
- [ ] Redis caching layer
- [ ] Database optimization
- [ ] Load balancing setup
- [ ] Provider fallback chain
- [ ] Circuit breaker pattern
- [ ] Metrics dashboard (Grafana)

### Phase 5: Advanced Features (Q3-Q4 2026)
- [ ] Visual intelligence (OBSBot integration)
- [ ] Two-PC architecture support
- [ ] Nexus Arcanum world bible
- [ ] Writing partner mode
- [ ] Crisis protocol activation

### Phase 6: Security & Production Deploy (Q4 2026)
- [ ] Authentication system (JWT or Firebase)
- [ ] API key rotation
- [ ] Data encryption at rest
- [ ] Secrets management vault
- [ ] Audit logging
- [ ] HTTPS/TLS enforcement
- [ ] Production deployment
- [ ] Multi-user support

---

## Known Bugs & Issues

### Active Bugs

1. **Memory Health False Negative**
   - **Severity:** Low (cosmetic)
   - **Status:** Known issue, doesn't affect functionality
   - **Workaround:** Ignore health dashboard memory warning

2. **Ollama First Request Delay**
   - **Severity:** Medium (UX annoyance)
   - **Status:** Model loading time (30-60s)
   - **Workaround:** Keep Ollama warm with periodic pings

### Resolved Bugs (Phase 1)

- ✅ No error handling on `/memory/cloud/search` (Fixed Phase 1.1)
- ✅ Frontend crashes on backend timeout (Fixed Phase 1.1)
- ✅ No retry logic for external APIs (Fixed Phase 1.1)
- ✅ Health dashboard doesn't auto-refresh (Fixed Phase 1.1)
- ✅ Missing request ID tracking (Fixed Phase 1.1)

---

## Team & Contact

**Project Lead:** Corporal Jason Kesler (PhyreBug)  
**Role:** 100% Disabled Marine Veteran, Founder WyldePhyre Media Group

**Current Team:**
- Solo developer with AI assistance (Claude, Jessica)
- Business partner reviewing for investment/partnership

**Communication:**
- Primary: In-person development sessions
- Backup: Documentation-driven (this file)

---

## Business Context

### Mission Statement
Jessica AI exists to prove that disabled veterans with ADHD, PTSD, TBI, and other cognitive challenges can build empires WITH the right tools. Jessica works WITH how the brain functions, not against it.

### Target Market
1. **Primary:** Disabled veterans needing cognitive support
2. **Secondary:** ADHD/neurodivergent entrepreneurs
3. **Future:** General productivity tool (freemium model)

### Revenue Model (Planned)
- **Phase 1-2:** Development (no revenue)
- **Phase 3:** WyldePhyre internal tool (operational value)
- **Phase 4:** Subscription SaaS ($20-50/month)
- **Phase 5:** Enterprise licenses for VA/veteran orgs

### Investment Needed
- **Current:** Bootstrap development (solo + Claude tokens)
- **Phase 6 (Production):** $10K-25K for infrastructure, hosting, security audit
- **Phase 7 (Scale):** $50K-100K for multi-user refactor, marketing

---

## Success Metrics

### Technical Metrics
- ✅ 99% uptime (local dev environment)
- ✅ <3 second response times (p95)
- ✅ 70%+ test coverage (backend)
- ⚠️ <20% test coverage (frontend - needs work)

### User Metrics (Single User - Corporal Phyre)
- Daily usage: 4-6 hours
- Queries per day: 50-100
- Memory storage: 500+ conversations
- Voice transcriptions: Occasional use

### Business Metrics
- Current users: 1 (founder)
- Revenue: $0 (development phase)
- Cost: ~$100/month (API keys, Claude tokens)

---

## Conclusion & Recommendations

### For Business Partner Review

**What's Working:**
- ✅ Core functionality operational and stable
- ✅ Intelligent routing saves costs (uses local when possible)
- ✅ Dual memory system provides redundancy
- ✅ Error handling makes system resilient
- ✅ Comprehensive documentation for handoff

**What Needs Work:**
- ⚠️ Single-user architecture (multi-tenant requires refactor)
- ⚠️ No authentication (blocks production deployment)
- ⚠️ Frontend test coverage low
- ⚠️ Security needs hardening for production

**Investment Decision Factors:**

**PRO:**
- Novel cognitive prosthetic approach (unique market position)
- Proven daily use by founder (product-market fit for target user)
- Modular architecture (can scale components independently)
- Mission-driven (strong brand narrative for disabled veteran market)

**CON:**
- Single-user current implementation (refactor cost for multi-tenant)
- No revenue yet (investment needed before monetization)
- Security hardening required (audit + implementation cost)
- Dependency on external AI providers (API cost scaling concern)

**Recommended Next Step:** Demo session with founder to evaluate:
1. Real-world usage patterns
2. Response quality across providers
3. User experience flow
4. Technical stability

**Estimated Time to Production MVP:** 3-6 months (with funding)

---

## Version History

- **v0.1** - December 6, 2025: Phase 1 completion (error handling, testing, logging)
- **v0.2** - December 10, 2025: Development status log created for business partner

---

**For the forgotten 99%, we rise.** 🔥

*This document is maintained by the development team and updated at major milestones.*

