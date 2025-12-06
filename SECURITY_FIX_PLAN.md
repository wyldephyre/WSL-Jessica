# Security Fix Implementation Plan

## Overview
Prioritized plan to fix the 5 CRITICAL security issues found in audit.

**Timeline**: Phase 1 must be completed before multi-user launch
**Estimated Effort**: 4-6 hours total

---

## 🚨 PHASE 1: CRITICAL SECURITY FIXES (DO FIRST)

### Fix 1: CORS Origin Restrictions (30 min)
**File**: `jessica_core.py:25`
**Priority**: CRITICAL
**Complexity**: LOW

**Current Code**:
```python
CORS(app)  # Enable CORS for frontend access
```

**Fixed Code**:
```python
# CORS configuration - restrict to known origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, 
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-User-ID"],
     methods=["GET", "POST", "OPTIONS"])
```

**Environment Variable**:
Add to `.env` or `~/.bashrc`:
```bash
export ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

**Testing**:
```bash
# Should work
curl -H "Origin: http://localhost:3000" http://localhost:8000/status

# Should be blocked
curl -H "Origin: http://evil.com" http://localhost:8000/status
```

---

### Fix 2: User Isolation in Backend (90 min)
**File**: `jessica_core.py` (multiple locations)
**Priority**: CRITICAL
**Complexity**: MEDIUM

**Changes Required**:

1. **Remove hardcoded user ID**:
```python
# BEFORE
MEM0_USER_ID = "PhyreBug"

# AFTER
# MEM0_USER_ID removed - now passed as parameter
```

2. **Update /chat endpoint to accept user_id**:
```python
@app.route('/chat', methods=['POST'])
def chat():
    if not request.json or 'message' not in request.json:
        return jsonify({"error": "Missing 'message' field"}), 400
    
    data = request.json
    user_message = data['message']
    user_id = data.get('user_id', 'default-user')  # Required in production
    
    # TODO: In production, validate user_id against JWT token
    if not user_id or len(user_id) < 3:
        return jsonify({"error": "Invalid user_id"}), 400
```

3. **Update memory functions to use user_id**:
```python
def mem0_add_memory(content: str, user_id: str, metadata: dict = None) -> dict:
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
            "user_id": user_id  # Use passed user_id, not hardcoded
        }
        # ... rest of function
```

4. **Update all memory function calls**:
- `_store_memory_dual_sync(user_message, jessica_response, provider_used, user_id)`
- `store_memory_dual(user_message, jessica_response, provider_used, user_id)`
- `recall_memory_dual(query, user_id)`

**Files to Modify**:
- Lines 49: Remove MEM0_USER_ID constant
- Lines 764-791: Update mem0_add_memory
- Lines 793-841: Update mem0_search_memories, mem0_get_all_memories
- Lines 886-933: Update memory storage functions
- Lines 968-1030: Update /chat endpoint

---

### Fix 3: Move API Keys to Backend Only (60 min)
**Priority**: CRITICAL
**Complexity**: MEDIUM

**Problem**: Frontend directly calls AI APIs with exposed keys.

**Solution**: Create backend proxy endpoints.

**New Backend Endpoints** (`jessica_core.py`):
```python
@app.route('/api/claude', methods=['POST'])
def proxy_claude():
    """Proxy endpoint for Claude API - keeps key server-side"""
    if not request.json or 'message' not in request.json:
        return jsonify({"error": "Missing message"}), 400
    
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 401
    
    message = request.json['message']
    system_prompt = request.json.get('system_prompt', '')
    
    response = call_claude_api(message, system_prompt)
    return jsonify({"response": response, "provider": "claude"})

@app.route('/api/gemini', methods=['POST'])
def proxy_gemini():
    """Proxy endpoint for Gemini API"""
    # Similar to above
    
@app.route('/api/grok', methods=['POST'])
def proxy_grok():
    """Proxy endpoint for Grok API"""
    # Similar to above
```

**Frontend Changes** (`frontend/lib/api/aiFactory.ts`):
```typescript
// BEFORE: Direct API calls with exposed keys
const client = getAnthropicClient();
const response = await client.messages.create({...});

// AFTER: Call backend proxy
const response = await fetch('http://localhost:8000/api/claude', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message,
    system_prompt: systemPrompt,
    user_id: userId,  // From auth
  }),
});
```

**Files to Remove/Modify**:
- `frontend/lib/api/anthropic.ts` - Remove direct Anthropic client usage
- `frontend/lib/api/gemini.ts` - Remove direct Gemini client usage
- `frontend/lib/api/grok.ts` - Remove direct Grok client usage
- `frontend/lib/services/memoryService.ts` - Proxy memory API calls

---

### Fix 4: Implement Real Authentication (120 min)
**Files**: `frontend/lib/middleware/auth.ts`, all API routes
**Priority**: CRITICAL
**Complexity**: HIGH

**Firebase Admin Setup** (Backend):
```python
# New file: firebase_admin.py
import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_ADMIN_CREDENTIALS")
if cred_path:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token: str) -> dict:
    """Verify Firebase ID token and return decoded token"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {"uid": decoded_token['uid'], "email": decoded_token.get('email')}
    except Exception as e:
        raise ValueError(f"Invalid token: {e}")
```

**Backend Middleware**:
```python
# jessica_core.py
from firebase_admin import verify_firebase_token

def require_auth():
    """Middleware to require authentication"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.replace('Bearer ', '')
    try:
        user_info = verify_firebase_token(token)
        return user_info
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@app.route('/chat', methods=['POST'])
def chat():
    # Require authentication
    auth_result = require_auth()
    if isinstance(auth_result, tuple):  # Error response
        return auth_result
    
    user_id = auth_result['uid']
    # ... rest of endpoint
