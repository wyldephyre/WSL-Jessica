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
 * DEPRECATED: Direct memory client removed for security
 * All memory operations now go through backend routes
 */
export function getMemoryClient() {
  throw new Error('Direct memory client deprecated for security. Use backend routes.');
}

/**
 * Search memories via backend proxy (SECURITY FIX)
 */
export async function searchMemories(
  query: string,
  options: MemorySearchOptions
): Promise<Memory[]> {
  try {
    const response = await fetch(`${env.API_URL}/memory/cloud/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 10,
        // context is currently handled inside Jessica Core / local memory layer
        ...(options.context && { context: options.context }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory search error: ${response.statusText}`);
    }

    const data = await response.json();
    // Jessica Core returns { results: [...] }
    return data.results || [];
  } catch (error) {
    console.error('Error searching memories:', error);
    return [];
  }
}

/**
 * Add a new memory via backend proxy (SECURITY FIX)
 */
export async function addMemory(memory: Memory): Promise<Memory> {
  const response = await fetch(`${env.API_URL}/memory/cloud/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: memory.content,
      metadata: {
        ...(memory.context ? { context: memory.context } : {}),
        ...(memory.metadata || {}),
        // keep user_id in metadata for traceability even in single-user mode
        user_id: memory.user_id,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add memory: ${response.statusText}`);
  }

  const data = await response.json();
  // Normalize to Memory shape (Mem0 returns provider-specific fields)
  return {
    content: memory.content,
    user_id: memory.user_id,
    context: memory.context,
    metadata: memory.metadata,
    id: data?.result?.id || data?.result?.memory_id || undefined,
    created_at: data?.result?.created_at || undefined,
    updated_at: data?.result?.updated_at || undefined,
  };
}

/**
 * Get all memories for a user via backend proxy (SECURITY FIX)
 */
export async function getAllMemories(
  userId: string,
  context?: MemoryContext
): Promise<Memory[]> {
  try {
    // Jessica Core endpoint returns Mem0 cloud memories for the single-user deployment.
    const response = await fetch(`${env.API_URL}/memory/cloud/all`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Memory error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = (data.results || []) as any[];
    // Best-effort normalize to our Memory shape.
    return results.map((r) => ({
      id: r.id || r.memory_id,
      content: r.memory || r.content || '',
      user_id: userId,
      context,
      metadata: r.metadata || undefined,
      created_at: r.created_at || undefined,
      updated_at: r.updated_at || undefined,
    }));
  } catch (error) {
    console.error('Error getting all memories:', error);
    return [];
  }
}

/**
 * Update an existing memory via backend proxy (SECURITY FIX)
 */
export async function updateMemory(
  id: string,
  content: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<Memory> {
  // Mem0 update is not yet exposed via Jessica Core.
  // Foundational approach: treat updates as append-only (add a new memory).
  await addMemory({
    content,
    user_id: userId,
    metadata: { ...(metadata || {}), replaces_id: id },
  });
  return { id, content, user_id: userId, metadata };
}

/**
 * Delete a memory via backend proxy (SECURITY FIX)
 */
export async function deleteMemory(id: string, userId: string): Promise<void> {
  // Mem0 delete is not yet exposed via Jessica Core.
  // Add a tombstone marker so "deletes" are still reflected in the cloud history.
  await addMemory({
    content: `[TOMBSTONE] delete memory id=${id}`,
    user_id: userId,
    metadata: { type: 'tombstone', target_id: id },
  });
}

/**
 * Add conversation to memory (SECURITY FIX: Updated signature to match actual usage)
 */
export async function addConversation(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  context?: MemoryContext,
  metadata?: Record<string, any>
): Promise<void> {
  // Extract user and assistant messages from the array
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const assistantMsg = messages.find(m => m.role === 'assistant')?.content || '';
  
  const content = `User: ${userMsg}\nAssistant: ${assistantMsg}`;
  await addMemory({
    content,
    user_id: userId,
    context: context || 'personal', // Use provided context or default to 'personal'
    metadata: {
      ...metadata,
      type: 'conversation',
    },
  });
}

/**
 * Add conversation to multiple contexts (SECURITY FIX: Updated signature to match actual usage)
 */
export async function addConversationToMultipleContexts(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  contexts: MemoryContext[],
  metadata?: Record<string, any>
): Promise<void> {
  // Extract user and assistant messages from the array
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const assistantMsg = messages.find(m => m.role === 'assistant')?.content || '';
  
  const content = `User: ${userMsg}\nAssistant: ${assistantMsg}`;
  
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

