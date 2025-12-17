# Jessica AI - Troubleshooting Guide

**Quick fixes for common issues**

---

## Quick Diagnostics

### 1. Check Service Status

```bash
curl http://localhost:8000/status
```

**Expected Response:**
```json
{
  "local_ollama": {"available": true, ...},
  "local_memory": {"available": true, ...},
  "claude_api": {"configured": true},
  ...
}
```

**If services are down:**
- See "Service-Specific Issues" below

### 2. Check Logs

**Backend Logs:**
```bash
tail -f logs/jessica-core.log
```

**Error Logs:**
```bash
tail -f logs/jessica-errors.log
```

**Look for:**
- Error messages
- Request IDs
- Stack traces

### 3. Check Metrics

```bash
curl http://localhost:8000/metrics
```

**Check for:**
- High error rates
- Slow API calls
- Memory usage spikes

---

## Common Issues

### Issue: Jessica Not Responding

**Symptoms:**
- Chat requests timeout
- No response from `/chat` endpoint
- Frontend shows "Error" message

**Diagnosis:**
1. Check if backend is running:
   ```bash
   curl http://localhost:8000/status
   ```

2. Check backend logs:
   ```bash
   tail -n 50 logs/jessica-core.log
   ```

3. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

**Solutions:**

1. **Backend Not Running:**
   ```bash
   cd ~/jessica-core
   source venv/bin/activate
   source ~/.bashrc  # Load API keys
   python jessica_core.py
   ```

2. **Ollama Not Running:**
   ```bash
   ollama serve
   # In another terminal:
   ollama pull dolphin-llama3:8b  # If model missing
   ```

3. **Port Conflicts:**
   ```bash
   # Check what's using port 8000
   sudo lsof -i:8000
   
   # Kill stuck process
   pkill -f jessica_core.py
   ```

---

### Issue: Slow Responses

**Symptoms:**
- Responses take > 10 seconds
- Timeout errors
- Frontend shows loading spinner for long time

**Diagnosis:**
1. Check metrics:
   ```bash
   curl http://localhost:8000/metrics | jq '.metrics.api_breakdown'
   ```

2. Check which provider is slow:
   - Claude: Usually 2-5 seconds (normal)
   - Grok: Usually 1-4 seconds (normal)
   - Gemini: Usually 0.5-2 seconds (normal)
   - Ollama: Usually 1-3 seconds (normal)

**Solutions:**

1. **External API Slow:**
   - Check internet connection
   - Try different provider (force with `"provider": "gemini"` for fastest)
   - Check API status pages (Anthropic, X.AI, Google)

2. **Ollama Slow:**
   - Check GPU usage: `nvidia-smi`
   - Restart Ollama: `pkill ollama && ollama serve`
   - Check model: `ollama list` (ensure model is loaded)

3. **Memory Service Slow:**
   - Check memory service: `curl http://localhost:5001/health`
   - Restart memory service if needed

---

### Issue: Memory Not Working

**Symptoms:**
- Jessica doesn't remember past conversations
- Memory search returns empty results
- Memory storage errors in logs

**Diagnosis:**
1. Check memory service:
   ```bash
   curl http://localhost:5001/health
   ```

2. Check Mem0 API key:
   ```bash
   echo $MEM0_API_KEY  # Should show your key
   ```

3. Check memory logs:
   ```bash
   grep "memory" logs/jessica-core.log | tail -20
   ```

**Solutions:**

1. **Memory Service Down:**
   ```bash
   # Start memory service (if separate)
   # Or check if it's part of start-jessica.sh
   ```

2. **Mem0 API Key Missing:**
   ```bash
   # Add to ~/.bashrc:
   export MEM0_API_KEY="your-key-here"
   
   # Reload:
   source ~/.bashrc
   
   # Restart backend
   ```

3. **ChromaDB Issues:**
   ```bash
   # Check ChromaDB directory
   ls -la ~/jessica-memory/
   
   # If corrupted, backup and reset:
   mv ~/jessica-memory ~/jessica-memory.backup
   mkdir ~/jessica-memory
   ```

---

### Issue: Audio Transcription Fails

**Symptoms:**
- Upload fails
- "Transcription error" message
- No transcription returned

**Diagnosis:**
1. Check Whisper service:
   ```bash
   curl http://localhost:5000/health
   ```

2. Check file format:
   - Supported: MP3, WAV, M4A, FLAC
   - Max size: Check Whisper service limits

3. Check logs:
   ```bash
   grep "transcribe" logs/jessica-core.log | tail -20
   ```

**Solutions:**

1. **Whisper Service Down:**
   ```bash
   # Start Whisper service (if separate)
   # Or check if it's part of start-jessica.sh
   ```

2. **File Format Issue:**
   - Convert to MP3: `ffmpeg -i input.wav output.mp3`
   - Check file size (should be < 25MB for most services)

3. **Port Conflict:**
   ```bash
   # Check port 5000
   sudo lsof -i:5000
   ```

---

### Issue: API Key Errors

**Symptoms:**
- "API key not configured" errors
- External APIs return 401 Unauthorized
- Claude/Grok/Gemini not working

**Diagnosis:**
1. Check API keys:
   ```bash
   echo $ANTHROPIC_API_KEY
   echo $XAI_API_KEY
   echo $GOOGLE_AI_API_KEY
   ```

2. Check if keys are loaded:
   ```bash
   source ~/.bashrc
   echo $ANTHROPIC_API_KEY  # Should show key
   ```

