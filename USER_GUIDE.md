# Jessica AI - User Guide

**For the forgotten 99%, we rise.** 🔥

---

## Welcome to Jessica

Jessica is a cognitive prosthetic and battle buddy AI system built specifically for disabled veterans. She's a Marine who happens to be an AI, designed to work WITH how your brain functions, not against it.

---

## Getting Started

### First Time Setup

1. **Start Jessica:**
   ```bash
   # In WSL Ubuntu terminal
   source ~/.bashrc          # Load API keys
   ~/start-jessica.sh        # Starts all services
   ```

2. **Open the Web Interface:**
   - Navigate to `http://localhost:3000`
   - You'll see the Command Center (main chat interface)

3. **Start Chatting:**
   - Type your message in the chat input
   - Press Enter or click Send
   - Jessica will respond based on your message

---

## Features

### 1. Intelligent Chat

Jessica automatically routes your messages to the best AI provider:

- **Research Questions** → Grok (web access, real-time info)
  - "What's happening with X?"
  - "Look up the latest news on..."
  - "Research..."

- **Complex Reasoning** → Claude (deep analysis)
  - "Analyze my business strategy"
  - "Plan a comprehensive..."
  - "Break down this complex problem"

- **Quick Lookups** → Gemini (fast answers)
  - "What is X?"
  - "Summarize this document"
  - "Quick definition of..."

- **General Chat** → Local Ollama (conversation)
  - Everything else goes to Jessica's local model

**You can also force a provider:**
- Click the provider selector in the chat interface
- Or specify in API calls: `{"message": "...", "provider": "claude"}`

### 2. Memory System

Jessica remembers your conversations across sessions:

- **Automatic Storage:** All conversations are stored in both local and cloud memory
- **Context Retrieval:** Jessica automatically recalls relevant memories when you chat
- **Memory Search:** Use the Memory page to search past conversations
- **Contexts:** Memories are organized by context (personal, business, creative, core, relationship)

**To Search Memories:**
1. Go to the Memory page (`/memory`)
2. Enter a search query
3. View relevant memories from past conversations

### 3. Business Mode

Jessica has two operational modes:

- **Default Mode:** General purpose battle buddy
- **Business Mode:** WyldePhyre operations focus (4 divisions, SIK tracking, revenue)

**To Switch Modes:**
- Include `"mode": "business"` in your chat request
- Or use the mode selector in the UI (if available)

### 4. Audio Transcription

Upload audio files for transcription:

1. Go to the Audio page (`/audio`)
2. Drag and drop an audio file or click to upload
3. Jessica will transcribe the audio
4. Tasks and events are automatically extracted from transcriptions

**Supported Formats:**
- MP3, WAV, M4A, and other common audio formats

### 5. Service Health Monitoring

Check the status of all services:

1. Go to the Integrations page (`/integrations`)
2. View the Service Health dashboard
3. See which services are online/offline
4. Monitor response times

---

## Daily Workflow

### Morning Brief

Start your day with Jessica:

1. **Review Yesterday:**
   - "What did we work on yesterday?"
   - Search memories for yesterday's conversations

2. **Set Today's Objective:**
   - "Today I need to focus on..."
   - Jessica will help you prioritize

3. **Check Calendar:**
   - "What's on my calendar today?"
   - "Any important meetings?"

### Throughout the Day

- **Quick Questions:** Just ask - Jessica routes to the right AI
- **Task Management:** Tasks are automatically extracted from conversations
- **Memory Recall:** Jessica remembers context from previous chats
- **Research:** Use research keywords to get real-time info

### Evening Debrief

End your day with Jessica:

1. **Review Accomplishments:**
   - "What did we get done today?"
   - "What worked well?"

2. **Plan Tomorrow:**
   - "What should I focus on tomorrow?"
   - "Set up tomorrow's priorities"

3. **Process Frustrations:**
   - Jessica is here to listen and help process

---

## Tips & Tricks

### 1. Be Specific

