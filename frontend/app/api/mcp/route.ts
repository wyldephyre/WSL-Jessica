/**
 * Production MCP Endpoint
 * Tool discovery and execution for Jessica's MCP implementation
 */

import { NextRequest, NextResponse } from 'next/server';
// MCP temporarily disabled - module not yet implemented
// import { createMCPClient, getMCPServer } from '@/lib/mcp';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { z } from 'zod';

/**
 * Schema for tool execution request validation
 */
const ExecuteToolSchema = z.object({
  tool: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Tool name must contain only alphanumeric characters, underscores, or hyphens'),
  method: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Method name must contain only alphanumeric characters, underscores, or hyphens'),
  params: z.any().optional().refine(
    (obj) => {
      if (obj === undefined || obj === null) return true;
      if (typeof obj !== 'object') return false;
      try {
        const jsonStr = JSON.stringify(obj);
        return jsonStr.length < 10000; // 10KB limit
      } catch {
        return false;
      }
    },
    { message: 'Parameters too large (max 10KB) or invalid format' }
  ),
});

/**
 * GET /api/mcp
 * List all registered tools with names, descriptions, and methods
 */
export async function GET(request: NextRequest) {
  try {
    // Single-user system: Use constant user ID
    // TODO: For multi-user, restore requireAuth(request)
    try {
      await requireAuth(request);
    } catch (authError) {
      // Single-user mode: Allow access with constant user ID
      // MCP not yet implemented anyway
    }
    
    // MCP not yet implemented - return empty tools list
    // const server = getMCPServer();
    // const tools = server.listTools();
    
    return NextResponse.json({
      success: true,
      tools: [], // MCP not yet implemented
      message: 'MCP module not yet implemented',
    });
    
    // Get all tools from server (returns MCPTool[])
    const tools = server.listTools();
    
    // Transform tools to include methods
    const toolsWithMethods = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      methods: Object.keys(tool.methods),
    }));
    
    return NextResponse.json({
      success: true,
      tools: toolsWithMethods,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/mcp
 * Execute an MCP tool method
 */
export async function POST(request: NextRequest) {
  try {
    // Single-user system: Use constant user ID
    // TODO: For multi-user, restore requireAuth(request)
    let userId: string;
    try {
      const authResult = await requireAuth(request);
      userId = authResult.userId;
    } catch (authError) {
      // Single-user mode: Use constant user ID if auth fails
      userId = 'PhyreBug'; // Match backend USER_ID constant
    }
    
    // MCP not yet implemented
    throw new Error('MCP module not yet implemented');
    // const mcp = createMCPClient();
    const body = await request.json();
    
    // Validate and sanitize input using Zod schema
    let validated;
    try {
      validated = ExecuteToolSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid request: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
    
    const { tool, method, params } = validated;
    
    // Ensure userId from auth is used, not from params (security)
    const safeParams = params && typeof params === 'object' 
      ? { ...params, userId }
      : { userId };
    
    // Execute tool via MCP client
    const result = await mcp.useTool(tool, method, safeParams);
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