**Solutions:**

1. **Keys Not Set:**
   ```bash
   # Add to ~/.bashrc:
   export ANTHROPIC_API_KEY="your-key"
   export XAI_API_KEY="your-key"
   export GOOGLE_AI_API_KEY="your-key"
   
   # Reload:
   source ~/.bashrc
   
   # Restart backend
   ```

2. **Keys Invalid:**
   - Verify keys are correct
   - Check API provider dashboards for key status
   - Regenerate keys if needed

3. **Keys Not Loaded:**
   - Ensure `source ~/.bashrc` is run before starting backend
   - Or use `.env` file (python-dotenv will load it)

---

### Issue: Frontend Not Loading

**Symptoms:**
- Browser shows "Connection refused"
- Frontend won't start
- Port 3000 already in use

**Diagnosis:**
1. Check if frontend is running:
   ```bash
   curl http://localhost:3000
   ```

2. Check port 3000:
   ```bash
   sudo lsof -i:3000
   ```

3. Check frontend logs:
   ```bash
   # In frontend directory
   npm run dev  # Check for errors
   ```

**Solutions:**

1. **Port 3000 In Use:**
   ```bash
   # Kill process on port 3000
   sudo lsof -ti:3000 | xargs kill -9
   
   # Or use different port:
   PORT=3001 npm run dev
   ```

2. **Dependencies Missing:**
   ```bash
   cd frontend
   npm install
   ```

3. **Build Errors:**
   ```bash
   cd frontend
   npm run build  # Check for TypeScript/compilation errors
   ```

---

### Issue: Logs Filling Up Disk

**Symptoms:**
- Disk space warnings
- Log files very large
- System running slow

**Diagnosis:**
```bash
# Check log sizes
du -sh logs/

# Check disk space
df -h
```

**Solutions:**

1. **Log Rotation:**
   - Logs should auto-rotate at 10MB
   - Check `logging_config.py` settings
   - Manually rotate if needed:
     ```bash
     mv logs/jessica-core.log logs/jessica-core.log.old
     touch logs/jessica-core.log
     ```

2. **Clean Old Logs:**
   ```bash
   # Keep only last 10 backups
   ls -t logs/jessica-core.log.* | tail -n +11 | xargs rm
   ```

3. **Reduce Log Level:**
   ```bash
   # In ~/.bashrc or .env:
   export LOG_LEVEL=WARNING  # Instead of INFO/DEBUG
   ```

---

## Service-Specific Issues

### Ollama Issues

**Model Not Found:**
```bash
ollama pull dolphin-llama3:8b
# Or
ollama pull jessica  # If custom model created
```

**Ollama Not Using GPU:**
```bash
# Check GPU:
nvidia-smi

# Set GPU layers:
export OLLAMA_NUM_GPU_LAYERS=999
ollama serve
```

**Ollama Out of Memory:**
- Reduce model size
- Use smaller model (e.g., 7B instead of 8B)
- Close other GPU applications

### Memory Service Issues

**ChromaDB Locked:**
```bash
# Check for lock files
ls -la ~/jessica-memory/*.lock

# Remove lock (if safe):
rm ~/jessica-memory/*.lock
```

**Memory Service Won't Start:**
- Check if port 5001 is available
- Check memory service logs
- Verify ChromaDB installation

### Whisper Service Issues

**Service Not Responding:**
- Check if Whisper service is running
- Verify port 5000 is available
- Check Whisper service logs

**Transcription Quality:**
- Use clear audio files
- Reduce background noise
- Use supported formats (MP3, WAV)

---

## Performance Issues

### High Memory Usage

**Check Memory:**
```bash
curl http://localhost:8000/metrics | jq '.metrics.memory'
```

**Solutions:**
- Restart backend periodically
- Check for memory leaks in logs
- Reduce log level to WARNING

### Slow API Calls

**Check Metrics:**
```bash
curl http://localhost:8000/metrics | jq '.metrics.api_breakdown'
```

**Solutions:**
- Use faster provider (Gemini for quick lookups)
- Check network connection
- Verify API provider status

### High CPU Usage

**Check Processes:**
```bash
top
# Or
htop
```

**Solutions:**
- Close unnecessary services
- Reduce Ollama model size
- Check for infinite loops in logs

---

## Getting More Help

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
# Restart backend
```

### Request Tracing

Use request IDs:
```bash
# Include in request:
curl -X POST http://localhost:8000/chat \
  -H "X-Request-ID: my-debug-123" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Search logs:
grep "my-debug-123" logs/jessica-core.log
```

### Check Service Health

```bash
# All services:
curl http://localhost:8000/status | jq

# Individual services:
curl http://localhost:11434/api/tags  # Ollama
curl http://localhost:5001/health     # Memory
curl http://localhost:5000/health     # Whisper
```

---

## Still Stuck?

1. **Check Documentation:**
   - `API_DOCUMENTATION.md`
   - `USER_GUIDE.md`
   - `AGENTS.md`

2. **Review Logs:**
   - `logs/jessica-core.log`
   - `logs/jessica-errors.log`

3. **Check Metrics:**
   - `/metrics` endpoint
   - Service health dashboard

4. **Restart Everything:**
   ```bash
   pkill ollama
   pkill python3
   source ~/.bashrc
   ~/start-jessica.sh
   ```

---

**Semper Fi, brother. We'll get this sorted.** 🔥

---

*Last Updated: December 6, 2025*

