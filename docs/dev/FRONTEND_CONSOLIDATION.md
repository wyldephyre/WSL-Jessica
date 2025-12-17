# Frontend Consolidation - WSL Only

**Date:** 2025-01-XX  
**Status:** ✅ Complete

## Problem

Jessica had two frontend locations causing confusion:
- WSL: `/home/phyre/jessica-core/frontend/` (active codebase)
- Windows: `D:\App Development\jessica-ai\frontend\` (legacy, referenced in docs)

Additionally, the 'local' provider in `aiFactory.ts` was calling the backend directly instead of going through Next.js API routes, causing connectivity issues when frontend ran in different environments.

## Solution

### 1. Consolidated to WSL Frontend Only
- All frontend code is now in `/home/phyre/jessica-core/frontend/`
- Updated all documentation to reflect WSL-only location
- Removed references to Windows frontend path

### 2. Fixed API Connectivity
- Created `/api/chat/local/route.ts` - dedicated Next.js API route for local provider
- Updated `aiFactory.ts` to route 'local' provider through `/api/chat/local` instead of direct backend call
- All providers now consistently use Next.js API routes (server-side), ensuring proper WSL network connectivity

### 3. Configuration
- Created `.env.local.example` with default `NEXT_PUBLIC_API_URL=http://localhost:8000`
- This works because Next.js API routes run server-side in WSL, so `localhost:8000` correctly connects to the backend

## Files Changed

### Created
- `frontend/app/api/chat/local/route.ts` - New API route for local provider
- `frontend/.env.local.example` - Environment configuration template

### Modified
- `frontend/lib/api/aiFactory.ts` - Fixed 'local' provider to use Next.js API route
- `AGENTS.md` - Updated all frontend paths to WSL
- `Documents/START_ALL_SERVICES.md` - Updated frontend startup instructions
- `Documents/START_JESSICA.md` - Updated frontend startup instructions

## How It Works Now

1. **Browser** → Calls `/api/chat` (Next.js API route)
2. **Next.js API Route** (`/api/chat/route.ts`) → Calls `callAIProvider('local', ...)`
3. **aiFactory** → Routes to `/api/chat/local` (Next.js API route)
4. **Local API Route** (`/api/chat/local/route.ts`) → Proxies to `http://localhost:8000/chat` (server-side in WSL)
5. **Backend** → Processes request and returns response

All network calls happen server-side in WSL, so `localhost:8000` works correctly.

## Startup Instructions (Updated)

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend Services
cd ~/jessica-core
source ~/.bashrc
source venv/bin/activate
bash start-jessica.sh

# Terminal 3: Frontend
cd ~/jessica-core/frontend
npm run dev
```

All services now run in WSL. Frontend accessible at http://localhost:3000

## Testing

1. Start all services (see above)
2. Open http://localhost:3000
3. Send a message using 'local' provider
4. Should connect successfully to backend

## Notes

- The `client.ts` file still has direct backend calls, but it's not used in the main chat flow
- Main flow goes through Next.js API routes which are fixed
- If `client.ts` is used elsewhere, it may need similar fixes

