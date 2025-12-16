/**
 * Production MCP Endpoint
 * Tool discovery and execution for Jessica's MCP implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';

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
    
    return NextResponse.json({
      success: true,
      tools: [], // MCP not yet implemented
      message: 'MCP module not yet implemented',
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
    
    // MCP is intentionally disabled until the module is fully implemented.
    throw new ValidationError(`MCP module not yet implemented (user: ${userId})`);
  } catch (error) {
    return handleApiError(error);
  }
}

