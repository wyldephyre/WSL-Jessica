# Security Quick Reference

## 🚨 Top 5 Critical Issues - MUST FIX BEFORE MULTI-USER

| # | Issue | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | **CORS Wide Open** | Any site can call API | 30 min | ⏸️ Not started |
| 2 | **No Real Auth** | Anyone can impersonate users | 2 hours | ⏸️ Not started |
| 3 | **API Keys in Frontend** | $$$$ cost exposure | 1 hour | ⏸️ Not started |
| 4 | **Single User Memory** | All users see each other's data | 1.5 hours | ⏸️ Not started |
| 5 | **No Input Validation** | Injection attacks possible | 30 min | ⏸️ Not started |

**Total Effort**: ~5.5 hours
**Risk if not fixed**: Cannot safely go multi-user

---

## 🔍 Quick Diagnosis

### Is authentication working?
```bash
# This should FAIL without a token
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Response should be: 401 Unauthorized
```

### Is CORS restricted?
```bash
# This should be BLOCKED
curl -H "Origin: http://evil.com" http://localhost:8000/status

# This should WORK
curl -H "Origin: http://localhost:3000" http://localhost:8000/status
```

### Are API keys hidden from frontend?
```bash
# Open browser dev tools on frontend
# Search Sources tab for: "ANTHROPIC_API_KEY"
# Should NOT find any API keys in bundled code
```

### Is user isolation working?
```python
# As user A: Store a memory
# As user B: Search for that memory
# Should NOT be returned
```

---

## 📝 Implementation Checklist

### Fix 1: CORS (30 min)
- [ ] Add `ALLOWED_ORIGINS` environment variable
- [ ] Update `CORS(app)` to use specific origins
- [ ] Test from allowed origin (should work)
- [ ] Test from disallowed origin (should fail)

### Fix 2: Authentication (120 min)
- [ ] Install `firebase-admin` Python package
- [ ] Create Firebase admin credentials JSON
- [ ] Implement `verify_firebase_token()` function
- [ ] Add `require_auth()` middleware
- [ ] Update all endpoints to require auth
- [ ] Update frontend to send JWT tokens
- [ ] Test login flow
- [ ] Test invalid token rejection

### Fix 3: Move API Keys (60 min)
- [ ] Create backend proxy endpoints (`/api/claude`, `/api/gemini`, `/api/grok`)
- [ ] Update frontend `aiFactory.ts` to call proxies
- [ ] Remove direct API client code from frontend
- [ ] Remove API keys from frontend `.env.local`
- [ ] Verify keys not in frontend bundle
- [ ] Test AI provider calls still work

### Fix 4: User Isolation (90 min)
- [ ] Remove `MEM0_USER_ID` constant
- [ ] Add `user_id` parameter to all memory functions
- [ ] Update `/chat` endpoint to accept `user_id`
- [ ] Update memory storage calls with user ID
- [ ] Update memory recall calls with user ID
- [ ] Create migration script for existing memories
- [ ] Test cross-user isolation

### Fix 5: Input Validation (30 min)
- [ ] Create `validate_user_id()` function
- [ ] Create `validate_message()` function
- [ ] Add validation to `/chat` endpoint
- [ ] Add validation to `/transcribe` endpoint
- [ ] Add length limits (10K chars for messages)
- [ ] Test with invalid inputs
- [ ] Test with oversized inputs

---

## 🧪 Test Commands

### Test Auth
```bash
# Get Firebase ID token (from browser dev tools after login)
TOKEN="eyJhbGc..."

# Valid request
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Hello", "user_id": "user123"}'

# Invalid token
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer INVALID" \
  -d '{"message": "Hello", "user_id": "user123"}'
# Should return 401
```

### Test Input Validation
```bash
# Empty message
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "", "user_id": "user123"}'
# Should return 400

# Message too long (>10K chars)
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "A_10001_CHAR_STRING...", "user_id": "user123"}'
# Should return 400

# Invalid user ID
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "test", "user_id": "user@#$%"}'
# Should return 400
```

### Test User Isolation
```python
# In Python shell or test script
from jessica_core import mem0_add_memory, mem0_search_memories

# User A stores memory
mem0_add_memory("My secret note", user_id="user_a")

# User B searches
results = mem0_search_memories("secret", user_id="user_b")
assert len(results) == 0, "User B should not see User A's memories"

# User A searches
results = mem0_search_memories("secret", user_id="user_a")
assert len(results) > 0, "User A should see their own memories"
```

---

## 🔐 Environment Variables Needed

### Backend (~/.bashrc or .env)
```bash
# CRITICAL: Add these for Phase 1
export ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
export FIREBASE_ADMIN_CREDENTIALS="/path/to/firebase-admin-sdk.json"

# Existing (keep these)
export ANTHROPIC_API_KEY="sk-ant-..."
export XAI_API_KEY="xai-..."
export GOOGLE_AI_API_KEY="AIza..."
export MEM0_API_KEY="mem0-..."
```

### Frontend (.env.local)
```bash
# REMOVE THESE (move to backend only):
# ANTHROPIC_API_KEY
# XAI_API_KEY
# GOOGLE_AI_API_KEY
# MEM0_API_KEY

# KEEP THESE (Firebase needs them client-side):
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

---

## 🎯 Success Criteria

**Phase 1 is complete when**:
- ✅ Unauthenticated requests return 401
- ✅ Invalid tokens rejected
- ✅ CORS blocks unknown origins
- ✅ User A cannot see User B's memories
- ✅ API keys not visible in frontend bundle
- ✅ Invalid inputs return 400 errors
- ✅ All integration tests pass

**Ready for multi-user when**:
- ✅ All Phase 1 fixes deployed
- ✅ Firebase security rules configured
- ✅ Error monitoring active
- ✅ Rate limiting implemented
- ✅ Backup/recovery tested

---

## 📞 If Something Breaks

### Auth not working
1. Check Firebase credentials file exists
2. Verify `FIREBASE_ADMIN_CREDENTIALS` path is correct
3. Check Firebase project ID matches
4. Verify user has valid ID token (check expiry)

### CORS errors
1. Check `ALLOWED_ORIGINS` environment variable
2. Verify origin in request matches allowed list
3. Check browser console for CORS error details
4. Ensure frontend is running on allowed port

### Memory not storing
1. Check user_id is being passed correctly
2. Verify Mem0 API key still valid
3. Check network requests in browser dev tools
4. Look for errors in backend logs

### API keys still exposed
1. Clear Next.js build cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Search production bundle for keys
4. Verify `.env.local` doesn't have server-only keys

---

## 🔗 Full Documentation

- **Complete Audit**: See `CODE_AUDIT_2025-12-06.md`
- **Implementation Guide**: See `SECURITY_FIX_PLAN.md`
- **Summary**: See `AUDIT_SUMMARY.txt`

---

**Last Updated**: December 6, 2025
**Status**: Phase 1 not started
**Next Action**: Review with Corporal Phyre, then implement

For the forgotten 99%, we rise. 🔥

