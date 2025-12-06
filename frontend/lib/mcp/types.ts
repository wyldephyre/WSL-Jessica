/**
 * MCP Type Definitions
 * Standard interfaces for all MCP tools and operations
 */

import { z } from 'zod';

/**
 * Tool method function signature
 */
export type ToolMethod<TParams = any, TResult = any> = (
  params: TParams
) => Promise<TResult>;

/**
 * MCP Tool interface
 * Every tool must implement this structure
 */
export interface MCPTool {
  /** Unique tool identifier */
  name: string;
  
  /** Human-readable description of what this tool does */
  description: string;
  
  /** Available methods on this tool */
  methods: Record<string, ToolMethod>;
  
  /** Optional: Zod schemas for parameter validation */
  schemas?: Record<string, z.ZodSchema>;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Tool execution context
 * Passed to all tool methods for authentication, logging, etc.
 */
export interface ToolContext {
  userId: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

