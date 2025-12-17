# Jessica AI - Model Switching Handoff
**Date:** December 16, 2025  
**Session Focus:** Intelligent Model Switching (Hermes 34B vs Qwen 32B)

---

## LAST SECTION COMPLETED

### ✅ Personality Prompt Fix (RESOLVED)
**Problem:** Jessica was returning generic corporate responses instead of her Marine personality.

**Root Cause:** 
- Code assumed custom "jessica" model with personality baked in
- Using `nous-hermes2:34b-yi-q4_K_M` (generic model) which needs full system prompt
- Code was only sending empty/memory context, not the personality prompt

**Fix Applied:**
1. Updated `JESSICA_MODES['default']` to use `nous-hermes2:34b-yi-q4_K_M`
2. Added logic to detect generic vs custom models:
   ```python
   is_custom_jessica_model = active_model.startswith("jessica")
   if is_custom_jessica_model:
       local_ollama_prompt = context_text  # Custom models have personality baked in
   else:
       local_ollama_prompt = f"{local_prompt}{context_text}"  # Generic models need full prompt
   ```
3. Added error handling around Ollama API calls

**Result:** ✅ Jessica's personality is now working correctly with full Marine communication style.

**Files Modified:**
- `jessica_core.py` (lines 141, 1237-1246)

---

## CURRENT STATUS

**Working:**
- ✅ Backend services running (Memory, Whisper, Jessica Core)
- ✅ Frontend displaying responses
- ✅ Jessica's personality restored (using Hermes 34B)
- ✅ Model correctly receives full system prompt

**Known Issue:**
- ⚠️ Response time is slow (30-60s) - expected for 34B model, but user wants faster option for general chat

---

## NEXT STEPS: INTELLIGENT MODEL SWITCHING

### Goal
Automatically switch between models based on conversation importance:
- **Important/Serious** → `nous-hermes2:34b-yi-q4_K_M` (full personality, slower, 30-60s)
- **General/Banter** → `qwen2.5:32b` (faster, 10-20s, still has personality)

### Implementation Plan

#### 1. Add Importance Detection Keywords
**File:** `jessica_core.py` (after line 640)

Add keyword sets for detecting conversation importance:
- `IMPORTANT_CONVERSATION_KEYWORDS` - triggers Hermes 34B
- `GENERAL_CONVERSATION_KEYWORDS` - triggers Qwen 32B

#### 2. Create Importance Detection Function
**File:** `jessica_core.py` (after `detect_routing_tier` function, ~line 675)

Function: `detect_conversation_importance(message: str) -> str`
- Returns: `'important'` or `'general'`
- Analyzes message for keywords
- Defaults to `'important'` for safety (better slow than wrong)

#### 3. Update Model Selection Logic
**File:** `jessica_core.py` (around line 1200)

Modify model selection to auto-detect importance when mode is 'default':
- If importance = 'important' → use `nous-hermes2:34b-yi-q4_K_M`
- If importance = 'general' → use `qwen2.5:32b`
- Explicit modes (business, etc.) still work as before

#### 4. Update JESSICA_MODES Dictionary
**File:** `jessica_core.py` (line 140)

Add new modes:
- `"fast"` → `qwen2.5:32b` (explicit fast mode)
- `"important"` → `nous-hermes2:34b-yi-q4_K_M` (explicit important mode)
- `"default"` → auto-detects (current behavior)

#### 5. Ensure Both Models Get Personality Prompt
**File:** `jessica_core.py` (lines 1237-1246)

Already handled - generic models (both Hermes and Qwen) get full `local_prompt` + context.

---

## QUESTIONS TO CLARIFY

1. **Keyword Tuning:** What specific phrases/words should trigger "important" vs "general"?
   - Important: mission brief, crisis, mental health, business decisions, strategy?
   - General: hey, what's up, banter, quick question, routine stuff?

2. **Default Behavior:** When no keywords match, should it default to:
   - a) Important (safer, slower)
   - b) General (faster, might miss nuance)

3. **Frontend UI:** Should there be a manual toggle/button to force "fast mode" or "important mode"?

4. **Conversation Context:** Should the system remember the mode for a conversation thread, or re-evaluate each message?

---

## TECHNICAL NOTES

- Both `nous-hermes2:34b-yi-q4_K_M` and `qwen2.5:32b` are generic models
- Both will receive full `jessica_local_prompt.txt` + memory context
- Qwen 32B is faster but still maintains Jessica's personality
- Hermes 34B is slower but has better reasoning for complex situations

---

## FILES TO MODIFY

1. `jessica_core.py`
   - Add keyword sets (~line 640)
   - Add `detect_conversation_importance()` function (~line 675)
   - Update `JESSICA_MODES` dict (line 140)
   - Modify model selection logic (line 1200)

2. (Optional) Frontend UI for manual mode selection
   - `frontend/app/command-center/page.tsx`
   - `frontend/components/features/chat/ChatInput.tsx`

---

**Status:** Ready to implement after clarifying questions above  
**Priority:** Medium (optimization, not critical bug fix)  
**Estimated Time:** 1-2 hours implementation + testing

---

*For the forgotten 99%, we rise.* 🔥

