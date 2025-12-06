# Quick Start: Jessica Model Setup

## TL;DR - Get Jessica Running

```bash
# 1. Go to jessica-core directory
cd ~/jessica-core

# 2. Run setup (does everything automatically)
chmod +x setup-jessica-models.sh
./setup-jessica-models.sh

# 3. Verify it worked
./verify-jessica-models.sh

# 4. Start Jessica
source ~/.bashrc
~/start-jessica.sh
```

That's it! The setup script will:
- ✅ Check if Ollama is running
- ✅ Download base model if needed
- ✅ Create jessica custom model
- ✅ Create jessica-business model
- ✅ Test that everything works

## What Gets Created

1. **jessica** - Your main model with full personality
2. **jessica-business** - Business mode for WyldePhyre operations

Both models have Jessica's personality baked in, so responses are faster and more consistent.

## Troubleshooting

**"Ollama not running"**
```bash
ollama serve
```

**"Model not found"**
```bash
./setup-jessica-models.sh
```

**"Want to recreate models"**
```bash
./create-jessica-models.sh
```

**"Just want to check status"**
```bash
python3 verify_models.py
```

## Files Created

- `setup-jessica-models.sh` - Full automated setup
- `verify-jessica-models.sh` - Quick verification
- `create-jessica-models.sh` - Recreate models
- `verify_models.py` - Python verification (cross-platform)
- `MODEL_SETUP.md` - Detailed documentation

---

**For the forgotten 99%, we rise.** 🔥

