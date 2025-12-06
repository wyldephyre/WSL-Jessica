/**
 * Memory-related TypeScript types
 */

export type MemoryContext = 'personal' | 'business' | 'creative' | 'core' | 'relationship';

/**
 * All available memory contexts in order
 */
export const MEMORY_CONTEXTS: readonly MemoryContext[] = ['personal', 'business', 'creative', 'core', 'relationship'] as const;

export interface Memory {
  id: string;
  content: string;
  context: MemoryContext;
  metadata: MemoryMetadata;
  timestamp: Date | string;
  importance?: number; // 0.0 to 1.0
}

export interface MemoryMetadata {
  context: MemoryContext;
  type: 'foundational' | 'conversation' | 'manual' | 'automatic' | 'test';
  importance?: number;
  source?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface MemorySearchResult {
  memory: string;
  score: number;
  metadata?: MemoryMetadata;
}

export interface MemorySearchOptions {
  user_id: string;
  context?: MemoryContext;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface AddMemoryOptions {
  content: string;
  user_id: string;
  context: MemoryContext;
  metadata?: Partial<MemoryMetadata>;
}

