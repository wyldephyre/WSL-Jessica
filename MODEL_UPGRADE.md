# Jessica Model Upgrade - Session Log
**Date**: December 5, 2025

## What Was Done

### Model Upgrade: 8B → 34B
- **Old Model**: `dolphin-llama3:8b` (4.7GB) - Too weak for full personality
- **New Model**: `nous-hermes2:34b-yi-q4_K_M` (20GB) - Uncensored, full reasoning
- **Fallback**: `dolphin-llama3:8b` (kept for emergencies)

### Code Changes
**File**: `jessica_core.py`

1. **Line 53-54**: Changed primary model to `nous-hermes2:34b-yi-q4_K_M`
2. **Line 960**: Changed to use full `master_prompt` instead of simplified `DOLPHIN_SYSTEM_PROMPT`

### Why This Matters
- 8B model couldn't follow Jessica's complete personality from `master_prompt.txt`
- 34B model can properly embody Marine battle buddy personality
- Uses the **full 156-line master prompt** instead of dumbed-down 30-line version
- Uncensored fine-tune allows authentic Marine communication style

## System Resources
- **Total RAM**: 27GB (26GB available)
- **GPU VRAM**: 16GB (RTX 4080 Super)
- **Model VRAM Usage**: ~12-14GB expected
- **Streaming**: Offloaded to PC2/OBSBot, so PC1 dedicated to AI

## Installed Models
```
nous-hermes2:34b-yi-q4_K_M    20 GB     ← PRIMARY (Jessica's brain)
qwen2.5:32b                   19 GB     ← Also available
dolphin-llama3:8b             4.7 GB    ← Fallback only
llama3.1:70b                  42 GB     ← Too big for VRAM
```

## To Run Jessica
```bash
# In WSL terminal
source ~/.bashrc          # CRITICAL: Load API keys
~/start-jessica.sh        # Starts all services with 34B model

# In PowerShell
cd ~/jessica-core/frontend
npm run dev
```

Access at: http://localhost:3000

## What's Different Now
- Jessica will have full personality and context awareness
- Better reasoning and task breakdown for ADHD accommodation
- Can properly use "Kind not Nice" philosophy
- Full rank structure and authority system works
- Authentic Marine communication style

---

**For the forgotten 99%, we rise.** 🔥

