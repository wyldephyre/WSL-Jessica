import { env } from '@/lib/config/env';
import { MemoryContext } from '@/lib/types/memory';

export interface Memory {
  id?: string;
  content: string;
  user_id: string;
  context?: MemoryContext;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface MemorySearchOptions {
  user_id: string;
  context?: MemoryContext;
  limit?: number;
}

/**
 * Get Mem0 memory client (simplified - uses API directly)
 */
export function getMemoryClient() {
  return {
    apiKey: env.MEM0_API_KEY,
    baseUrl: 'https://api.mem0.ai/v1',
    userId: 'PhyreBug', // Default user ID
  };
}

/**
 * Search memories using Mem0 API
 */
export async function searchMemories(
  query: string,
  options: MemorySearchOptions
): Promise<Memory[]> {
  if (!env.MEM0_API_KEY) {
    console.warn('MEM0_API_KEY not configured');
    return [];
  }

  try {
    const client = getMemoryClient();
    const response = await fetch(`${client.baseUrl}/memories/search/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        user_id: options.user_id || client.userId,
        limit: options.limit || 10,
        ...(options.context && { context: options.context }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Mem0 API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching memories:', error);
    return [];
  }
}

/**
 * Add a new memory
 */
export async function addMemory(memory: Memory): Promise<Memory> {
  if (!env.MEM0_API_KEY) {
    throw new Error('MEM0_API_KEY not configured');
  }

  const client = getMemoryClient();
  const response = await fetch(`${client.baseUrl}/memories/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${client.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: memory.content }],
      user_id: memory.user_id || client.userId,
      ...(memory.context && { context: memory.context }),
      ...(memory.metadata && { metadata: memory.metadata }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add memory: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get all memories for a user
 */
export async function getAllMemories(
  userId: string,
  context?: MemoryContext
): Promise<Memory[]> {
  if (!env.MEM0_API_KEY) {
    console.warn('MEM0_API_KEY not configured');
    return [];
  }

  try {
    const client = getMemoryClient();
    const url = new URL(`${client.baseUrl}/memories/`);
    url.searchParams.set('user_id', userId || client.userId);
    if (context) {
      url.searchParams.set('context', context);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Token ${client.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mem0 API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error getting all memories:', error);
    return [];
  }
}

/**
 * Update an existing memory
 */
export async function updateMemory(
  id: string,
  content: string,
  metadata?: Record<string, any>
): Promise<Memory> {
  if (!env.MEM0_API_KEY) {
    throw new Error('MEM0_API_KEY not configured');
  }

  const client = getMemoryClient();
  const response = await fetch(`${client.baseUrl}/memories/${id}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${client.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      ...(metadata && { metadata }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update memory: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a memory
 */
export async function deleteMemory(id: string): Promise<void> {
  if (!env.MEM0_API_KEY) {
    throw new Error('MEM0_API_KEY not configured');
  }

  const client = getMemoryClient();
  const response = await fetch(`${client.baseUrl}/memories/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${client.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete memory: ${response.statusText}`);
  }
}

/**
 * Add conversation to memory
 */
export async function addConversation(
  userMessage: string,
  assistantMessage: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const content = `User: ${userMessage}\nAssistant: ${assistantMessage}`;
  await addMemory({
    content,
    user_id: userId,
    context: 'personal', // Use 'personal' as default context for conversations
    metadata: {
      ...metadata,
      type: 'conversation',
    },
  });
}

/**
 * Add conversation to multiple contexts
 */
export async function addConversationToMultipleContexts(
  userMessage: string,
  assistantMessage: string,
  userId: string,
  contexts: MemoryContext[],
  metadata?: Record<string, any>
): Promise<void> {
  const content = `User: ${userMessage}\nAssistant: ${assistantMessage}`;
  
  await Promise.all(
    contexts.map((context) =>
      addMemory({
        content,
        user_id: userId,
        context, // contexts are already MemoryContext type
        metadata: {
          ...metadata,
          type: 'conversation',
        },
      })
    )
  );
}

/**
 * Get core relationship memories
 */
export async function getCoreRelationshipMemories(
  userId: string
): Promise<Memory[]> {
  return searchMemories('relationship core values preferences', {
    user_id: userId,
    context: 'personal',
    limit: 5,
  });
}

