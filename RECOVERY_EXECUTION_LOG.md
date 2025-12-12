# RECOVERY EXECUTION LOG
**Started:** 2025-01-XX  
**Status:** In Progress

---

## PHASE 1: VERIFY & RESTORE DEPENDENCIES

### Step 1.1: Verify Current State
**Status:** ⏳ PENDING MANUAL EXECUTION

Run these commands in WSL Ubuntu terminal:
```bash
cd /home/phyre/jessica-core
ls -la venv/
python3 --version
```

### Step 1.2: Reinstall Dependencies
**Status:** ⏳ PENDING MANUAL EXECUTION

Run these commands:
```bash
cd /home/phyre/jessica-core
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip list | grep -E "chromadb|flask|flask-cors|python-dotenv"
```

### Step 1.3: Test Imports
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
cd /home/phyre/jessica-core
source venv/bin/activate
python3 test_imports.py
```

**Expected Output:**
```
✓ Flask
✓ Flask-CORS
✓ ChromaDB
✓ Anthropic
✓ Google Generative AI
✓ python-dotenv
✓ sentence-transformers

✅ ALL IMPORTS SUCCESSFUL!
```

---

## PHASE 2: VERIFY GITHUB REPOSITORY STATE

### Step 2.1: Check Git Status
**Status:** ✅ VERIFIED (via file check)
- Remote URL: `https://github.com/wyldephyre/WSL-Jessica.git` ✓
- Branch: `main` ✓
- Credential helper: `store` ✓

### Step 2.2: Verify Critical Files
**Status:** ✅ VERIFIED
- `jessica_core.py` ✓
- `memory_server.py` ✓
- `whisper_server.py` ✓
- `requirements.txt` ✓ (with fixes)
- `start-jessica.sh` ✓

### Step 2.3: Commit Current Fixes
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
cd /home/phyre/jessica-core
git add requirements.txt CODE_AUDIT_REPORT.md RECOVERY_PLAN.md RECOVERY_EXECUTION_LOG.md
git status
git commit -m "Fix: Add missing dependencies to requirements.txt + recovery plan"
git push origin main
```

---

## PHASE 3: VERIFY SERVICE DEPENDENCIES

### Step 3.1: Check Ollama Status
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
curl http://localhost:11434/api/tags
```

If not running:
```bash
ollama serve
# (Keep terminal open or run in background: nohup ollama serve > /dev/null 2>&1 &)
```

### Step 3.2: Verify API Keys
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
source ~/.bashrc
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}"
echo "XAI_API_KEY: ${XAI_API_KEY:+SET}"
echo "GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY:+SET}"
echo "MEM0_API_KEY: ${MEM0_API_KEY:+SET}"
```

All should show "SET"

### Step 3.3: Check Port Availability
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
lsof -i:5000 -i:5001 -i:8000 || echo "Ports available"
```

---

## PHASE 4: START SERVICES & VALIDATE

### Step 4.1: Start All Services
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
cd /home/phyre/jessica-core
source ~/.bashrc
~/start-jessica.sh
```

### Step 4.2: Verify Services Started
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
curl http://localhost:5001/health  # Memory Server
curl http://localhost:5000/health  # Whisper Server
curl http://localhost:8000/status  # Jessica Core
cat /tmp/jessica-*.pid
```

### Step 4.3: Test Basic Functionality
**Status:** ⏳ PENDING MANUAL EXECUTION

Run:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

---

## NOTES

- Terminal execution is blocked in current environment
- All commands need to be run manually in WSL Ubuntu terminal
- Phase 2 (Git verification) is already complete via file checks
- Dependencies are fixed in requirements.txt, just need installation verification

---

*Execution log created by Factory Droid*

