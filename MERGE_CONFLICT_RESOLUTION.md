# Merge Conflict Resolution Guide

This document provides step-by-step instructions for resolving merge conflicts when merging `main` into `bugbot-review`.

## Strategy

Our refactor removed Google Workspace integrations and migrated to Letta/Zo. The conflicts occur because:
- We **deleted** Google Workspace files (calendar, gmail, docs routes)
- We **modified** core files (jessica_core.py, chat route, package.json)
- Main branch still has the old Google Workspace code

## Resolution Approach

**For deleted files:** Accept our deletion (they should be removed)
**For modified files:** Accept our changes (our refactor is the correct version)

---

## File-by-File Resolution

### 1. `frontend/app/api/calendar/create/route.ts`
**Status:** We deleted this file (Google Workspace removed)
**Resolution:** 
- If conflict shows "deleted by us, modified by them"
- **Accept deletion** - remove the file entirely
- Command: `git rm frontend/app/api/calendar/create/route.ts`

### 2. `frontend/lib/api/google-calendar.ts`
**Status:** We deleted this file (Google Workspace removed)
**Resolution:**
- **Accept deletion** - remove the file entirely
- Command: `git rm frontend/lib/api/google-calendar.ts`

### 3. `frontend/app/api/chat/route.ts`
**Status:** We refactored this (removed Google Workspace, added agent logging helper)
**Resolution:**
- **Accept our version** (bugbot-review branch)
- Our version has:
  - Agent logging helper function
  - Removed Google Workspace intent detection
  - Clean structure

### 4. `frontend/app/api/mcp/route.ts`
**Status:** We kept this but it may have changes in main
**Resolution:**
- **Accept our version** - we have MCP disabled comments which are correct
- Our version shows MCP is not yet implemented

### 5. `frontend/app/api/mcp/test/route.ts`
**Status:** Similar to mcp/route.ts
**Resolution:**
- **Accept our version** - consistent with our MCP status

### 6. `frontend/app/api/memory/test/route.ts`
**Status:** We updated this to use Letta instead of Mem0
**Resolution:**
- **Accept our version** - we changed MEM0_API_KEY to LETTA_API_KEY
- Our version has the correct Letta integration

### 7. `frontend/app/dashboard/page.tsx`
**Status:** We removed Firebase task fetching (Zo handles tasks now)
**Resolution:**
- **Accept our version** - we have TODO comments for Zo integration
- Our version removed Firebase imports and task fetching

### 8. `frontend/app/page.tsx`
**Status:** We removed shortcuts and Firebase task fetching
**Resolution:**
- **Accept our version** - we removed shortcuts section and Firebase
- Our version has clean structure without deleted pages

### 9. `frontend/lib/services/memoryService.ts`
**Status:** We kept this but may have minor changes
**Resolution:**
- **Accept our version** - our refactor maintained this file's structure
- Check if main has any critical fixes we need

### 10. `frontend/package.json`
**Status:** We removed @google/generative-ai and @vercel/blob
**Resolution:**
- **Accept our version** - we removed unused dependencies
- Our version is cleaner

### 11. `frontend/package-lock.json`
**Status:** Auto-generated, will update after package.json resolution
**Resolution:**
- **Accept our version** first
- Then run: `npm install` to regenerate if needed

### 12. `jessica_core.py`
**Status:** Major refactor - Mem0 → Letta, agent logging cleanup
**Resolution:**
- **Accept our version** - this is the core of our refactor
- Our version has:
  - Letta integration functions
  - Deprecated Mem0 functions
  - Agent logging helper
  - Updated status endpoint
  - Updated validate_environment()

---

## Quick Resolution Commands

Run these in WSL terminal after `git merge origin/main` shows conflicts:

```bash
# For deleted Google Workspace files - accept deletion
git rm frontend/app/api/calendar/create/route.ts 2>/dev/null || true
git rm frontend/lib/api/google-calendar.ts 2>/dev/null || true

# For all modified files - accept our version (bugbot-review)
git checkout --ours frontend/app/api/chat/route.ts
git checkout --ours frontend/app/api/mcp/route.ts
git checkout --ours frontend/app/api/mcp/test/route.ts
git checkout --ours frontend/app/api/memory/test/route.ts
git checkout --ours frontend/app/dashboard/page.tsx
git checkout --ours frontend/app/page.tsx
git checkout --ours frontend/lib/services/memoryService.ts
git checkout --ours frontend/package.json
git checkout --ours frontend/package-lock.json
git checkout --ours jessica_core.py

# Stage all resolutions
git add .

# Complete the merge
git commit -m "Resolve merge conflicts: Accept refactor changes (Letta/Zo migration)"
```

---

## Manual Review Needed

After using `--ours`, manually verify these files don't have issues:
1. `frontend/lib/services/memoryService.ts` - check if main had any fixes we need
2. `jessica_core.py` - verify no critical fixes from main were lost

---

## After Resolution

1. Test the application
2. Push the resolved merge: `git push origin bugbot-review`
3. The PR should update and conflicts should be resolved
4. Then trigger Bugbot: Comment `bugbot run` in the PR

