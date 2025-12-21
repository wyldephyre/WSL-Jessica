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
 * Get the base URL for API calls
 * Uses absolute URL when running server-side (Next.js API routes)
 */
function getApiBaseUrl(): string {
  // Server-side: use localhost:3000 (Next.js dev server)
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }
  // Client-side: use relative URL
  return '';
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
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/memory/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': options.user_id,
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 10,
        ...(options.context && { context: options.context }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory search error: ${response.statusText}`);
    }

    const data = await response.json();
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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/memory/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': memory.user_id,
    },
    body: JSON.stringify({
      content: memory.content,
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
 * Get all memories for a user via backend proxy (SECURITY FIX)
 */
export async function getAllMemories(
  userId: string,
  context?: MemoryContext
): Promise<Memory[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/memory/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        ...(context && { 'X-Context': context }),
      },
    });

    if (!response.ok) {
      throw new Error(`Memory error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/memory/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
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
 * Delete a memory via backend proxy (SECURITY FIX)
 */
export async function deleteMemory(id: string, userId: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/memory/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete memory: ${response.statusText}`);
  }
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

