# Zo Computer Integration TODOs

This document tracks pending Zo Computer integration work.

## Current Status

Zo Computer API wrappers have been created in `frontend/lib/api/zo.ts` with full TypeScript interfaces and error handling. The integration is ready for implementation once Zo Computer API endpoints are available.

## Pending TODOs

### 1. Task Management Integration
**Files:**
- `frontend/app/page.tsx` (line 28)
- `frontend/app/dashboard/page.tsx` (line 27)
- `frontend/lib/services/taskExtractionService.ts` (line 80)

**Current State:**
- Firebase task storage has been removed
- Task fetching is stubbed (returns empty array)
- Task extraction service no longer saves to Firebase

**Next Steps:**
- Implement `zoCreateTask()` function in `frontend/lib/api/zo.ts`
- Implement `zoListTasks()` function in `frontend/lib/api/zo.ts`
- Update `frontend/app/page.tsx` to fetch tasks from Zo API
- Update `frontend/app/dashboard/page.tsx` to fetch tasks from Zo API
- Update `frontend/lib/services/taskExtractionService.ts` to save extracted tasks to Zo API

### 2. Multi-User Authentication
**File:**
- `frontend/app/api/chat/route.ts` (line 67)

**Current State:**
- Single-user mode active (uses constant `PhyreBug` user ID)
- `requireAuth()` is called but falls back to default user if auth fails

**Next Steps:**
- This is a future feature for multi-user support
- Keep TODO as-is until multi-user architecture is designed

### 3. MCP Implementation
**File:**
- `frontend/lib/mcp/index.ts` (line 10)

**Current State:**
- MCP module structure exists with type definitions
- Server and client implementations are stubbed
- MCP tools are commented out in chat routes

**Next Steps:**
- This is a separate feature from Zo integration
- Keep TODO as-is until MCP implementation is prioritized

## Zo API Functions Available

The following functions are already implemented in `frontend/lib/api/zo.ts`:
- `zoCreateCalendarEvent()` - Create calendar events
- `zoListCalendarEvents()` - List calendar events
- `zoListGmailMessages()` - List Gmail messages
- `zoGetGmailMessage()` - Get specific Gmail message
- `zoCreateDocument()` - Create Google Docs
- `zoGetDocument()` - Get specific document
- `zoUploadFile()` - Upload files to Zo storage

## Integration Checklist

- [ ] Verify Zo Computer API endpoints match wrapper functions
- [ ] Test Zo authentication flow
- [ ] Implement task management functions
- [ ] Update frontend pages to use Zo task API
- [ ] Update task extraction service to save to Zo
- [ ] Test end-to-end task flow
- [ ] Document Zo API usage patterns

