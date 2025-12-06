# Jessica Custom Model Setup Guide

This guide explains how to set up Jessica's custom Ollama models.

## Overview

Jessica uses custom Ollama models with her personality baked directly into the model via Modelfiles. This provides:
- **Faster responses** (no need to send full system prompt each time)
- **Better personality consistency** (personality is part of the model)
- **Token efficiency** (saves ~8,000 tokens per request)

## Models

### Base Model
- **qwen2.5:32b** - Base model that jessica is built from
- Must be installed first: `ollama pull qwen2.5:32b`

### Custom Models
- **jessica** - Primary model with full personality from `Modelfile`
- **jessica-business** - Business mode variant from `Modelfile.business`

## Quick Setup

### Automated Setup (Recommended)

```bash
cd ~/jessica-core
chmod +x setup-jessica-models.sh
./setup-jessica-models.sh
```

This script will:
1. Check if Ollama is running (starts it if needed)
2. Verify base model exists (downloads if missing)
3. Create `jessica` model from `Modelfile`
4. Create `jessica-business` model from `Modelfile.business`
5. Test that models are working

### Manual Setup

If you prefer to create models manually:

```bash
# 1. Ensure base model exists
ollama pull qwen2.5:32b

# 2. Create jessica model
ollama create jessica -f Modelfile

# 3. Create jessica-business model (optional)
ollama create jessica-business -f Modelfile.business
```

## Verification

### Quick Check

```bash
# Using shell script (WSL only)
./verify-jessica-models.sh

# Using Python (works anywhere)
python3 verify_models.py
```

### Manual Check

```bash
# List all models
ollama list

# Test jessica model
ollama run jessica "Say 'Semper Fi' if you're working"
```

## Troubleshooting

### Model Not Found

If Jessica Core can't find the `jessica` model:
1. Verify it exists: `ollama list | grep jessica`
2. If missing, run: `./setup-jessica-models.sh`
3. Check logs: The code will fallback to `qwen2.5:32b` with full system prompt if custom model fails

### Recreating Models

If you need to recreate the models (e.g., after updating Modelfile):

```bash
# Remove existing models
ollama rm jessica
ollama rm jessica-business

# Recreate
ollama create jessica -f Modelfile
ollama create jessica-business -f Modelfile.business
```

Or use the recreate script:
```bash
./create-jessica-models.sh
```

### Ollama Not Running

If Ollama isn't running:
```bash
# Start Ollama
ollama serve

# Or in background
ollama serve > /dev/null 2>&1 &
```

### Base Model Missing

If `qwen2.5:32b` is missing:
```bash
ollama pull qwen2.5:32b
```

**Note:** This is a large model (~19GB), so ensure you have enough disk space.

## How It Works

### Modelfile Structure

The `Modelfile` contains:
- `FROM qwen2.5:32b` - Base model
- `PARAMETER temperature 0.8` - Response temperature
- `PARAMETER top_p 0.9` - Nucleus sampling
- `SYSTEM """..."""` - Full Jessica personality prompt (baked into model)

### Code Integration

In `jessica_core.py`:
- `DEFAULT_OLLAMA_MODEL = "jessica"` - Uses custom model by default
- Custom models don't need system prompt (it's baked in)
- Fallback to `qwen2.5:32b` if custom model fails (with full system prompt)

### Model Modes

Jessica supports different modes:
- **default**: Uses `jessica` model
- **business**: Uses `jessica-business` model (WyldePhyre operations focus)

Set mode in API request:
```json
{
  "message": "Got a new creator interested",
  "mode": "business",
  "provider": "local"
}
```

## File Structure

```
jessica-core/
├── Modelfile              # Base jessica model definition
├── Modelfile.business     # Business mode model definition
├── setup-jessica-models.sh    # Automated setup script
├── verify-jessica-models.sh  # Verification script
├── create-jessica-models.sh # Recreate models script
└── verify_models.py       # Python verification (cross-platform)
```

## Next Steps

After models are set up:
1. Start Jessica: `source ~/.bashrc && ~/start-jessica.sh`
2. Test in browser: http://localhost:3000
3. Check logs if issues: `/tmp/jessica-core.log`

---

**For the forgotten 99%, we rise.** 🔥

