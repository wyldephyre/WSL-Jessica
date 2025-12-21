# Jessica AI - Architecture Documentation

**System Architecture and Design Decisions**

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (Port 3000)                         │  │
│  │  - Command Center (Chat)                              │  │
│  │  - Dashboard (Tasks, Calendar)                         │  │
│  │  - Memory Viewer                                       │  │
│  │  - Service Health Dashboard                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    JESSICA CORE BACKEND                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Flask API Server (Port 8000)                        │  │
│  │  - Request Routing                                   │  │
│  │  - AI Provider Selection                             │  │
│  │  - Memory Management                                 │  │
│  │  - Error Handling & Retry                            │  │
│  │  - Performance Monitoring                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         │              │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ Ollama  │   │ Memory  │   │ Whisper │   │ External│
    │ :11434  │   │ :5001   │   │ :5000   │   │ APIs    │
    │         │   │         │   │         │   │         │
    │ Local   │   │ChromaDB │   │ Audio   │   │ Claude  │
    │ LLM     │   │ Vector  │   │ Trans.  │   │ Grok    │
    │         │   │ Store   │   │         │   │ Gemini  │
    └─────────┘   └─────────┘   └─────────┘   └─────────┘
                            │
                            │
                    ┌───────▼────────┐
                    │   Mem0 Cloud   │
                    │   (Sync)       │
                    └────────────────┘
```

---

## Component Details

### 1. Frontend (Next.js)

**Technology Stack:**
- Next.js 16 (App Router)
- TypeScript
- React 19
- Tailwind CSS
- Firebase (Firestore for OAuth tokens)

**Key Components:**
- `app/command-center/` - Main chat interface
- `app/dashboard/` - Tasks and calendar view
- `app/memory/` - Memory search and viewer
- `app/integrations/` - Service health dashboard
- `components/features/` - Feature-specific components
- `lib/api/client.ts` - Centralized API client with retry logic

**Architecture Patterns:**
- Server Components where possible
- Client Components for interactivity
- API Routes for backend proxy (when needed)
- Centralized error handling via ErrorBoundary

### 2. Backend (Flask)

**Technology Stack:**
- Flask 3.1.0
- Python 3.12+
- Requests (HTTP client with connection pooling)
- ChromaDB (local vector storage)
- Mem0 (cloud memory sync)

**Key Modules:**
- `jessica_core.py` - Main Flask application
- `exceptions.py` - Custom exception classes
- `retry_utils.py` - Retry logic with exponential backoff
- `logging_config.py` - Structured logging setup
- `performance_monitor.py` - Performance metrics collection

**Architecture Patterns:**
- RESTful API design
- Middleware for request tracking
- Decorator pattern for retry logic
- Singleton pattern for metrics
- Threading for non-blocking operations

### 3. AI Routing System

**Routing Logic:**
```
User Message
    │
    ├─► Keyword Detection
    │   ├─► Research Keywords? → Grok
    │   ├─► Complex Reasoning? → Claude
    │   ├─► Document/Lookup? → Gemini
    │   └─► Default → Local Ollama
    │
    └─► Explicit Provider Override?
        └─► Use Specified Provider
```

**Routing Function:**
```python
def detect_routing_tier(message: str, explicit_directive: str = None) -> Tuple[str, int, str]:
    """
    Determines which AI provider to use based on message content.
    
    Returns:
        (provider_name, tier, reason)
    """
```

**Provider Selection:**
- **Grok:** Research, real-time info, web access
- **Claude:** Complex reasoning, strategy, deep analysis
- **Gemini:** Quick lookups, document processing, fast answers
- **Ollama:** General conversation, personality-driven responses

### 4. Memory System

**Dual Storage Architecture:**
```
Conversation
    │
    ├─► Local ChromaDB (Port 5001)
    │   └─► Fast, local, always available
    │
    └─► Mem0 Cloud (API)
        └─► Cross-device sync, backup
```

**Memory Flow:**
1. **Storage:** Non-blocking thread stores to both systems
2. **Retrieval:** Queries both, merges results
3. **Context:** Top 2 results from each added to prompt

**Memory Functions:**
- `recall_memory_dual()` - Query both systems
- `store_memory_dual()` - Store to both systems (async)

### 5. Error Handling

**Error Hierarchy:**
```
APIError (base)
    ├─► ValidationError (400)
    ├─► ServiceUnavailableError (503)
    ├─► MemoryError (500)
    ├─► ExternalAPIError (502)
    └─► AuthenticationError (401)
```

**Error Flow:**
```
Request
    │
    ├─► Validation
    │   └─► ValidationError if invalid
    │
    ├─► Service Check
    │   └─► ServiceUnavailableError if down
    │
    ├─► API Call
    │   ├─► Retry Logic (3 attempts)
    │   └─► ExternalAPIError if fails
    │
    └─► Response
        └─► Structured JSON error
```

**Retry Strategy:**
- Exponential backoff (1s, 2s, 4s)
- Max 3 retries
- Only for network errors (Timeout, ConnectionError)
- Logs each retry attempt

### 6. Logging & Observability

**Logging Architecture:**
```
Application
    │
    ├─► Console Handler (Human-readable, colored)
    │
    ├─► File Handler (JSON format, rotated)
    │   └─► logs/jessica-core.log (10MB, 10 backups)
    │
    └─► Error Handler (Errors only)
        └─► logs/jessica-errors.log (10MB, 5 backups)
