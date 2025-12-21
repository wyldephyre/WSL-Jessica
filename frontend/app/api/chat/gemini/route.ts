import { NextRequest, NextResponse } from 'next/server';
import { callGeminiViaProxy } from '@/lib/api/gemini';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    // Single-user system: Use constant user ID (backend handles this, but we need it for memory storage)
    // TODO: For multi-user, restore requireAuth(req)
    let userId: string;
    try {
      const authResult = await requireAuth(req);
      userId = authResult.userId;
    } catch (authError) {
      // Single-user mode: Use constant user ID if auth fails
      // Backend uses USER_ID constant, but frontend memory service needs a user ID
      userId = 'PhyreBug'; // Match backend USER_ID constant
    }
    
    const { message, context = 'personal' as MemoryContext, model, memoryStorageContexts } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    // Use memoryStorageContexts if provided (array), otherwise default to operational context
    const memoryContexts: MemoryContext[] = Array.isArray(memoryStorageContexts) 
      ? memoryStorageContexts 
      : memoryStorageContexts 
        ? [memoryStorageContexts as MemoryContext]
        : [context];

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
    const memoryContext = memories.length > 0
      ? memories
          .map((m) => `- ${('memory' in (m as any) ? (m as any).memory : (m as any).content) || ''}`)
          .filter((line) => line !== '- ')
          .join('\n')
      : 'No relevant memories found.';

    // Build system instruction using master prompt system
    const coreRelationshipContext =
      coreRelationshipMemories.length > 0
        ? coreRelationshipMemories
            .map((m) => `- ${('memory' in (m as any) ? (m as any).memory : (m as any).content) || ''}`)
            .filter((line) => line !== '- ')
            .join('\n')
        : '';

    const combinedMemoryContext =
      coreRelationshipContext
        ? `${memoryContext}\n\nCore relationship context:\n${coreRelationshipContext}`
        : memoryContext;

    const systemInstruction = buildSystemPrompt({
      memoryContext: combinedMemoryContext,
      additionalInstructions: `Memory context namespace: ${context}`,
    });

    // Call Gemini via backend proxy
    const assistantMessage = await callGeminiViaProxy(message, userId, systemInstruction);

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts[0]
      ).catch((err: Error) => console.error('[Gemini API] Memory storage failed:', err));
    } else {
      addConversationToMultipleContexts(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts
      ).catch((err: Error) => console.error('[Gemini API] Multi-context memory storage failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      provider: 'gemini',
      usage: undefined, // Gemini doesn't provide token usage in the same format
    });

  } catch (error) {
    return handleApiError(error);
  }
}

