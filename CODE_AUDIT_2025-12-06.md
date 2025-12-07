# Comprehensive Code Audit - December 6, 2025

## Executive Summary

Conducted thorough security and reliability audit of Jessica AI system (backend + frontend).

**Overall Security Rating**: 🟡 **MODERATE RISK**
**Critical Issues Found**: 5
**High Priority Issues**: 8
**Medium Priority Issues**: 12

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **AUTHENTICATION BYPASS IN PRODUCTION** ⚠️ CRITICAL
**File**: `frontend/lib/middleware/auth.ts:23-28`
**Severity**: CRITICAL

**Issue**: Authentication middleware allows "default-user" in development, but this check is bypassable.

```typescript
if (!userId || userId === 'default-user') {
  if (process.env.NODE_ENV === 'production') {
    throw new AuthenticationError('Authentication required');
  }
}
```

**Risks**:
- If NODE_ENV is not set to 'production', auth is bypassed
- Header `x-user-id` can be spoofed by any client
- No actual JWT/session validation
- All memory/data accessible without real auth

**Fix Required**:
- Implement proper JWT token validation
- Use Firebase Auth tokens
- Validate tokens server-side
- Remove default-user bypass entirely

---

### 2. **NO CORS ORIGIN RESTRICTIONS** ⚠️ CRITICAL
**File**: `jessica_core.py:25`
**Severity**: CRITICAL

**Issue**: CORS is enabled for ALL origins with no restrictions.

```python
CORS(app)  # Enable CORS for frontend access
```

**Risks**:
- Any website can call Jessica's API
- Cross-site request forgery (CSRF) attacks possible
- Data exfiltration from malicious sites
- API abuse from unauthorized domains

**Fix Required**:
```python
CORS(app, origins=[
    "http://localhost:3000",
    "https://yourdomain.com"
], 
supports_credentials=True,
allow_headers=["Content-Type", "Authorization"])
```

---

### 3. **HARDCODED USER ID IN BACKEND** ⚠️ CRITICAL
**File**: `jessica_core.py:49`
**Severity**: CRITICAL

**Issue**: Mem0 user ID is hardcoded to single user.

```python
MEM0_USER_ID = "PhyreBug"
```