```

**Frontend Middleware** (`frontend/lib/middleware/auth.ts`):
```typescript
import { auth } from '@/firebase';

export async function requireAuth(request: NextRequest): Promise<{ userId: string, token: string }> {
  // Get Firebase ID token from request header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing authentication token');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify token is still valid (Firebase SDK handles this)
    const user = auth.currentUser;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }
    
    return { 
      userId: user.uid,
      token: token
    };
  } catch (error) {
    throw new AuthenticationError('Invalid authentication token');
  }
}
```

**Dependencies to Add**:
```bash
# Backend
pip install firebase-admin

# Frontend (already installed)
# @firebase/auth
```

---

### Fix 5: Input Validation & Sanitization (30 min)
**Files**: `jessica_core.py`, all API routes
**Priority**: CRITICAL
**Complexity**: LOW

**Add Validation Function**:
```python
def validate_user_id(user_id: str) -> bool:
    """Validate user ID format"""
    if not user_id or len(user_id) < 3 or len(user_id) > 128:
        return False
    # Only allow alphanumeric, dash, underscore
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        return False
    return True

def validate_message(message: str) -> tuple[bool, str]:
    """Validate message content"""
    if not isinstance(message, str):
        return False, "Message must be a string"
    
    if len(message.strip()) == 0:
        return False, "Message cannot be empty"
    
    if len(message) > 10000:  # 10K char limit
        return False, "Message too long (max 10,000 characters)"
    
    return True, ""
```

**Apply Validation**:
```python
@app.route('/chat', methods=['POST'])
def chat():
    if not request.json or 'message' not in request.json:
        return jsonify({"error": "Missing 'message' field"}), 400
    
    data = request.json
    user_message = data['message']
    user_id = data.get('user_id')
    
    # Validate user_id
    if not validate_user_id(user_id):
        return jsonify({"error": "Invalid user_id"}), 400
    
    # Validate message
    is_valid, error_msg = validate_message(user_message)
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    
    # ... rest of endpoint
```

---

## 📋 PHASE 1 CHECKLIST

- [ ] Fix 1: CORS restrictions (30 min)
- [ ] Fix 2: User isolation (90 min)
- [ ] Fix 3: Move API keys to backend (60 min)
- [ ] Fix 4: Real authentication (120 min)
- [ ] Fix 5: Input validation (30 min)

**Total Estimated Time**: 5.5 hours

---

## 🧪 TESTING PLAN

### Test Authentication
```bash
# Should fail (no auth)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Should work (with token)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"message": "test", "user_id": "user123"}'
```

### Test User Isolation
1. Create two test users
2. Store memories for user A
3. Try to retrieve as user B
4. Should get empty results (no cross-contamination)

### Test Input Validation
```bash
# Should fail (too long)
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "VERY_LONG_STRING_10K_CHARS...", "user_id": "user123"}'

# Should fail (invalid user_id)
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "test", "user_id": "user@#$%"}'
```

---

## 🚨 PHASE 2: HIGH PRIORITY (NEXT SPRINT)

After Phase 1 is complete and tested:

1. **Add Rate Limiting** (Issue #7)
2. **Fix Memory Service Signatures** (Issue #6)
3. **Add Request Timeouts** (Issue #12)
4. **Implement Error Monitoring** (Issue #24)
5. **Token Refresh Flow** (Issue #23)

---

## 📝 DEPLOYMENT NOTES

### Environment Variables Needed
```bash
# Backend (.env or ~/.bashrc)
export ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
export FIREBASE_ADMIN_CREDENTIALS="/path/to/firebase-admin-key.json"
export NODE_ENV="production"

# Frontend (.env.local)
# Remove these (move to backend):
# ANTHROPIC_API_KEY
# GOOGLE_AI_API_KEY
# XAI_API_KEY
# MEM0_API_KEY

# Keep these (Firebase client needs them):
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
```

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /oauth_tokens/{tokenId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
    
    match /audio_dumps/{dumpId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## ⚠️ BREAKING CHANGES

These fixes will break existing functionality:

1. **All API calls now require authentication**
   - Frontend must send Firebase ID token in Authorization header
   - Users must be logged in to use Jessica

2. **Memory is now user-isolated**
   - Existing memories tied to "PhyreBug" need migration
   - Each user gets separate memory space

3. **Frontend can't call AI APIs directly**
   - Must use backend proxy endpoints
   - Update all `callAIProvider` calls

**Migration Script Needed**: Move existing PhyreBug memories to proper user ID.

---

## 🎯 SUCCESS CRITERIA

Phase 1 complete when:
- ✅ CORS only allows configured origins
- ✅ All endpoints require valid Firebase auth token
- ✅ User A cannot access User B's memories
- ✅ No API keys in frontend bundle
- ✅ All inputs validated and sanitized
- ✅ Security tests pass
- ✅ Integration tests pass

---

**Status**: READY TO IMPLEMENT
**Risk**: Medium (breaking changes)
**Reward**: Production-ready security

For the forgotten 99%, we rise. 🔥
