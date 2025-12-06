import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/api/anthropic';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';
import { getMCPServer, createMCPClient } from '@/lib/mcp';

/**
 * Convert MCP tools to Anthropic function calling format
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
  const server = getMCPServer();
  const tools = server.listTools();
  
  const anthropicTools: Array<{
    name: string;
    description: string;
    input_schema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  }> = [];
  
  // Convert each MCP tool method to Anthropic function format
  for (const tool of tools) {
    for (const [methodName, method] of Object.entries(tool.methods)) {
      // Create function name: tool_method
      const functionName = `${tool.name}_${methodName}`;
      
      // Create description
      const description = `${tool.description} - ${methodName} method`;
      
      // Infer basic parameter schema (generic object for now)
      // In a more sophisticated implementation, we could use Zod schemas from tool.schemas
      const inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
      } = {
        type: 'object',
        properties: {
          // Common parameters that most methods might need
          userId: {
            type: 'string',
            description: 'User ID (automatically provided)',
          },
        },
        required: ['userId'],
      };
      
      // If tool has Zod schemas, use them to generate JSON schema
      if (tool.schemas && tool.schemas[methodName]) {
        // For now, use generic schema - could enhance with Zod-to-JSON-Schema conversion
        inputSchema.properties = {
          ...inputSchema.properties,
          // Add other common params based on method signature inference
        };
      }
      
      anthropicTools.push({
        name: functionName,
        description,
        input_schema: inputSchema,
      });
    }
  }
  
  return anthropicTools;
}

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

    // Get MCP tools for Claude function calling
    const tools = getMCPToolsForClaude();
    const mcp = createMCPClient();

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
            // Ensure userId is set in params
            const toolParams = {
              ...toolUse.input,
              userId,
            };

            // Execute tool via MCP client
            const toolResult = await mcp.useTool(toolName, methodName, toolParams);

            // Add tool result to conversation
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(toolResult),
                },
              ],
            } as any);
          } catch (error) {
            console.error(`[Claude API] Tool execution failed for ${toolUse.name}:`, error);
            // Add error result
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
        const textContent = response.content.find(
          (item: any): item is { type: 'text'; text: string } => item.type === 'text'
        );
        assistantMessage = textContent?.text || '';
        break; // Exit loop
      }
    }

    if (iteration >= maxToolIterations) {
      console.warn('[Claude API] Max tool iterations reached');
      // Use the last response even if it's a tool_use
      const textContent = finalResponse?.content?.find(
        (item: any): item is { type: 'text'; text: string } => item.type === 'text'
      );
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

