# JESSICA CORE - RECOVERY PLAN
**Date:** 2025-01-XX  
**Issue:** GitHub migration caused dependency loss  
**Status:** Planning Phase

---

## SITUATION ASSESSMENT

### What Happened
- GitHub account migration disrupted repository access
- Dependencies were lost or not properly tracked
- `requirements.txt` was missing 4 critical dependencies:
  - `chromadb` (vector database)
  - `flask` (web framework)
  - `flask-cors` (CORS handling)
  - `python-dotenv` (environment variables)

### Current Status
- ✅ **FIXED:** `requirements.txt` now includes all missing dependencies
- ✅ **VERIFIED:** Git repository correctly configured
- ⏳ **PENDING:** Dependency installation verification
- ⏳ **PENDING:** Service startup validation

---

## RECOVERY PLAN - PHASE BY PHASE

### PHASE 1: VERIFY & RESTORE DEPENDENCIES
**Priority:** 🔴 **CRITICAL - DO FIRST**  
**Time Estimate:** 15-30 minutes  
**Risk:** Low (already fixed in requirements.txt)

#### Step 1.1: Verify Current State
```bash
# In WSL Ubuntu terminal
cd /home/phyre/jessica-core

# Check if venv exists
ls -la venv/

# Check current Python version
python3 --version
```

#### Step 1.2: Reinstall Dependencies
```bash
# Activate virtual environment
source venv/bin/activate

# Upgrade pip (recommended)
pip install --upgrade pip

# Install/update all dependencies
pip install -r requirements.txt

# Verify critical packages
pip list | grep -E "chromadb|flask|flask-cors|python-dotenv"
```

#### Step 1.3: Test Imports
```bash
# Run import test
python3 test_imports.py

# Expected output:
# ✓ Flask
# ✓ Flask-CORS
# ✓ ChromaDB
# ✓ Anthropic
# ✓ Google Generative AI
# ✓ python-dotenv
# ✓ sentence-transformers
# ✅ ALL IMPORTS SUCCESSFUL!
```

**Success Criteria:**
- ✅ All imports succeed
- ✅ No missing dependency errors
- ✅ ChromaDB version is compatible

---

### PHASE 2: VERIFY GITHUB REPOSITORY STATE
**Priority:** 🟡 **MEDIUM - VERIFY INTEGRITY**  
**Time Estimate:** 10-15 minutes  
**Risk:** Medium (need to ensure code integrity)

#### Step 2.1: Check Git Status
```bash
cd /home/phyre/jessica-core

# Check remote configuration
git remote -v
# Should show: https://github.com/wyldephyre/WSL-Jessica.git

# Check current branch
git branch

# Check for uncommitted changes
git status
```

#### Step 2.2: Verify Critical Files Present
```bash
# Check core files exist
ls -la jessica_core.py memory_server.py whisper_server.py
ls -la requirements.txt start-jessica.sh

# Check if .gitignore is correct
cat .gitignore | grep -E "venv|\.env|chroma|\.sqlite"
```

#### Step 2.3: Commit Current Fixes (if needed)
```bash
# If requirements.txt changes aren't committed
git add requirements.txt CODE_AUDIT_REPORT.md RECOVERY_PLAN.md
git commit -m "Fix: Add missing dependencies to requirements.txt"
git push origin main
```

**Success Criteria:**
- ✅ Git remote points to correct repository
- ✅ All critical files present
- ✅ Changes committed and pushed

---

### PHASE 3: VERIFY SERVICE DEPENDENCIES
**Priority:** 🟡 **MEDIUM - BEFORE STARTUP**  
**Time Estimate:** 10 minutes  
**Risk:** Low (validation only)

#### Step 3.1: Check Ollama Status
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
# (Keep this terminal open, or run in background)
```

#### Step 3.2: Verify API Keys
```bash
# Load environment variables
source ~/.bashrc

# Verify API keys are set (don't print values!)
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}"
echo "XAI_API_KEY: ${XAI_API_KEY:+SET}"
echo "GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY:+SET}"
echo "MEM0_API_KEY: ${MEM0_API_KEY:+SET}"
```

#### Step 3.3: Check Port Availability
```bash
# Check if ports are in use
lsof -i:5000 -i:5001 -i:8000 || echo "Ports available"
```

**Success Criteria:**
- ✅ Ollama is accessible
- ✅ All API keys are set
- ✅ Required ports are available

---

### PHASE 4: START SERVICES & VALIDATE
**Priority:** 🟢 **LOW - FINAL VERIFICATION**  
**Time Estimate:** 5-10 minutes  
**Risk:** Low (can restart if issues)

#### Step 4.1: Start All Services
```bash
cd /home/phyre/jessica-core

