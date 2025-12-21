/**
 * Letta API Client
 * Handles long-term memory storage and retrieval via Letta
 */

// Letta API configuration
const LETTA_API_BASE_URL = process.env.LETTA_API_BASE_URL || 'https://api.letta.ai/v1';

export interface LettaMemory {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LettaSearchParams {
  query: string;
  limit?: number;
  user_id: string;
  context?: string;
}

/**
 * Get Letta API authentication token
 * TODO: Implement Letta authentication flow
 */
async function getLettaToken(): Promise<string> {
  // TODO: Implement Letta authentication
  const token = process.env.LETTA_API_KEY || '';
  if (!token) {
    throw new Error('Letta API key not configured');
  }
  return token;
}

/**
 * Add a memory to Letta
 */
export async function lettaAddMemory(
  content: string,
  user_id: string,
  metadata?: Record<string, any>
): Promise<LettaMemory> {
  const token = await getLettaToken();
  
  const response = await fetch(`${LETTA_API_BASE_URL}/memories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      user_id,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Letta API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search memories in Letta
 */
export async function lettaSearchMemories(
  params: LettaSearchParams
): Promise<LettaMemory[]> {
  const token = await getLettaToken();
  
  const response = await fetch(`${LETTA_API_BASE_URL}/memories/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      user_id: params.user_id,
      limit: params.limit || 5,
      context: params.context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Letta API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.memories || data.results || [];
}

/**
 * Get all memories for a user from Letta
 */
export async function lettaGetAllMemories(
  user_id: string,
  context?: string
): Promise<LettaMemory[]> {
  const token = await getLettaToken();
  
  const queryParams = new URLSearchParams({ user_id });
  if (context) queryParams.append('context', context);

  const response = await fetch(`${LETTA_API_BASE_URL}/memories?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Letta API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.memories || data.results || [];
}

/**
 * Update a memory in Letta
 */
export async function lettaUpdateMemory(
  memoryId: string,
  content?: string,
  metadata?: Record<string, any>
): Promise<LettaMemory> {
  const token = await getLettaToken();
  
  const response = await fetch(`${LETTA_API_BASE_URL}/memories/${memoryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Letta API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a memory from Letta
 */
export async function lettaDeleteMemory(memoryId: string): Promise<void> {
  const token = await getLettaToken();
  
  const response = await fetch(`${LETTA_API_BASE_URL}/memories/${memoryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Letta API error: ${response.statusText}`);
  }
}

