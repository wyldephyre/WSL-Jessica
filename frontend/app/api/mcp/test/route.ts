/**
 * MCP Test Route
 * Verify MCP server works correctly
 */

import { NextRequest, NextResponse } from 'next/server';
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
    }, { status: 501 });
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
    return NextResponse.json({
      success: false,
      error: `MCP module not yet implemented (user: ${userId})`,
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