**Risks**:
- All users share the same memory space
- Memory leakage between users
- Privacy violation (users can see each other's memories)
- Cannot scale to multiple users

**Fix Required**:
- Accept user_id as parameter in all functions
- Validate user_id matches authenticated user
- Implement proper user isolation

---

### 4. **API KEYS EXPOSED IN CLIENT-SIDE CODE** ⚠️ CRITICAL
**File**: `frontend/lib/services/memoryService.ts:25`
**File**: `frontend/lib/api/*.ts` (multiple files)
**Severity**: CRITICAL

**Issue**: API keys are accessed from client-side environment variables.

```typescript
export function getMemoryClient() {
  return {
    apiKey: env.MEM0_API_KEY,  // ❌ Exposed to browser
    baseUrl: 'https://api.mem0.ai/v1',
    userId: 'PhyreBug',
  };
}
```

**Risks**:
- MEM0_API_KEY visible in browser dev tools
- ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, etc. exposed
- Anyone can extract keys from frontend bundle
- Unlimited API usage/cost by attackers

**Fix Required**:
- Move ALL API calls to backend API routes
- Frontend should ONLY call `/api/*` endpoints
- Never expose API keys to client side
- Use Next.js API routes as proxy layer

---

### 5. **SQL INJECTION RISK IN FIRESTORE QUERIES** ⚠️ HIGH
**File**: `frontend/app/api/chat/route.ts:22-23`
**Severity**: HIGH

**Issue**: User ID used in queries without validation.

```typescript
const q = query(tokensRef, 
  where('userId', '==', userId),  // userId not sanitized
  where('provider', '==', 'google')
);
```

**Risks**:
- While Firestore has built-in protection, userId should still be validated
- Special characters could cause query issues
- No length limits enforced

**Fix Required**:
- Validate userId format (alphanumeric + specific chars only)
- Enforce length limits
- Sanitize all user inputs before queries

---

## 🟠 HIGH PRIORITY ISSUES

### 6. **MEMORY SERVICE FUNCTION SIGNATURE MISMATCH**
**File**: `frontend/lib/services/memoryService.ts:214-218` vs `frontend/app/api/chat/route.ts:125-132`
**Severity**: HIGH

**Issue**: `addConversation` function signature doesn't match how it's called.

**Function Definition**:
```typescript
export async function addConversation(
  userMessage: string,
  assistantMessage: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void>
```

**How It's Called**:
```typescript
addConversation(
  [
    { role: 'user', content: message },
    { role: 'assistant', content: response.content }
  ],
  userId,
  memoryContexts[0]
)
```

**Impact**: Runtime errors, memory storage failures (silently caught).

**Fix**: Update function signature to match usage or vice versa.

---

### 7. **NO RATE LIMITING ON ANY ENDPOINT**
**Files**: All API routes
**Severity**: HIGH

**Issue**: No rate limiting on backend or frontend API routes.

**Risks**:
- API abuse
- Denial of service attacks
- Cost explosion (Claude API costs money per request)
- Resource exhaustion

**Fix Required**:
- Add rate limiting middleware
- Use Redis or memory-based rate limiter
- Limit by IP and/or user ID
- Different limits for different endpoints

---

### 8. **EXCEPTION DETAILS LEAKED TO CLIENTS**
**File**: `frontend/lib/errors/AppError.ts:67`
**Severity**: HIGH

**Issue**: Generic Error objects expose full error message to client.

```typescript
if (error instanceof Error) {
  console.error('API Error:', error);
  return NextResponse.json(
    {
      error: error.message || 'An unexpected error occurred',  // ❌ May contain sensitive info
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

**Risks**:
- Stack traces may leak file paths
- Database errors may reveal schema
- API errors may contain sensitive data

**Fix**: Always return generic messages for 500 errors.

---

### 9. **NO INPUT LENGTH LIMITS**
**Files**: `jessica_core.py:/chat`, `frontend/app/api/chat/route.ts`
**Severity**: HIGH

**Issue**: No maximum length validation on user messages.

**Risks**:
- Memory exhaustion (large messages stored)
- Token cost explosion (Claude charges per token)
- Denial of service via large payloads
- Database storage bloat

**Fix Required**:
```python
if len(user_message) > 10000:  # 10K chars
    return jsonify({"error": "Message too long"}), 400
```

---

### 10. **CALENDAR EVENT DUPLICATE CODE**
**File**: `frontend/app/api/chat/route.ts:90-150`
**Severity**: MEDIUM (Code Quality)

**Issue**: Calendar event logic and memory retrieval duplicated twice.

**Impact**: Code maintenance, potential bugs from updating only one copy.

**Fix**: Extract to shared function.

---

### 11. **CONSOLE.LOG IN PRODUCTION CODE**
**Files**: Multiple API routes
**Severity**: MEDIUM

**Issue**: 30+ console.log statements in production code.

**Risks**:
- Sensitive data logged to stdout
- Performance impact
- Log spam in production

**Examples**:
- `frontend/app/api/transcribe/route.ts:27` - Logs file names
- `frontend/app/api/auth/token/route.ts:37` - Logs user IDs

**Fix**: Use proper logging library with levels, sanitize logs.

---

### 12. **NO REQUEST TIMEOUT ON FRONTEND FETCH CALLS**
**File**: `frontend/lib/api/aiFactory.ts:60-73`
**Severity**: MEDIUM

**Issue**: Fetch calls have no timeout, can hang indefinitely.

```typescript
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, provider: 'local' }),
  // ❌ No timeout
});
```

**Fix**: Add AbortController with timeout.

---

### 13. **GROK API NOT IMPLEMENTED**
**File**: `frontend/lib/api/aiFactory.ts:50-54`
**Severity**: MEDIUM

**Issue**: Grok returns placeholder, not real implementation.

```typescript
case 'grok': {
  const client = getGrokClient();
  return {
    content: 'Grok API integration pending',  // ❌ Not implemented
    provider: 'grok',
  };
}
```

**Impact**: Feature doesn't work, but no error shown to user.

**Fix**: Either implement or throw error.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 14. **MEMORY SEARCH RETURNS EMPTY ON ERROR**
**File**: `frontend/lib/services/memoryService.ts:42-61`
**Severity**: MEDIUM

**Issue**: On API error, returns empty array instead of throwing.

```typescript
} catch (error) {
  console.error('Error searching memories:', error);
  return [];  // ❌ Silent failure
}
```

**Impact**: Users don't know memory search failed, may make decisions without context.

**Fix**: Either throw error or return status object with error flag.

---

### 15. **NO VALIDATION ON MEMORY CONTEXT**
**File**: `frontend/app/api/chat/route.ts:47-51`
**Severity**: MEDIUM

**Issue**: MemoryContext not validated, could be any string.

```typescript
const memoryContexts: MemoryContext[] = Array.isArray(memoryStorageContexts) 
  ? memoryStorageContexts  // ❌ No validation
  : memoryStorageContexts 
    ? [memoryStorageContexts as MemoryContext]
    : [context];
