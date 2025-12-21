# Jessica Quick Start Checklist
**Use this to get Jessica running RIGHT NOW**

---

## ✅ Pre-Flight Check (5 minutes)

### 1. Verify Ollama Models
```bash
# In WSL Ubuntu terminal
ollama list | grep -E "jessica|nous-hermes2:10.7b-solar-q5_K_M"
```

**If missing models:**
```bash
cd ~/jessica-core
./setup-jessica-models.sh
```

### 2. Verify API Keys
```bash
# In WSL Ubuntu terminal
source ~/.bashrc
env | grep -E "ANTHROPIC|XAI|GOOGLE|LETTA|ZO" | head -5
```

**Should show at least 3 keys (ANTHROPIC, XAI, GOOGLE). LETTA and ZO are optional. If not, check ~/.bashrc**

### 3. Kill Stuck Processes
```bash
# In WSL Ubuntu terminal
pkill -f jessica_core.py
pkill -f memory_server.py
pkill -f whisper_server.py
pkill ollama
```

### 4. Verify Ports Free
```bash
# In WSL Ubuntu terminal
lsof -i:11434  # Should be empty or show Ollama
lsof -i:5001   # Should be empty (Memory Server)
lsof -i:8000   # Should be empty (Jessica Core)
```

---

## 🚀 Startup (3 Terminals)

### Terminal 1: Ollama (WSL Ubuntu)
```bash
ollama serve
```
**Keep this terminal open!**

### Terminal 2: Backend (WSL Ubuntu)
```bash
cd ~/jessica-core
source ~/.bashrc          # CRITICAL!
source venv/bin/activate
./start-jessica.sh
```

**Wait for:**
```
========================================
All services started!
========================================
```

### Terminal 3: Frontend (PowerShell)
```powershell
cd "D:\App Development\jessica-ai\frontend"
npm run dev
```

**Wait for:**
```
  ▲ Next.js 16.0.1
  - Local:        http://localhost:3000
```

---

## ✅ Verification (2 minutes)

### 1. Check Backend Status
```bash
# In WSL Ubuntu terminal
curl http://localhost:8000/status
```

**Should return JSON with all services showing `"available": true`**

### 2. Test Chat
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hey Jessica"}'
```

**Should get response with Jessica's personality**

### 3. Open Browser
Navigate to: `http://localhost:3000`

**Test chat interface**

---

## 🐛 Troubleshooting

### "Ollama is not running"
**Fix:** Start Terminal 1 first (`ollama serve`)

### "jessica model not found"
**Fix:** Run `./setup-jessica-models.sh`

### "API keys not configured"
**Fix:** Run `source ~/.bashrc` before starting

### "Port already in use"
**Fix:** Kill processes (see Pre-Flight Check #3)

### "Memory Server health check fails"
**Fix:** Wait 15 seconds - first load takes time (expected)

### Frontend can't connect
**Fix:** 
1. Verify backend: `curl http://localhost:8000/status`
2. Check frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## 📋 Quick Reference

**Service Ports:**
- 11434: Ollama
- 5001: Memory Server (ChromaDB)
- 8000: Jessica Core
- 3000: Frontend

**Log Locations:**
- `~/jessica-core/logs/jessica-core.log`
- `~/jessica-core/logs/memory-server.log`

**Stop All Services:**
```bash
pkill -f jessica_core.py
pkill -f memory_server.py
pkill ollama
```

---

**For the forgotten 99%, we rise. 🔥**

