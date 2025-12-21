# Quick Start Guide - Jessica Services

**Created:** 11 December 2025, 22:06

## Start All Services

### Step 1: Start Ollama (WSL Terminal)
```bash
# Check if running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
# (Keep this terminal open, or run in background:)
# nohup ollama serve > /dev/null 2>&1 &
```

### Step 2: Start Backend Services (WSL Terminal)
```bash
cd ~/jessica-core
source ~/.bashrc          # Load API keys
bash start-jessica.sh     # Starts Memory, Whisper, and Jessica Core
```

This will start:
- Memory Server (port 5001)
- Whisper Server (port 5000)  
- Jessica Core (port 8000)

### Step 3: Start Frontend (WSL Terminal)
```bash
cd ~/jessica-core/frontend
npm run dev
```

Frontend runs on: http://localhost:3000

## Verify Services

```bash
# Check backend status
curl http://localhost:8000/status

# Check Ollama
curl http://localhost:11434/api/tags
```

## Stop Services

```bash
# Stop backend services
pkill -f memory_server.py
pkill -f whisper_server.py
pkill -f jessica_core.py

# Stop Ollama
pkill ollama
```

## Service Ports
- Ollama: 11434
- Memory Server: 5001
- Whisper Server: 5000
- Jessica Core: 8000
- Frontend: 3000
