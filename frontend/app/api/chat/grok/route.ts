import { NextRequest, NextResponse } from 'next/server';
import { getGrokClient } from '@/lib/api/grok';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
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
      ? memories.map((m: { memory: string }) => `- ${m.memory}`).join('\n')
      : 'No relevant memories found.';

    // Build system prompt using master prompt system (includes core relationship memories)
    const systemPrompt = buildSystemPrompt(context, memoryContext, coreRelationshipMemories);

    // Call Grok
    const client = getGrokClient();
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: message });

    const response = await client.chat.completions.create({
      model: model || 'grok-beta',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const assistantMessage = response.choices[0]?.message?.content || '';

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts[0]
      ).catch((err: Error) => console.error('[Grok API] Memory storage failed:', err));
    } else {
      addConversationToMultipleContexts(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts
      ).catch((err: Error) => console.error('[Grok API] Multi-context memory storage failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      provider: 'grok',
      usage: {
        input_tokens: response.usage?.prompt_tokens,
        output_tokens: response.usage?.completion_tokens,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