```

**Fix**: Validate against allowed context values.

---

### 16. **THREAD SAFETY ISSUE IN MEMORY STORAGE**
**File**: `jessica_core.py:925-933`
**Severity**: MEDIUM

**Issue**: Thread.start() fires and forgets, no error handling.

```python
thread = threading.Thread(
    target=_store_memory_dual_sync,
    args=(user_message, jessica_response, provider_used),
    daemon=True
)
thread.start()  # ❌ No monitoring, errors silently lost
```

**Impact**: Memory storage failures are invisible.

**Fix**: Use thread pool with error callbacks or async tasks.

---

### 17. **FIREBASE CONFIG EXPOSED**
**File**: `frontend/lib/firebase/config.ts`
**Severity**: LOW (By Design, but document)

**Note**: Firebase config in client code is expected, but ensure:
- Firestore security rules are properly configured
- API key restrictions enabled in Firebase Console
- Domain restrictions for Firebase API key

---

### 18. **NO REQUEST ID TRACKING**
**Files**: All API routes
**Severity**: LOW (Observability)

**Issue**: No correlation ID for request tracing across services.

**Impact**: Difficult to debug issues across frontend -> backend -> AI APIs.

**Fix**: Add request ID header, log it everywhere.

---

### 19. **MAGIC NUMBERS AND STRINGS**
**File**: `frontend/app/api/chat/route.ts:30`
**Severity**: LOW

**Issue**: Hardcoded values like token expiry buffer (300000ms).

```typescript
if (tokenDoc.expires_at && Date.now() > tokenDoc.expires_at - 300000) {
  // ❌ Magic number
}
```

**Fix**: Extract to named constants.

---

### 20. **NO HEALTH CHECK ENDPOINT ON FRONTEND**
**Issue**: Backend has `/status`, frontend has no equivalent.

**Impact**: Can't monitor frontend API health.

**Fix**: Add `/api/health` endpoint.

---

### 21. **ANTHROPIC CLIENT CREATED ON EVERY REQUEST**
**File**: `frontend/lib/api/anthropic.ts:11-15`
**Severity**: LOW

**Issue**: New Anthropic client created per request.

```typescript
export function getAnthropicClient() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
  return client;
}
```

**Fix**: Cache client instance (singleton pattern).

---

### 22. **DUPLICATE MEMORY RETRIEVAL LOGIC**
**File**: `frontend/app/api/chat/route.ts:154-166` and `165-177`
**Severity**: LOW (DRY Violation)

**Issue**: Same memory retrieval code appears twice.

**Fix**: Extract to shared function.

---

### 23. **TOKEN EXPIRY CHECK INCORRECT**
**File**: `frontend/app/api/chat/route.ts:30-32`
**Severity**: MEDIUM

**Issue**: Token check has 5 minute buffer, but no refresh logic.

```typescript
if (tokenDoc.expires_at && Date.now() > tokenDoc.expires_at - 300000) {
  return null;  // ❌ Should try to refresh token
}
```

**Impact**: User gets "auth needed" message even though token could be refreshed.

**Fix**: Implement token refresh flow.

---

### 24. **UNHANDLED PROMISE REJECTIONS IN MEMORY STORAGE**
**Files**: Multiple (all `.catch()` calls)
**Severity**: MEDIUM

**Issue**: Promise rejections are logged but not monitored.

```typescript
).catch((err: Error) => console.error('[Chat API] Memory storage failed:', err));
```

**Impact**: No alerting when memory storage consistently fails.

**Fix**: Add error tracking service (e.g., Sentry).

---

### 25. **NO CSRF PROTECTION**
**Files**: All POST endpoints
**Severity**: HIGH (if not using SameSite cookies)

**Issue**: No CSRF tokens on state-changing operations.

**Fix**: Since using JWT-style auth, ensure tokens are in headers (not cookies), or implement CSRF tokens.

---

## 📊 SUMMARY BY SEVERITY

| Severity | Count | Action Required |
|----------|-------|-----------------|
| **Critical** | 5 | Fix IMMEDIATELY before multi-user launch |
| **High** | 8 | Fix before production release |
| **Medium** | 12 | Fix in next sprint |
| **Low** | 0 | Technical debt / nice-to-have |

---

## 🔥 PRIORITY FIX ORDER

### Phase 1: SECURITY (DO FIRST) 🚨
1. ✅ Fix authentication bypass (Issue #1)
2. ✅ Add CORS origin restrictions (Issue #2)
3. ✅ Move API keys to backend only (Issue #4)
4. ✅ Implement proper user isolation (Issue #3)
5. ✅ Add input validation (Issue #5)

### Phase 2: RELIABILITY
6. Add rate limiting (Issue #7)
7. Fix memory service signatures (Issue #6)
8. Add input length limits (Issue #9)
9. Add request timeouts (Issue #12)
10. Implement error monitoring (Issue #24)

### Phase 3: CODE QUALITY
11. Remove console.log (Issue #11)
12. Extract duplicate code (Issues #10, #22)
13. Sanitize error messages (Issue #8)
14. Add health checks (Issue #20)

---

## 🛡️ SECURITY CHECKLIST FOR LAUNCH

Before going multi-user:
- [ ] Real JWT authentication implemented
- [ ] CORS restricted to known origins
- [ ] All API keys moved to backend
- [ ] User isolation in memory/database
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized
- [ ] Logging properly configured
- [ ] Firebase security rules tested
- [ ] Token refresh flow working

---

## 📝 RECOMMENDED CHANGES

### Backend (jessica_core.py)

1. **Add user_id parameter to /chat endpoint**
```python
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_id = data.get('user_id')  # From JWT token
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    # Use user_id in memory operations
```

2. **Add CORS restrictions**
```python
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
```

3. **Add rate limiting**
```python
from flask_limiter import Limiter
limiter = Limiter(app, key_func=lambda: request.json.get('user_id'))
@limiter.limit("60/minute")
@app.route('/chat', methods=['POST'])
```

### Frontend

1. **Create backend proxy for all AI APIs**
```typescript
// DON'T: Call Anthropic from frontend
const client = getAnthropicClient();
await client.messages.create(...)

// DO: Call backend endpoint
await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message, provider: 'claude' })
})
```

2. **Implement proper auth middleware**
```typescript
import { verifyIdToken } from '@/lib/firebase/admin';

export async function requireAuth(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthenticationError();
  const decoded = await verifyIdToken(token);
  return { userId: decoded.uid };
}
```

---

## 🎯 TESTING RECOMMENDATIONS

1. **Security Testing**
   - Test auth bypass scenarios
   - Test CORS from different origins
   - Test rate limiting
   - Test input validation edge cases

2. **Load Testing**
   - Test concurrent requests
   - Test large message payloads
   - Test memory service under load

3. **Integration Testing**
   - Test memory storage across restarts
   - Test calendar integration
   - Test AI provider failover

---

## 📚 REFERENCES

- OWASP Top 10: https://owasp.org/Top10/
- Next.js Security: https://nextjs.org/docs/authentication
- Flask Security: https://flask.palletsprojects.com/en/stable/security/
- Firebase Security Rules: https://firebase.google.com/docs/rules

---

**Audited By**: Factory Droid
**Date**: December 6, 2025
**Status**: DRAFT - Awaiting Review

For the forgotten 99%, we rise. 🔥
