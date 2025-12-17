import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/api/anthropic';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';
// MCP tools temporarily disabled - files missing
// TODO: Re-enable when MCP module is fully implemented
// import { getMCPServer, createMCPClient } from '@/lib/mcp';

/**
 * Convert MCP tools to Anthropic function calling format
 * Currently returns empty array - MCP not yet implemented
 */
function getMCPToolsForClaude(): Array<{
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}> {
  // MCP tools disabled until module is complete
  return [];
}

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

    // Build system prompt using master prompt system
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

    const systemPrompt = buildSystemPrompt({
      memoryContext: combinedMemoryContext,
      additionalInstructions: `Memory context namespace: ${context}`,
    });

    // Get MCP tools for Claude function calling
    const tools = getMCPToolsForClaude();
    // MCP client temporarily disabled
    // const mcp = createMCPClient();

    // Initialize conversation messages
    const messages: Array<{
      role: 'user' | 'assistant';
      content: string | Array<any>;
    }> = [
      { role: 'user', content: message }
    ];

    // Call Claude with tool support and handle tool_use loop
    const client = getAnthropicClient();
    let finalResponse;
    let assistantMessage = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const maxToolIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxToolIterations) {
      const response = await client.messages.create({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages as any,
        tools: tools.length > 0 ? tools : undefined,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Check if Claude wants to use a tool
      if (response.stop_reason === 'tool_use') {
        // Extract tool use requests from response content
        const toolUses = response.content.filter(
          (item: any) => item.type === 'tool_use'
        ) as Array<{
          id: string;
          name: string;
          input: Record<string, any>;
        }>;

        // Add assistant's tool use to conversation
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Execute each tool use
        for (const toolUse of toolUses) {
          // Parse function name: tool_method (split on first underscore only)
          const underscoreIndex = toolUse.name.indexOf('_');
          if (underscoreIndex === -1 || underscoreIndex === 0 || underscoreIndex === toolUse.name.length - 1) {
            console.error(`[Claude API] Invalid tool name format: ${toolUse.name}. Expected format: tool_method`);
            continue;
          }
          
          const toolName = toolUse.name.substring(0, underscoreIndex);
          const methodName = toolUse.name.substring(underscoreIndex + 1);
          
          if (!toolName || !methodName) {
            console.error(`[Claude API] Invalid tool name format: ${toolUse.name}`);
            continue;
          }

          try {
            // MCP tools disabled - return a structured error result so the loop can continue safely.
            console.warn(`[Claude API] MCP tools not available - tool ${toolUse.name} cannot be executed`);
            const toolResult = {
              error: 'MCP tools are not yet implemented',
              tool: toolUse.name,
              toolName,
              methodName,
            };

            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(toolResult),
                  is_error: true,
                },
              ],
            } as any);
          } catch (error) {
            console.error(`[Claude API] Tool execution failed for ${toolUse.name}:`, error);
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  is_error: true,
                },
              ],
            } as any);
          }
        }

        iteration++;
        continue; // Loop to continue conversation with tool results
      } else {
        // Normal response - extract text content
        finalResponse = response;
        const textContent = (response.content as any[]).find((item) => item?.type === 'text') as any;
        assistantMessage = textContent?.text || '';
        break; // Exit loop
      }
    }

    if (iteration >= maxToolIterations) {
      console.warn('[Claude API] Max tool iterations reached');
      // Use the last response even if it's a tool_use
      const textContent = ((finalResponse as any)?.content as any[] | undefined)?.find((item) => item?.type === 'text') as any;
      assistantMessage = textContent?.text || 'Maximum tool execution iterations reached.';
    }

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts[0]
      ).catch((err: Error) => console.error('[Claude API] Memory storage failed:', err));
    } else {
      addConversationToMultipleContexts(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ],
        userId,
        memoryContexts
      ).catch((err: Error) => console.error('[Claude API] Multi-context memory storage failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      provider: 'claude',
      usage: {
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