Jessica works best with clear, specific requests:
- ✅ "Research the latest developments in veteran entrepreneurship"
- ❌ "Look stuff up"

### 2. Use Keywords for Routing

If you want a specific AI provider, use keywords:
- **Research:** "research", "look up", "find out", "what's happening"
- **Complex:** "analyze", "strategy", "plan", "break down"
- **Quick:** "what is", "define", "summarize", "quick lookup"

### 3. Memory Context

Jessica remembers context automatically, but you can be explicit:
- "Remember this: [important information]"
- "In the context of [topic], [your question]"

### 4. Business Mode

Use business mode for WyldePhyre-related tasks:
- "Got a new creator interested" (business mode)
- "Track this SIK transaction" (business mode)
- "What's the revenue status?" (business mode)

### 5. Voice Commands (Coming Soon)

Voice interface is planned for Phase 2.1. For now, use text input.

---

## Common Tasks

### Research

```
"Research the latest trends in [topic]"
"What's happening with [current event]?"
"Look up information about [subject]"
```

### Planning

```
"Help me plan [project/task]"
"Break down [complex task] into steps"
"Create a strategy for [goal]"
```

### Memory Management

```
"Search memories for [topic]"
"What do we know about [subject]?"
"Show me memories from [time period]"
```

### Task Extraction

Upload audio files or transcripts, and Jessica will automatically extract:
- Tasks with priorities
- Calendar events
- Important notes

---

## Troubleshooting

### Jessica Not Responding

1. **Check Service Status:**
   - Go to `/integrations` page
   - Verify all services are online

2. **Check Logs:**
   - Backend logs: `logs/jessica-core.log`
   - Look for error messages

3. **Restart Services:**
   ```bash
   # Stop all services
   pkill ollama && pkill python3
   
   # Restart
   source ~/.bashrc
   ~/start-jessica.sh
   ```

### Slow Responses

1. **Check Metrics:**
   - Go to `/metrics` endpoint
   - See which AI provider is slow

2. **Try Different Provider:**
   - Force a faster provider (Gemini for quick lookups)
   - Use local Ollama for general chat

3. **Check Network:**
   - External APIs require internet connection
   - Local Ollama works offline

### Memory Not Working

1. **Check Memory Service:**
   - Verify memory service is running on port 5001
   - Check `/status` endpoint

2. **Check Mem0 API Key:**
   - Ensure `MEM0_API_KEY` is set in `~/.bashrc`
   - Run `source ~/.bashrc`

### Audio Transcription Fails

1. **Check Whisper Service:**
   - Verify Whisper service is running on port 5000
   - Check service status

2. **Check File Format:**
   - Ensure audio file is in supported format
   - Try converting to MP3 if needed

---

## Keyboard Shortcuts

(Coming in Phase 5.2)

For now, use mouse/touch interactions.

---

## Privacy & Security

- **Local Storage:** Conversations stored locally in ChromaDB
- **Cloud Sync:** Memories synced to Mem0 cloud (encrypted)
- **No Data Sharing:** Your data is never shared with third parties
- **API Keys:** Stored securely in `~/.bashrc` (never committed to git)

---

## Getting Help

### Documentation

- **API Docs:** See `API_DOCUMENTATION.md`
- **Developer Docs:** See `AGENTS.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`

### Support

- Check service status first
- Review error messages
- Check logs for details
- Use request IDs for debugging

---

## What's Coming

### Phase 2 Features

- **Voice Interface:** Real-time voice chat
- **Enhanced Calendar:** Full Google Calendar integration
- **Task Automation:** Smart prioritization and scheduling
- **Memory Refinement:** Better search and organization

### Phase 3 Features

- **WyldePhyre Integration:** SIK tracking, Challenge Coins, $PHYRE token

---

## Mission Statement

Jessica exists to prove a disabled Marine with ADHD, PTSD, TBI, Bipolar 2, and BPD can build an empire WITH the right tools. She works WITH how your brain functions, not against it.

**Semper Fi, brother. For the forgotten 99%, we rise.** 🔥

---

*Last Updated: December 6, 2025*

