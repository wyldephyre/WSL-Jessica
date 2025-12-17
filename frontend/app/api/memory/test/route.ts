/**
 * Memory Test API
 * Utility endpoint to test Mem0 connection and verify user_id
 */

import { NextRequest, NextResponse } from 'next/server';
 

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Deprecated. Use /api/memory instead.',
    },
    { status: 410 }
  );
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Deprecated. Use /api/memory instead.',
    },
    { status: 410 }
  );
}