```

**Performance Monitoring:**
- API call timing (per provider)
- Endpoint response times
- Memory usage tracking
- Error counts by type
- Metrics endpoint: `/metrics`

**Request Tracking:**
- Unique request ID per request
- Propagated through all services
- Included in all logs and responses

### 7. Performance Optimizations

**Connection Pooling:**
- `requests.Session()` for HTTP reuse
- Reduces connection overhead

**Caching:**
- `@lru_cache` for master prompt loading
- Prevents file I/O on every request

**Non-Blocking Operations:**
- Memory storage in background thread
- Doesn't block API response

**Async Memory Storage:**
```python
thread = threading.Thread(
    target=_store_memory_dual_sync,
    daemon=True
)
thread.start()  # Fire and forget
```

---

## Data Flow

### Chat Request Flow

```
1. User sends message via frontend
   │
2. Frontend → POST /chat
   │
3. Backend validates request
   │
4. Backend recalls memory (dual query)
   │
5. Backend detects routing tier
   │
6. Backend calls selected AI provider
   │   ├─► Retry on failure (3x)
   │   └─► Track performance
   │
7. Backend stores conversation (async)
   │   ├─► Local ChromaDB
   │   └─► Mem0 Cloud
   │
8. Backend returns response
   │
9. Frontend displays response
```

### Memory Retrieval Flow

```
1. User message received
   │
2. Query Local ChromaDB
   │   └─► Vector search (top 3)
   │
3. Query Mem0 Cloud
   │   └─► API search (top 3)
   │
4. Merge results
   │   └─► Top 2 from each
   │
5. Add to context
   │   └─► Included in AI prompt
```

---

## Security Considerations

### Current State (Development)

- **No Authentication:** Development mode only
- **API Keys:** Stored in `~/.bashrc` (not in code)
- **CORS:** Enabled for localhost only
- **No Rate Limiting:** Will be added in Phase 4.2

### Production Requirements (Phase 6)

- **Authentication:** JWT tokens or Firebase Auth
- **API Key Management:** Secure vault (AWS Secrets Manager)
- **Data Encryption:** Encrypt sensitive memories at rest
- **Rate Limiting:** Per-user limits
- **CSRF Protection:** Token validation

---

## Scalability Considerations

### Current Limitations

- **Single Server:** All services on one machine
- **In-Memory Metrics:** Metrics reset on restart
- **No Load Balancing:** Single Flask instance
- **Local Storage:** ChromaDB on local filesystem

### Future Scaling (Phase 4)

- **Caching:** Redis for response caching
- **Database:** Move ChromaDB to dedicated server
- **Load Balancing:** Multiple Flask instances
- **Metrics Storage:** Persistent metrics database
- **CDN:** Static asset delivery

---

## Deployment Architecture

### Current (Local Development)

```
WSL Ubuntu
├── Ollama (localhost:11434)
├── Memory Service (localhost:5001)
├── Whisper Service (localhost:5000)
├── Jessica Core (localhost:8000)
└── Frontend (localhost:3000)
```

### Future (Production - Phase 6)

```
Cloud Infrastructure
├── Load Balancer
│   ├── Flask Instances (multiple)
│   └── Next.js Instances (multiple)
├── Database Cluster
│   ├── ChromaDB (vector storage)
│   └── Firestore (user data)
├── Cache Layer (Redis)
└── Monitoring
    ├── Log Aggregation
    └── Metrics Dashboard
```

---

## Technology Decisions

### Why Flask?

- **Lightweight:** Minimal overhead
- **Flexible:** Easy to customize
- **Python Ecosystem:** Rich libraries
- **Simple:** Easy to understand and maintain

### Why Next.js?

- **React Framework:** Modern, component-based
- **Server Components:** Better performance
- **TypeScript:** Type safety
- **App Router:** Modern routing

### Why ChromaDB?

- **Local First:** Works offline
- **Vector Search:** Semantic memory retrieval
- **Simple:** Easy to set up and use
- **Python Native:** Integrates well

### Why Dual Memory?

- **Redundancy:** Backup if one fails
- **Performance:** Local is fast
- **Sync:** Cloud enables cross-device
- **Flexibility:** Can use either or both

---

## Design Principles

1. **Mission First:** Every feature serves disabled veterans
2. **ADHD-Aware:** One thing at a time, clear communication
3. **Token Efficient:** Conserve API tokens where possible
4. **Resilient:** Graceful degradation, retry logic
5. **Observable:** Comprehensive logging and metrics
6. **Testable:** >70% test coverage
7. **Maintainable:** Clear code, good documentation

---

## Future Architecture (Roadmap)

### Phase 2: Voice Interface
- Web Speech API integration
- Real-time audio streaming
- Voice activity detection

### Phase 3: WyldePhyre Integration
- SIK tracking database
- Challenge Coin system
- $PHYRE token integration

### Phase 4: Performance & Scale
- Redis caching
- Database optimization
- Load balancing

### Phase 6: Security
- Authentication system
- API key management
- Data encryption

---

**Semper Fi, brother. Architecture that serves the mission.** 🔥

---

*Last Updated: December 6, 2025*