# Load API keys
source ~/.bashrc

# Start all services
~/start-jessica.sh
```

#### Step 4.2: Verify Services Started
```bash
# Check service health
curl http://localhost:5001/health  # Memory Server
curl http://localhost:5000/health  # Whisper Server
curl http://localhost:8000/status  # Jessica Core

# Check service PIDs
cat /tmp/jessica-*.pid
```

#### Step 4.3: Test Basic Functionality
```bash
# Test chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

**Success Criteria:**
- ✅ All services respond to health checks
- ✅ Chat endpoint returns valid response
- ✅ No error logs in `logs/` directory

---

## TROUBLESHOOTING GUIDE

### Issue: Import Errors After Installation
**Symptom:** `ModuleNotFoundError` for chromadb/flask/etc.

**Fix:**
```bash
# Ensure venv is activated
source venv/bin/activate

# Force reinstall
pip install --force-reinstall chromadb flask flask-cors python-dotenv

# Verify
python3 -c "import chromadb; import flask; print('OK')"
```

### Issue: ChromaDB Version Conflict
**Symptom:** `AttributeError` or API compatibility errors

**Fix:**
```bash
# Check installed version
pip show chromadb

# If version mismatch, pin specific version
pip install chromadb==0.4.22  # or latest stable
```

### Issue: Services Won't Start
**Symptom:** Port already in use or service crashes

**Fix:**
```bash
# Kill existing processes
pkill -f memory_server.py
pkill -f whisper_server.py
pkill -f jessica_core.py

# Check logs
tail -f logs/memory-server.log
tail -f logs/jessica-core.log
```

### Issue: API Keys Not Loading
**Symptom:** Services start but API calls fail

**Fix:**
```bash
# Verify .bashrc has exports
grep -E "ANTHROPIC|XAI|GOOGLE|MEM0" ~/.bashrc

# Reload
source ~/.bashrc

# Or set in current session
export ANTHROPIC_API_KEY="your-key"
# (etc.)
```

---

## CHECKLIST

### Pre-Start Checklist
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Imports test passes (`python3 test_imports.py`)
- [ ] Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] API keys are set (`source ~/.bashrc`)
- [ ] Ports are available (5000, 5001, 8000)
- [ ] Git repository is synced

### Post-Start Checklist
- [ ] Memory Server responds (`curl http://localhost:5001/health`)
- [ ] Whisper Server responds (`curl http://localhost:5000/health`)
- [ ] Jessica Core responds (`curl http://localhost:8000/status`)
- [ ] Chat endpoint works (test POST request)
- [ ] No errors in log files

---

## NEXT STEPS AFTER RECOVERY

Once services are running:

1. **Frontend Startup**
   ```bash
   # In PowerShell (Windows terminal)
   cd "D:\App Development\jessica-ai\frontend"
   npm run dev
   ```

2. **Full System Test**
   - Open http://localhost:3000
   - Send test message
   - Verify response
   - Check memory storage

3. **Documentation Update**
   - Update AGENTS.md if procedures changed
   - Note any version changes
   - Document recovery process

---

## RISK ASSESSMENT

| Phase | Risk Level | Mitigation |
|-------|-----------|------------|
| Phase 1: Dependencies | 🟢 Low | Already fixed in requirements.txt |
| Phase 2: Git Verification | 🟡 Medium | Verify before proceeding |
| Phase 3: Service Dependencies | 🟢 Low | Validation only |
| Phase 4: Service Startup | 🟡 Medium | Can restart if issues |

**Overall Risk:** 🟢 **LOW** - Dependencies already fixed, remaining steps are verification

---

## ESTIMATED TIME

- **Phase 1:** 15-30 minutes
- **Phase 2:** 10-15 minutes
- **Phase 3:** 10 minutes
- **Phase 4:** 5-10 minutes

**Total:** 40-65 minutes

---

*Recovery plan created by Factory Droid*  
*For the forgotten 99%, we rise. 🔥*

