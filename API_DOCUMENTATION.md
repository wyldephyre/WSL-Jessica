# Jessica Core API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:8000`  
**Last Updated:** December 6, 2025

---

## Overview

Jessica Core provides a RESTful API for interacting with Jessica, a cognitive prosthetic AI system. The API supports intelligent routing between multiple AI providers, memory management, and audio transcription.

---

## Authentication

Currently, Jessica Core runs in development mode without authentication. In production, API keys or JWT tokens will be required.

**Request Headers:**
```
Content-Type: application/json
X-Request-ID: <optional-unique-id>  # For request tracing
```

---

## Endpoints

### 1. Chat Endpoint

**POST** `/chat`

Main endpoint for chatting with Jessica. Automatically routes to the best AI provider based on message content.

#### Request Body

```json
{
  "message": "What's the weather like today?",
  "provider": "claude",  // Optional: force specific provider (claude, grok, gemini, local)
  "mode": "default"      // Optional: Jessica mode (default, business)
}
```

**Fields:**
- `message` (required, string): The user's message to Jessica
- `provider` (optional, string): Force a specific AI provider. Valid values: `claude`, `grok`, `gemini`, `local`
- `mode` (optional, string): Jessica's operational mode. Valid values: `default`, `business`

#### Response

**Success (200 OK):**
```json
{
  "response": "There's my Marine! The weather's looking good today, brother. Clear skies and perfect for getting outside.",
  "routing": {
    "provider": "grok",
    "tier": 1,
    "reason": "Research task detected - using Grok for web access"
  },
  "request_id": "a1b2c3d4"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Message must be a non-empty string",
  "error_code": "VALIDATION_ERROR",
  "request_id": "a1b2c3d4"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "An unexpected error occurred",
  "error_code": "INTERNAL_ERROR",
  "request_id": "a1b2c3d4"
}
```

#### Routing Logic

Jessica automatically routes messages based on keywords:

- **Research tasks** → Grok (web access, real-time info)
- **Complex reasoning** → Claude (deep analysis, strategy)
- **Document/lookup tasks** → Gemini (fast, efficient)
- **Default** → Local Ollama (general conversation)

#### Example Requests

```bash
# Basic chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I work on today?"}'

# Force Claude for complex reasoning
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze my business strategy", "provider": "claude"}'

# Business mode
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Got a new creator interested", "mode": "business"}'
```

---

### 2. Status Endpoint

**GET** `/status`

Check the health and availability of all services (local and external).

#### Response

**Success (200 OK):**
```json
{
  "local_ollama": {
    "available": true,
    "response_time_ms": 12.5,
    "error": null
  },
  "local_memory": {
    "available": true,
    "response_time_ms": 8.2,
    "error": null
  },
  "claude_api": {
    "configured": true
  },
  "grok_api": {
    "configured": true
  },
  "gemini_api": {
    "configured": true
  },
  "mem0_api": {
    "configured": true
  },
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl http://localhost:8000/status
```

---

### 3. Metrics Endpoint

**GET** `/metrics`

