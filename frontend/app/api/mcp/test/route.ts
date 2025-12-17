/**
 * MCP Test Route
 * Verify MCP server works correctly
 */

import { NextRequest, NextResponse } from 'next/server';
// MCP temporarily disabled - module not yet implemented
// import { createMCPClient } from '@/lib/mcp';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Single-user system: Use constant user ID
    // TODO: For multi-user, restore requireAuth(request)
    try {
      await requireAuth(request);
    } catch (authError) {
      // Single-user mode: Allow access
    }
    
    // MCP not yet implemented
    return NextResponse.json({
      success: false,
      message: 'MCP module not yet implemented',
      error: 'MCP server, client, and tools are not yet implemented',
    });
    // const mcp = createMCPClient();
    
    // Test listing tools
    const tools = mcp.listTools();
    
    // Test getting tool docs
    const calendarDocs = mcp.getToolDocs('calendar');
    const memoryDocs = mcp.getToolDocs('memory');
    
    return NextResponse.json({
      success: true,
      message: 'MCP Server operational',
      tools: tools,
      docs: {
        calendar: calendarDocs,
        memory: memoryDocs,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

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
    const { tool, method, params } = await request.json();
    
    // Ensure userId from auth is used, not from params (security)
    // Always ensure userId is present in params object
    const safeParams = params && typeof params === 'object' 
      ? { ...params, userId }
      : { userId };
    
    if (!tool || !method) {
      return NextResponse.json({
        success: false,
        error: 'Missing tool or method',
      }, { status: 400 });
    }
    
    const result = await mcp.useTool(tool, method, safeParams);
    
    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

