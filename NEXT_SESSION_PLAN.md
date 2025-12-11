# Jessica Core - Next Session Plan
**Date:** January XX, 2025  
**Status:** Ready to Execute  
**Based on:** Comprehensive Audit 2025-01-XX

---

## 🎯 SESSION GOAL

Complete **Quick Wins** security improvements:
1. Update frontend to use backend proxy endpoints (fixes API key exposure)
2. Move CORS origins to environment variable (production-ready)
3. Add input sanitization (better security)

**Estimated Time:** 1.5 hours  
**Token Strategy:** Use o1-mini or claude-haiku (cheaper models)  
**Risk Level:** Low (well-defined changes)

---

## 📋 TASKS BREAKDOWN

### Task 1: Update Frontend to Use Backend Proxies (60 min)
**Priority:** CRITICAL  
**Impact:** Fixes API key exposure in browser

**Files to Modify:**
- `frontend/lib/api/aiFactory.ts` - Main AI factory
- `frontend/lib/services/memoryService.ts` - Memory service (if needed)

**Changes:**
1. Replace direct Anthropic API calls with `POST /api/proxy/claude`
2. Replace direct Grok API calls with `POST /api/proxy/grok`
3. Replace direct Gemini API calls with `POST /api/proxy/gemini`
4. Remove API key imports from frontend
5. Update error handling for proxy responses

**Backend Endpoints (Already Exist):**
- ✅ `/api/proxy/claude` (line 1347)
- ✅ `/api/proxy/grok` (line 1389)
- ✅ `/api/proxy/gemini` (line 1429)

**Test:**
- Verify frontend still works
- Check browser DevTools - no API keys visible
- Test all three AI providers

---

### Task 2: Move CORS Origins to Environment Variable (15 min)
**Priority:** HIGH  
**Impact:** Production-ready configuration

**File to Modify:**
- `jessica_core.py` (line 45)

**Current Code:**
```python
CORS(app, 
     origins=["http://localhost:3000", "https://localhost:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Request-ID", "X-User-ID"])
```

**New Code:**
```python
# CORS configuration - restrict to known origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, 
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Request-ID", "X-User-ID"])
```

**Environment Variable:**
Add to `~/.bashrc`:
```bash
export ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

**Test:**
- Verify CORS still works with localhost
- Test with multiple origins (comma-separated)

---

### Task 3: Add Input Sanitization (30 min)
**Priority:** MEDIUM  
**Impact:** Better security against injection attacks

**File to Modify:**
- `jessica_core.py`

**Add Function:**
```python
import re

def sanitize_input(text: str, max_length: int = 10000) -> str:
    """Sanitize user input to prevent injection attacks
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized text
    """
    if not isinstance(text, str):
        raise ValidationError("Input must be a string")
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Truncate if too long
    if len(text) > max_length:
        text = text[:max_length]
    
    # Remove control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)
    
    return text.strip()
```

**Apply in `/chat` endpoint:**
```python
# After validation, before processing
user_message = sanitize_input(user_message)
```

**Test:**
- Test with special characters
- Test with null bytes
- Test with very long input
- Verify normal messages still work

---

## ✅ SUCCESS CRITERIA

**Session Complete When:**
- [ ] Frontend uses backend proxy endpoints (no direct API calls)
- [ ] No API keys visible in browser DevTools
- [ ] CORS origins configurable via environment variable
- [ ] Input sanitization function added and applied
- [ ] All existing functionality still works
- [ ] Tests pass (if applicable)

---

## 🧪 TESTING CHECKLIST

### Manual Testing
- [ ] Start Jessica services (`~/start-jessica.sh`)
- [ ] Start frontend (`npm run dev`)
- [ ] Test chat with local model
- [ ] Test chat with Claude (via proxy)
- [ ] Test chat with Grok (via proxy)
- [ ] Test chat with Gemini (via proxy)
- [ ] Check browser DevTools - verify no API keys
- [ ] Test CORS with different origins
- [ ] Test input sanitization with special characters

### Verification
- [ ] All AI providers respond correctly
- [ ] Memory storage/recall still works
- [ ] Error handling works for proxy failures
- [ ] No console errors in browser
- [ ] No errors in backend logs

---

## 📝 NOTES

### What NOT to Change
- ❌ Don't modify `master_prompt.txt` (personality)
- ❌ Don't change routing logic (works well)
- ❌ Don't modify memory system (solid design)
- ❌ Don't break single-user mode (current setup)

### Token-Saving Tips
- Use **o1-mini** or **claude-haiku** for this session
- These are straightforward code changes, not complex reasoning
- Save **claude-sonnet** for complex problems

### If You Get Stuck
1. Check existing proxy endpoint implementations
2. Review `SECURITY_FIX_PLAN.md` for reference
3. Look at similar patterns in codebase
4. Ask for clarification (one step at a time)

---

## 🚀 AFTER THIS SESSION

**Next Priorities:**
1. Add integration tests
2. Add frontend tests
3. Fix memory service health check
4. Complete or remove MCP module

**Or:**
- Continue with feature work (Google Calendar, etc.)
- Focus on other priorities

---

## 📊 PROGRESS TRACKING

### This Session
- [ ] Task 1: Frontend proxy endpoints
- [ ] Task 2: CORS env var
- [ ] Task 3: Input sanitization

### Future Sessions
- [ ] Integration tests
- [ ] Frontend tests
- [ ] Memory health check fix
- [ ] MCP module cleanup

---

**For the forgotten 99%, we rise. 🔥**

*Ready to execute - let's ship it!*

