/**
 * MCP Test Route
 * Verify MCP server works correctly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMCPClient } from '@/lib/mcp';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication even for test endpoint
    await requireAuth(request);
    
    const mcp = createMCPClient();
    
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
    // Require authentication
    const { userId } = await requireAuth(request);
    
    const mcp = createMCPClient();
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

