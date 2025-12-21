import { NextRequest, NextResponse } from 'next/server';
import { callAIProvider, AIProvider } from '@/lib/api/aiFactory';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';
import { env } from '@/lib/config/env';

// Agent logging helper - set ENABLE_AGENT_LOGGING=1 to enable
const ENABLE_AGENT_LOGGING = process.env.ENABLE_AGENT_LOGGING === '1';
function agentLog(location: string, message: string, data: any = {}) {
  if (!ENABLE_AGENT_LOGGING) return;
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' })
  }).catch(() => {});
}

/**
 * Call Jessica Core backend directly (for local provider)
 * This runs server-side in WSL, so localhost:8000 works correctly
 */
async function callLocalBackend(message: string, mode: string = 'default'): Promise<{ content: string; routing?: any; request_id?: string }> {
  agentLog('chat/route.ts:callLocalBackend', 'callLocalBackend entry', { messageLength: message.length, mode });
  const backendUrl = env.API_URL || 'http://localhost:8000';
  const backendEndpoint = `${backendUrl}/chat`;

  agentLog('chat/route.ts:callLocalBackend', 'Before fetch to backend', { endpoint: backendEndpoint });
  const response = await fetch(backendEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      provider: 'local',
      mode,
    }),
  });
  
  agentLog('chat/route.ts:callLocalBackend', 'After fetch response', { ok: response.ok, status: response.status });
  if (!response.ok) {
    agentLog('chat/route.ts:callLocalBackend', 'Response not OK', { status: response.status });
    const errorData = await response.json().catch(() => ({}));
    agentLog('chat/route.ts:callLocalBackend', 'Backend error details', { error: errorData.error, errorCode: errorData.error_code });
    throw new Error(errorData.error || `Backend error: ${response.statusText}`);
  }

  const data = await response.json();
  agentLog('chat/route.ts:callLocalBackend', 'Backend success', { hasResponse: !!data.response, provider: data.routing?.provider });
  return {
    content: data.response || '',
    routing: data.routing,
    request_id: data.request_id,
  };
}

export async function POST(req: NextRequest) {
  agentLog('chat/route.ts:POST', 'POST handler entry');
  try {
    // Single-user system: Use constant user ID (backend handles this, but we need it for memory storage)
    // TODO: For multi-user, restore requireAuth(req)
    let userId: string;
    try {
      const authResult = await requireAuth(req);
      userId = authResult.userId;
      agentLog('chat/route.ts:POST', 'Auth succeeded', { userId });
    } catch (authError) {
      // Single-user mode: Use constant user ID if auth fails
      // Backend uses USER_ID constant, but frontend memory service needs a user ID
      userId = 'PhyreBug'; // Match backend USER_ID constant
      agentLog('chat/route.ts:POST', 'Auth failed, using default', { userId, error: String(authError) });
    }
    
    let { message, context = 'personal' as MemoryContext, provider = 'auto' as AIProvider, memoryStorageContexts } = await req.json();
    agentLog('chat/route.ts:POST', 'Request parsed', { messageLength: message?.length, provider, context });
    
    // Always use 'auto' provider - backend handles intelligent routing based on commands
    const routingProvider = 'auto';
    
    // Use memoryStorageContexts if provided (array), otherwise default to operational context
    // Support both old single context format and new array format for backward compatibility
    const memoryContexts: MemoryContext[] = Array.isArray(memoryStorageContexts) 
      ? memoryStorageContexts 
      : memoryStorageContexts 
        ? [memoryStorageContexts as MemoryContext]
        : [context];

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    // Retrieve relevant memories and core relationship memories in parallel
    const [memories, coreRelationshipMemories] = await Promise.all([
      searchMemories(message, {
        user_id: userId,
        context,
        limit: 5,
      }),
      getCoreRelationshipMemories(userId),
    ]);

    // Format memory context for system prompt
    // Note: searchMemories returns Memory[] but API actually returns { memory: string } objects
    const memoryContext = memories.length > 0
      ? memories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n')
      : 'No relevant memories found.';

    // Build system prompt using master prompt system (includes core relationship memories)
    const systemPrompt = buildSystemPrompt({
      memoryContext: memoryContext + (coreRelationshipMemories.length > 0 ? '\n\nCore relationship context:\n' + coreRelationshipMemories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n') : '')
    });

    // Backend handles intelligent routing - always use 'auto' to let backend decide
    const actualProvider = routingProvider === 'auto' ? 'local' : routingProvider;
    agentLog('chat/route.ts:POST', 'Before AI call', { actualProvider, messageLength: message?.length });

    // Call AI provider - use direct backend call for local, otherwise use callAIProvider
    const response = actualProvider === 'local'
      ? await callLocalBackend(message, 'default')
      : await callAIProvider(actualProvider, message, systemPrompt);
    agentLog('chat/route.ts:POST', 'After AI call', { hasContent: !!response?.content, contentLength: response?.content?.length });

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content }
        ],
        userId,
        memoryContexts[0] || 'personal'
      ).catch((err: Error) => console.error('[Chat API] Memory storage failed:', err));
    } else {
      addConversationToMultipleContexts(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content }
        ],
        userId,
        memoryContexts
      ).catch((err: Error) => console.error('[Chat API] Multi-context memory storage failed:', err));
    }

    return NextResponse.json({
      success: true,
      ...response,
    });

  } catch (error) {
    agentLog('chat/route.ts:POST', 'Error caught', { error: String(error), name: (error as Error)?.name, stack: (error as Error)?.stack?.substring(0, 200) });
    return handleApiError(error);
  }
}