Get performance metrics and statistics for API calls and endpoints.

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "total_api_calls": 156,
    "total_errors": 3,
    "error_breakdown": {
      "timeout": 2,
      "connection_error": 1
    },
    "api_calls": {
      "avg_duration": 1.234,
      "min_duration": 0.543,
      "max_duration": 4.567,
      "success_rate": 0.98
    },
    "api_breakdown": {
      "claude": {
        "count": 45,
        "avg_duration": 2.1
      },
      "grok": {
        "count": 32,
        "avg_duration": 1.8
      },
      "gemini": {
        "count": 58,
        "avg_duration": 0.9
      },
      "ollama": {
        "count": 21,
        "avg_duration": 1.2
      }
    },
    "endpoints": {
      "/chat": {
        "count": 120,
        "avg_duration": 1.5,
        "min_duration": 0.8,
        "max_duration": 3.2
      }
    },
    "memory": {
      "current_mb": 145.6,
      "avg_mb": 142.3,
      "min_mb": 138.1,
      "max_mb": 148.2
    }
  },
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl http://localhost:8000/metrics
```

---

### 4. Transcribe Endpoint

**POST** `/transcribe`

Transcribe an audio file using the Whisper service.

#### Request

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `audio` (required, file): Audio file to transcribe (supports common audio formats)

#### Response

**Success (200 OK):**
```json
{
  "transcription": "This is the transcribed text from the audio file.",
  "language": "en",
  "request_id": "a1b2c3d4"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "No audio file provided",
  "error_code": "VALIDATION_ERROR",
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@recording.mp3"
```

---

### 5. Memory Search Endpoint

**POST** `/memory/cloud/search`

Search cloud memories stored in Mem0.

#### Request Body

```json
{
  "query": "WyldePhyre business meeting",
  "user_id": "user-123",      // Optional
  "context": "business",       // Optional: personal, business, creative, core, relationship
  "limit": 10                  // Optional: max results (default: 10)
}
```

#### Response

**Success (200 OK):**
```json
{
  "results": [
    {
      "memory": "Discussed WyldePhyre expansion plans in meeting on Dec 1",
      "score": 0.95,
      "metadata": {
        "context": "business",
        "type": "conversation",
        "timestamp": "2025-12-01T10:30:00Z"
      }
    }
  ],
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl -X POST http://localhost:8000/memory/cloud/search \
  -H "Content-Type: application/json" \
  -d '{"query": "WyldePhyre", "limit": 5}'
```

---

### 6. Get All Memories Endpoint

**GET** `/memory/cloud/all`

Retrieve all cloud memories for the current user.

#### Query Parameters

- `user_id` (optional, string): User ID to filter memories
- `context` (optional, string): Filter by context (personal, business, creative, core, relationship)
- `limit` (optional, integer): Maximum number of results

#### Response

**Success (200 OK):**
```json
{
  "memories": [
    {
      "id": "mem-123",
      "content": "Memory content here",
      "context": "business",
      "metadata": {
        "type": "conversation",
        "timestamp": "2025-12-01T10:30:00Z"
      }
    }
  ],
  "total": 42,
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl "http://localhost:8000/memory/cloud/all?context=business&limit=20"
```

---

### 7. Modes Endpoint

**GET** `/modes`

Get information about available Jessica modes.

#### Response

**Success (200 OK):**
```json
{
  "available_modes": {
    "default": {
      "model": "jessica",
      "description": "Core personality - general purpose battle buddy"
    },
    "business": {
      "model": "jessica-business",
      "description": "WyldePhyre operations - 4 divisions, SIK tracking, revenue focus"
    }
  },
  "usage": "Include 'mode': 'business' in your chat request to switch modes",
  "request_id": "a1b2c3d4"
}
```

#### Example Request

```bash
curl http://localhost:8000/modes
```

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "error_code": "ERROR_CODE",
  "request_id": "a1b2c3d4"
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `SERVICE_UNAVAILABLE` (503): Required service is down
- `MEMORY_ERROR` (500): Memory service operation failed
- `EXTERNAL_API_ERROR` (502): External API call failed
- `AUTHENTICATION_ERROR` (401): Authentication required
- `INTERNAL_ERROR` (500): Unexpected server error

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: External service error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in Phase 4.2.

---

## Request IDs

Every request is assigned a unique request ID (8-character hex string) for tracing. You can:

1. **Provide your own:** Include `X-Request-ID` header
2. **Use generated:** Server will generate one automatically

Request IDs appear in:
- Response JSON (`request_id` field)
- Log files
- Error messages

Use request IDs to trace requests across services and debug issues.

---

## Performance

### Response Times

Typical response times:
- **Local Ollama:** 1-3 seconds
- **Claude API:** 2-5 seconds
- **Grok API:** 1-4 seconds
- **Gemini API:** 0.5-2 seconds

### Timeouts

- **API calls:** 60 seconds (configurable via `API_TIMEOUT`)
- **Local services:** 5 seconds (configurable via `LOCAL_SERVICE_TIMEOUT`)
- **Ollama:** 300 seconds (configurable via `OLLAMA_TIMEOUT`)

---

## Best Practices

1. **Always check `/status`** before making requests to ensure services are available
2. **Use request IDs** for debugging and support
3. **Handle errors gracefully** - check `error_code` for specific error types
4. **Respect timeouts** - implement retry logic with exponential backoff
5. **Monitor `/metrics`** for performance insights

---

## Support

For issues or questions:
- Check logs in `logs/jessica-core.log`
- Review error messages and request IDs
- Check service status via `/status` endpoint

---

**Semper Fi, brother. For the forgotten 99%, we rise.** 🔥

