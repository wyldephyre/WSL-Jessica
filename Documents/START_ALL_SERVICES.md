# Start All Jessica Services - Step by Step

**Created:** 11 December 2025

## Quick Start (3 Terminals)

### Terminal 1: Ollama (WSL)
```bash
ollama serve
```
**Keep this terminal open.** Ollama must stay running.

### Terminal 2: Backend Services (WSL)
```bash
cd ~/jessica-core
source ~/.bashrc          # CRITICAL: Load API keys
source venv/bin/activate
bash start-jessica.sh
```
**Keep this terminal open.** This starts:
- Memory Server (port 5001)
- Whisper Server (port 5000)
- Jessica Core (port 8000)

### Terminal 3: Frontend (WSL)
```bash
cd ~/jessica-core/frontend
npm run dev
```
**Keep this terminal open.** Frontend runs on http://localhost:3000

## Verification

After all services start, verify they're working:

```bash
# Check backend status
curl http://localhost:8000/status

# Should return JSON with all services showing "available": true
```

Then test in browser at http://localhost:3000

## Important Notes

- **First message may take 10-20 seconds** - ONNX embedding model loads on first use
- **All fixes are in place:** Logging error fixed, timeout increased to 20 seconds
- **Keep all terminals open** - Services run in foreground

## If Services Won't Start

**Port already in use:**
```bash
# Kill existing processes
pkill -f jessica_core.py
pkill -f memory_server.py
pkill -f whisper_server.py
pkill ollama
```

Then restart from Terminal 1.
